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

export type QuestKind = "subtasks" | "focus_minutes" | "sessions" | "streak";
export type Quest = {
  id: string;
  title: string;
  description: string;
  kind: QuestKind;
  goal: number;
  xpReward: number;
  period: "daily" | "weekly";
  startedAt: string;
  claimed: boolean;
  baseline?: number; // counter snapshot at start (for cumulative kinds)
};

export type Friend = {
  id: string;
  name: string;
  emoji: string;
  xp: number;
  streak: number;
  todayMinutes: number;
  lastNudgeAt?: string;
};

export type Circle = {
  id: string;
  name: string;
  description: string;
  memberIds: string[]; // friend ids; "me" represents the user
  joined: boolean;
  weeklyGoalMinutes: number;
};

export type Nudge = {
  id: string;
  fromId: string; // friend id or "me"
  toId: string;
  message: string;
  at: string;
  read: boolean;
};

export type AppState = {
  assignments: Assignment[];
  sessions: FocusSession[];
  xp: number;
  streakDays: number;
  lastActiveDate: string | null;
  quests: Quest[];
  questsRolledAt: string | null;
  friends: Friend[];
  circles: Circle[];
  nudges: Nudge[];
};

const KEY = "calmstudy.state.v2";

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
    quests: defaultQuests(0),
    questsRolledAt: new Date().toDateString(),
    friends: seedFriends(),
    circles: seedCircles(),
    nudges: [],
  };
};

function defaultQuests(subtaskBaseline = 0): Quest[] {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      title: "Tiny start",
      description: "Complete 3 subtasks today.",
      kind: "subtasks", goal: 3, xpReward: 30, period: "daily", startedAt: now, claimed: false,
      baseline: subtaskBaseline,
    },
    {
      id: crypto.randomUUID(),
      title: "Gentle focus",
      description: "Focus 25 minutes today.",
      kind: "focus_minutes", goal: 25, xpReward: 40, period: "daily", startedAt: now, claimed: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Steady week",
      description: "Complete 5 focus sessions this week.",
      kind: "sessions", goal: 5, xpReward: 100, period: "weekly", startedAt: now, claimed: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Showing up",
      description: "Reach a 5-day streak.",
      kind: "streak", goal: 5, xpReward: 80, period: "weekly", startedAt: now, claimed: false,
    },
  ];
}

function seedFriends(): Friend[] {
  return [
    { id: "f1", name: "Maya",   emoji: "🌿", xp: 340, streak: 6, todayMinutes: 50 },
    { id: "f2", name: "Leo",    emoji: "🌊", xp: 215, streak: 2, todayMinutes: 15 },
    { id: "f3", name: "Aiko",   emoji: "🌸", xp: 410, streak: 9, todayMinutes: 75 },
    { id: "f4", name: "Sam",    emoji: "☕", xp: 95,  streak: 1, todayMinutes: 0  },
    { id: "f5", name: "Noor",   emoji: "🪴", xp: 280, streak: 4, todayMinutes: 30 },
  ];
}

function seedCircles(): Circle[] {
  return [
    {
      id: "c1",
      name: "Quiet Mornings",
      description: "Calm study before noon. Soft accountability.",
      memberIds: ["me", "f1", "f3", "f5"],
      joined: true,
      weeklyGoalMinutes: 300,
    },
    {
      id: "c2",
      name: "Finals Together",
      description: "We're all preparing — let's keep each other steady.",
      memberIds: ["f2", "f4"],
      joined: false,
      weeklyGoalMinutes: 420,
    },
    {
      id: "c3",
      name: "Tiny Steps",
      description: "5-minute starts welcome. No pressure ever.",
      memberIds: ["f1", "f2", "f4"],
      joined: false,
      weeklyGoalMinutes: 180,
    },
  ];
}

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

function todayStr() { return new Date().toDateString(); }
function startOfWeek() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); return d.getTime();
}

function totalDoneSubtasks(s: AppState) {
  return s.assignments.reduce((n, a) => n + a.subtasks.filter((st) => st.done).length, 0);
}

export function questProgress(q: Quest, s: AppState): number {
  if (q.kind === "subtasks") {
    return Math.max(0, totalDoneSubtasks(s) - (q.baseline ?? 0));
  }
  if (q.kind === "focus_minutes") {
    const today = todayStr();
    return s.sessions
      .filter((x) => new Date(x.startedAt).toDateString() === today)
      .reduce((n, x) => n + x.minutes, 0);
  }
  if (q.kind === "sessions") {
    const since = startOfWeek();
    return s.sessions.filter((x) => new Date(x.startedAt).getTime() >= since).length;
  }
  if (q.kind === "streak") return s.streakDays;
  return 0;
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
    let nowDone = false;
    const assignments = state.assignments.map((a) => {
      if (a.id !== assignmentId) return a;
      return {
        ...a,
        subtasks: a.subtasks.map((s) => {
          if (s.id !== subtaskId) return s;
          nowDone = !s.done;
          return { ...s, done: !s.done };
        }),
      };
    });
    // Subtasks now grant +5 XP each (capped via quest claims)
    const xpDelta = nowDone ? 5 : -5;
    state = { ...state, assignments, xp: Math.max(0, state.xp + xpDelta) };
    emit();
    return nowDone;
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
  claimQuest(id: string): number {
    const q = state.quests.find((x) => x.id === id);
    if (!q || q.claimed) return 0;
    if (questProgress(q, state) < q.goal) return 0;
    state = {
      ...state,
      xp: state.xp + q.xpReward,
      quests: state.quests.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
    };
    emit();
    return q.xpReward;
  },
  rerollQuestsIfNeeded() {
    const today = todayStr();
    if (state.questsRolledAt === today) return;
    // refresh daily quests, keep weekly until they expire (simple: keep all)
    const fresh = defaultQuests(totalDoneSubtasks(state));
    const dailies = fresh.filter((q) => q.period === "daily");
    const weeklies = state.quests.filter((q) => q.period === "weekly");
    state = { ...state, quests: [...dailies, ...weeklies], questsRolledAt: today };
    emit();
  },
  joinCircle(id: string) {
    state = {
      ...state,
      circles: state.circles.map((c) =>
        c.id === id ? { ...c, joined: true, memberIds: c.memberIds.includes("me") ? c.memberIds : ["me", ...c.memberIds] } : c,
      ),
    };
    emit();
  },
  leaveCircle(id: string) {
    state = {
      ...state,
      circles: state.circles.map((c) =>
        c.id === id ? { ...c, joined: false, memberIds: c.memberIds.filter((m) => m !== "me") } : c,
      ),
    };
    emit();
  },
  sendNudge(toId: string, message: string) {
    const last = state.friends.find((f) => f.id === toId)?.lastNudgeAt;
    if (last && Date.now() - new Date(last).getTime() < 30 * 60 * 1000) {
      return false; // rate-limit nudges to once per 30 min per friend
    }
    const n: Nudge = {
      id: crypto.randomUUID(), fromId: "me", toId, message,
      at: new Date().toISOString(), read: false,
    };
    state = {
      ...state,
      nudges: [n, ...state.nudges],
      friends: state.friends.map((f) => (f.id === toId ? { ...f, lastNudgeAt: n.at } : f)),
    };
    emit();
    return true;
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
