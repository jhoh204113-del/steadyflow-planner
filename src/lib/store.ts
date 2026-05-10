import { useEffect, useState, useSyncExternalStore } from "react";

export type Subtask = { id: string; title: string; done: boolean };

export type Assignment = {
  id: string;
  title: string;
  subject: string;
  description?: string;
  dueDate: string; // ISO
  estimatedHours: number;
  hoursCompleted: number;
  subtasks: Subtask[];
  createdAt: string;
};

export type FocusSession = {
  id: string;
  startedAt: string;
  minutes: number;
  assignmentId?: string;
};

export type AppState = {
  assignments: Assignment[];
  sessions: FocusSession[];
  xp: number;
  streakDays: number;
  lastActiveDate: string | null;
};

const KEY = "calmstudy.state.v1";

const seed = (): AppState => {
  const now = new Date();
  const inDays = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();
  return {
    assignments: [
      {
        id: crypto.randomUUID(),
        title: "History essay: Industrial Revolution",
        subject: "History",
        description: "1500-word essay on social impacts.",
        dueDate: inDays(6),
        estimatedHours: 8,
        hoursCompleted: 2,
        createdAt: now.toISOString(),
        subtasks: [
          { id: crypto.randomUUID(), title: "Choose a focused angle", done: true },
          { id: crypto.randomUUID(), title: "Gather 5 reliable sources", done: true },
          { id: crypto.randomUUID(), title: "Draft a working thesis", done: false },
          { id: crypto.randomUUID(), title: "Outline body paragraphs", done: false },
          { id: crypto.randomUUID(), title: "Write introduction", done: false },
          { id: crypto.randomUUID(), title: "Write body & conclusion", done: false },
          { id: crypto.randomUUID(), title: "Proofread and final edit", done: false },
        ],
      },
      {
        id: crypto.randomUUID(),
        title: "Calculus problem set 4",
        subject: "Math",
        dueDate: inDays(2),
        estimatedHours: 3,
        hoursCompleted: 0.5,
        createdAt: now.toISOString(),
        subtasks: [
          { id: crypto.randomUUID(), title: "Review lecture notes", done: true },
          { id: crypto.randomUUID(), title: "Solve problems 1–5", done: false },
          { id: crypto.randomUUID(), title: "Solve problems 6–10", done: false },
          { id: crypto.randomUUID(), title: "Check answers", done: false },
        ],
      },
    ],
    sessions: [],
    xp: 120,
    streakDays: 3,
    lastActiveDate: null,
  };
};

let state: AppState = (() => {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {}
  const s = seed();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  return s;
})();

const listeners = new Set<() => void>();
const emit = () => {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((l) => l());
};

export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const getState = () => state;

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

// Hydration-safe wrapper for client-only data
export function useClientStore<T>(selector: (s: AppState) => T, fallback: T): T {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const value = useStore(selector);
  return mounted ? value : fallback;
}

export const actions = {
  addAssignment(a: Omit<Assignment, "id" | "createdAt" | "subtasks" | "hoursCompleted"> & { subtasks?: Subtask[] }) {
    const assignment: Assignment = {
      ...a,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      hoursCompleted: 0,
      subtasks: a.subtasks ?? [],
    };
    state = { ...state, assignments: [assignment, ...state.assignments] };
    emit();
    return assignment;
  },
  toggleSubtask(assignmentId: string, subtaskId: string) {
    state = {
      ...state,
      assignments: state.assignments.map((a) =>
        a.id !== assignmentId
          ? a
          : {
              ...a,
              subtasks: a.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)),
            },
      ),
    };
    emit();
  },
  deleteAssignment(id: string) {
    state = { ...state, assignments: state.assignments.filter((a) => a.id !== id) };
    emit();
  },
  logSession(minutes: number, assignmentId?: string) {
    const session: FocusSession = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      minutes,
      assignmentId,
    };
    const today = new Date().toDateString();
    const last = state.lastActiveDate ? new Date(state.lastActiveDate).toDateString() : null;
    let streak = state.streakDays;
    if (last !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = last === yesterday ? streak + 1 : 1;
    }
    // XP capped per session to avoid grinding (max 50/session)
    const xpGain = Math.min(50, Math.round(minutes * 1.5));
    state = {
      ...state,
      sessions: [session, ...state.sessions],
      xp: state.xp + xpGain,
      streakDays: streak,
      lastActiveDate: new Date().toISOString(),
      assignments: assignmentId
        ? state.assignments.map((a) =>
            a.id === assignmentId ? { ...a, hoursCompleted: +(a.hoursCompleted + minutes / 60).toFixed(2) } : a,
          )
        : state.assignments,
    };
    emit();
    return xpGain;
  },
};

// Mock AI breakdown
export function generateSubtasks(title: string, description?: string): Subtask[] {
  const t = (title + " " + (description || "")).toLowerCase();
  const make = (titles: string[]): Subtask[] =>
    titles.map((title) => ({ id: crypto.randomUUID(), title, done: false }));

  if (/essay|paper|writ/.test(t)) {
    return make([
      "Pick a focused angle",
      "Find 3–5 sources",
      "Draft a working thesis",
      "Outline main points",
      "Write a rough introduction",
      "Write body paragraphs",
      "Write conclusion",
      "Proofread and final edit",
    ]);
  }
  if (/present|slide|deck/.test(t)) {
    return make([
      "Define key message",
      "Outline slide flow",
      "Build draft slides",
      "Add visuals & polish",
      "Practice once aloud",
    ]);
  }
  if (/exam|test|quiz|study/.test(t)) {
    return make([
      "Gather notes & materials",
      "Make a topic checklist",
      "Active recall: round 1",
      "Practice problems",
      "Active recall: round 2",
      "Light review the day before",
    ]);
  }
  if (/problem set|homework|exercise|math/.test(t)) {
    return make([
      "Review related notes (10 min)",
      "Try the easiest problems first",
      "Work through the middle set",
      "Tackle the harder problems",
      "Check & correct answers",
    ]);
  }
  if (/project|build|design|code/.test(t)) {
    return make([
      "Clarify the goal & deliverable",
      "Sketch a rough plan",
      "Build the smallest version",
      "Iterate & improve",
      "Polish & submit",
    ]);
  }
  return make([
    "Read the brief carefully",
    "Break it into 3 parts",
    "Start with a 5-minute attempt",
    "Complete the main work",
    "Review & submit",
  ]);
}

export function riskOf(a: Assignment): "low" | "medium" | "high" {
  const days = Math.max(0, (new Date(a.dueDate).getTime() - Date.now()) / 86400000);
  const remaining = Math.max(0, a.estimatedHours - a.hoursCompleted);
  if (days < 0.5 && remaining > 0.5) return "high";
  const hoursPerDay = days > 0 ? remaining / days : remaining;
  if (hoursPerDay > 3) return "high";
  if (hoursPerDay > 1.5) return "medium";
  return "low";
}
