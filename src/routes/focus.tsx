import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { actions, useClientStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Pause, Play, RotateCcw, Coffee, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/focus")({
  component: FocusPage,
  head: () => ({ meta: [{ title: "Focus — Stillpath" }] }),
});

type Mode = "focus" | "break";

function FocusPage() {
  const [focusLen, setFocusLen] = useState(25);
  const [breakLen, setBreakLen] = useState(5);
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const tickRef = useRef<number | null>(null);
  const total = (mode === "focus" ? focusLen : breakLen) * 60;

  const sessions = useClientStore((s) => s.sessions, []);
  const todayMinutes = sessions
    .filter((s) => new Date(s.startedAt).toDateString() === new Date().toDateString())
    .reduce((n, s) => n + s.minutes, 0);
  const weekMinutes = sessions
    .filter((s) => Date.now() - new Date(s.startedAt).getTime() < 7 * 86400000)
    .reduce((n, s) => n + s.minutes, 0);

  useEffect(() => {
    if (!running) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      return;
    }
    tickRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(tickRef.current!);
          setRunning(false);
          if (mode === "focus") {
            const xp = actions.logSession(focusLen);
            toast.success(`Nice. +${xp} XP — take a real break.`);
            setMode("break");
            setSecondsLeft(breakLen * 60);
          } else {
            toast("Break done. Begin gently when you're ready.");
            setMode("focus");
            setSecondsLeft(focusLen * 60);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running, mode, focusLen, breakLen]);

  useEffect(() => {
    if (!running) setSecondsLeft((mode === "focus" ? focusLen : breakLen) * 60);
  }, [focusLen, breakLen, mode, running]);

  const reset = () => {
    setRunning(false);
    setSecondsLeft((mode === "focus" ? focusLen : breakLen) * 60);
  };

  const startFiveMin = () => {
    setMode("focus");
    setFocusLen(5);
    setSecondsLeft(5 * 60);
    setRunning(true);
    toast("5 minutes. That's all. You can stop after.");
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const pct = total > 0 ? ((total - secondsLeft) / total) * 100 : 0;
  const C = 2 * Math.PI * 120;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Focus</h1>
        <p className="text-sm text-muted-foreground">
          Short, kind sessions. Stop whenever you need to — rest is part of the work.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="rounded-3xl border border-border/70 bg-gradient-calm p-8 shadow-soft">
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="280" height="280" viewBox="0 0 280 280">
                <circle cx="140" cy="140" r="120" fill="none" stroke="var(--color-muted)" strokeWidth="10" />
                <circle
                  cx="140" cy="140" r="120" fill="none"
                  stroke={mode === "focus" ? "var(--color-primary)" : "var(--color-success)"}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C - (C * pct) / 100}
                  transform="rotate(-90 140 140)"
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {mode === "focus" ? "Focus" : "Break"}
                </div>
                <div className="font-mono text-6xl font-semibold tracking-tight tabular-nums">
                  {mm}:{ss}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => setRunning((r) => !r)}
              className="rounded-xl bg-gradient-primary shadow-glow"
            >
              {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
            </Button>
            <Button size="lg" variant="outline" onClick={reset} className="rounded-xl">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button size="lg" variant="secondary" onClick={startFiveMin} className="rounded-xl">
              <Zap className="h-4 w-4" /> 5-minute start
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {(["focus", "break"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setRunning(false); }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  mode === m ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:bg-card/60",
                )}
              >
                {m === "focus" ? "Focus" : "Break"}
              </button>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold">Session lengths</h3>
            <div className="mt-3 space-y-3 text-sm">
              <Slider label="Focus" value={focusLen} setValue={setFocusLen} min={5} max={60} step={5} suffix="min" />
              <Slider label="Break" value={breakLen} setValue={setBreakLen} min={3} max={20} step={1} suffix="min" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold">Today</h3>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{todayMinutes} min</div>
            <div className="text-xs text-muted-foreground">{weekMinutes} min this week</div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-accent/40 p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Coffee className="h-4 w-4 text-primary" /> Gentle reminder
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              You don't have to feel motivated. You just have to start small.
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-accent/40 p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" /> Healthy rewards
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              XP is capped per session, so consistency matters more than grinding.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Slider({
  label, value, setValue, min, max, step, suffix,
}: {
  label: string; value: number; setValue: (n: number) => void;
  min: number; max: number; step: number; suffix: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium tabular-nums">{value} {suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => setValue(+e.target.value)}
        className="w-full accent-[color:var(--color-primary)]"
      />
    </div>
  );
}
