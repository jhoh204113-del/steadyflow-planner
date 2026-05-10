import { createFileRoute, Link } from "@tanstack/react-router";
import { useClientStore } from "@/lib/store";
import { AssignmentCard } from "@/components/AssignmentCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Timer, ListChecks } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Your calm dashboard — Stillpath" },
      { name: "description", content: "See upcoming work, your streak, and gentle next steps." },
    ],
  }),
});

const messages = [
  "Consistency matters more than perfection.",
  "Small steps still count. Try a 5-minute start.",
  "You don't have to feel ready to begin.",
  "One focused session is enough for today.",
  "Rest is part of the work.",
];

function Dashboard() {
  const assignments = useClientStore((s) => s.assignments, []);
  const sessions = useClientStore((s) => s.sessions, []);
  const xp = useClientStore((s) => s.xp, 0);
  const streak = useClientStore((s) => s.streakDays, 0);

  const todayMinutes = sessions
    .filter((s) => new Date(s.startedAt).toDateString() === new Date().toDateString())
    .reduce((n, s) => n + s.minutes, 0);

  const sorted = [...assignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
  const msg = messages[new Date().getDate() % messages.length];

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-calm p-8 shadow-soft md:p-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Today's gentle reminder
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {msg}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            You've focused {todayMinutes} minutes today. A short, kind effort is more than enough.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-xl bg-gradient-primary shadow-glow">
              <Link to="/focus">
                <Timer className="h-4 w-4" /> Start a 5-minute session
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link to="/tasks">
                <ListChecks className="h-4 w-4" /> Plan a task
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Streak" value={`${streak} days`} hint="Showing up matters" />
        <Stat label="Today's focus" value={`${todayMinutes} min`} hint="Every minute counts" />
        <Stat label="XP" value={`${xp}`} hint="Earned through consistency" />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Upcoming work</h2>
            <p className="text-sm text-muted-foreground">Your next steps, broken into kinder pieces.</p>
          </div>
          <Link to="/tasks" className="text-sm font-medium text-primary hover:underline">
            All tasks <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-muted-foreground">No assignments yet. Add one and we'll break it down for you.</p>
            <Button asChild className="mt-4 rounded-xl bg-gradient-primary">
              <Link to="/tasks">Add your first task</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sorted.slice(0, 6).map((a) => (
              <AssignmentCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
