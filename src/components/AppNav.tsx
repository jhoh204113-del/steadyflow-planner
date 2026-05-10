import { Link } from "@tanstack/react-router";
import { Home, ListChecks, Timer, Sparkles, Leaf } from "lucide-react";
import { useClientStore } from "@/lib/store";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/insights", label: "Insights", icon: Sparkles },
] as const;

export function AppNav() {
  const xp = useClientStore((s) => s.xp, 0);
  const streak = useClientStore((s) => s.streakDays, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Leaf className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Stillpath</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">study, calmly</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4" /> {label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-soft sm:flex sm:items-center sm:gap-1.5">
            <span className="text-warning">🔥</span> {streak}d streak
          </div>
          <div className="rounded-full bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow">
            {xp} XP
          </div>
        </div>
      </div>

      <nav className="flex items-center justify-around border-t border-border/60 bg-background/60 py-1.5 md:hidden">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1 text-[10px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
