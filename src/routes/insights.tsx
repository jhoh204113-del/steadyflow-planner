import { createFileRoute } from "@tanstack/react-router";
import { useClientStore } from "@/lib/store";
import { Award, Flame, Heart, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
  head: () => ({ meta: [{ title: "Insights — Stillpath" }] }),
});

function InsightsPage() {
  const sessions = useClientStore((s) => s.sessions, []);
  const xp = useClientStore((s) => s.xp, 0);
  const streak = useClientStore((s) => s.streakDays, 0);

  // last 7 days bar data
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const minutes = sessions
      .filter((s) => new Date(s.startedAt).toDateString() === key)
      .reduce((n, s) => n + s.minutes, 0);
    return { label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2), minutes };
  });
  const max = Math.max(60, ...days.map((d) => d.minutes));

  const badges = [
    { name: "First Step", desc: "Started your first session", earned: sessions.length > 0, icon: Heart },
    { name: "Steady Three", desc: "3-day streak", earned: streak >= 3, icon: Flame },
    { name: "Deep Hour", desc: "Focused 60 min in a day", earned: days.some((d) => d.minutes >= 60), icon: TrendingUp },
    { name: "Mindful Hundred", desc: "Earned 100 XP", earned: xp >= 100, icon: Award },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your progress</h1>
        <p className="text-sm text-muted-foreground">
          Showing up is the win. Look for patterns, not perfection.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Current streak" value={`${streak} days`} icon={<Flame className="h-4 w-4 text-warning" />} />
        <Stat label="XP earned" value={`${xp}`} icon={<Award className="h-4 w-4 text-primary" />} />
        <Stat label="Total sessions" value={`${sessions.length}`} icon={<TrendingUp className="h-4 w-4 text-success" />} />
      </div>

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <h2 className="text-sm font-semibold">Past 7 days · focus minutes</h2>
        <div className="mt-6 flex h-44 items-end justify-between gap-3">
          {days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-primary transition-all"
                  style={{ height: `${(d.minutes / max) * 100}%`, minHeight: d.minutes > 0 ? 6 : 2 }}
                  title={`${d.minutes} min`}
                />
              </div>
              <div className="text-[11px] text-muted-foreground">{d.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Badges</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.name}
                className={`rounded-2xl border p-4 shadow-soft ${b.earned ? "border-primary/30 bg-card" : "border-border bg-muted/30 opacity-70"}`}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${b.earned ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-sm font-semibold">{b.name}</div>
                <div className="text-xs text-muted-foreground">{b.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-gradient-calm p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-card text-primary shadow-soft">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Accountability circles · coming soon</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Quietly support a few friends with shared focus goals. No leaderboards, no shaming —
              just gentle company while you work.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
