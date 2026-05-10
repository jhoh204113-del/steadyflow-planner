import { actions, questProgress, useClientStore } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Check } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export function QuestsPanel({ compact = false }: { compact?: boolean }) {
  const quests = useClientStore((s) => s.quests, []);
  const state = useClientStore((s) => s, null as never);

  useEffect(() => { actions.rerollQuestsIfNeeded(); }, []);

  if (!state) return null;

  const list = compact ? quests.slice(0, 3) : quests;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-primary" /> Quests
          </h3>
          <p className="text-xs text-muted-foreground">Tiny goals. Real momentum.</p>
        </div>
        <span className="rounded-full bg-accent/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
          {quests.filter((q) => q.claimed).length}/{quests.length} claimed
        </span>
      </div>

      <ul className="space-y-3">
        {list.map((q) => {
          const progress = questProgress(q, state);
          const pct = Math.min(100, Math.round((progress / q.goal) * 100));
          const ready = progress >= q.goal && !q.claimed;
          return (
            <li
              key={q.id}
              className={`rounded-xl border p-3 transition-all ${
                q.claimed
                  ? "border-success/30 bg-success/5 opacity-80"
                  : ready
                    ? "border-primary/40 bg-primary/5 shadow-soft"
                    : "border-border/60 bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{q.title}</span>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {q.period}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{q.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs font-semibold text-primary">+{q.xpReward} XP</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Progress value={pct} className="h-1.5 flex-1" />
                <span className="w-16 text-right text-[11px] tabular-nums text-muted-foreground">
                  {Math.min(progress, q.goal)}/{q.goal}
                </span>
              </div>
              {q.claimed ? (
                <div className="mt-2 flex items-center gap-1 text-[11px] text-success">
                  <Check className="h-3 w-3" /> Claimed
                </div>
              ) : ready ? (
                <Button
                  size="sm"
                  onClick={() => {
                    const xp = actions.claimQuest(q.id);
                    if (xp) toast.success(`Quest complete! +${xp} XP`);
                  }}
                  className="mt-2 h-7 rounded-lg bg-gradient-primary px-3 text-xs shadow-glow"
                >
                  <Sparkles className="h-3 w-3" /> Claim reward
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
