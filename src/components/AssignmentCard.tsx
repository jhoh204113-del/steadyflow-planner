import { Link } from "@tanstack/react-router";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { Assignment, riskOf } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const riskStyles: Record<string, { label: string; cls: string; msg: string }> = {
  low: {
    label: "On track",
    cls: "bg-success/15 text-success border-success/30",
    msg: "You're pacing nicely. Keep it gentle.",
  },
  medium: {
    label: "Stay steady",
    cls: "bg-warning/15 text-warning-foreground border-warning/40",
    msg: "A couple of focus sessions this week keeps this easy.",
  },
  high: {
    label: "Needs attention",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
    msg: "Try a 5-minute start — small steps still count.",
  },
};

export function AssignmentCard({ a }: { a: Assignment }) {
  const days = Math.max(0, Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000));
  const pct = Math.min(100, Math.round((a.hoursCompleted / Math.max(0.1, a.estimatedHours)) * 100));
  const done = a.subtasks.filter((s) => s.done).length;
  const risk = riskOf(a);
  const r = riskStyles[risk];

  return (
    <Link
      to="/tasks"
      className="group block rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {a.subject}
          </div>
          <h3 className="mt-1 truncate text-base font-semibold text-foreground">{a.title}</h3>
        </div>
        <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium", r.cls)}>
          {r.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> {days}d left
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {a.hoursCompleted.toFixed(1)}/{a.estimatedHours}h
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" /> {done}/{a.subtasks.length} steps
        </div>
      </div>

      <div className="mt-4">
        <Progress value={pct} className="h-2" />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">{pct}% complete</span>
          <span className="text-muted-foreground">{r.msg}</span>
        </div>
      </div>
    </Link>
  );
}
