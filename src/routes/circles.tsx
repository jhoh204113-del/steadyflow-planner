import { createFileRoute } from "@tanstack/react-router";
import { actions, useClientStore, type Friend } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Bell, Crown, Flame, Heart, Plus, Send, Sparkles, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/circles")({
  component: CirclesPage,
  head: () => ({ meta: [{ title: "Circles — Stillpath" }] }),
});

const NUDGE_MESSAGES = [
  "Sending you a calm 5-minute start ✨",
  "Just a soft nudge — proud of you.",
  "Tiny step time? I believe in you.",
  "One small focus session together?",
  "Take a breath, then begin gently.",
];

function CirclesPage() {
  const circles = useClientStore((s) => s.circles, []);
  const friends = useClientStore((s) => s.friends, []);
  const xp = useClientStore((s) => s.xp, 0);
  const streak = useClientStore((s) => s.streakDays, 0);
  const sessions = useClientStore((s) => s.sessions, []);

  const myToday = sessions
    .filter((x) => new Date(x.startedAt).toDateString() === new Date().toDateString())
    .reduce((n, x) => n + x.minutes, 0);
  const me: Friend = { id: "me", name: "You", emoji: "🌱", xp, streak, todayMinutes: myToday };

  const friendMap: Record<string, Friend> = Object.fromEntries(
    [me, ...friends].map((f) => [f.id, f]),
  );

  const joined = circles.filter((c) => c.joined);
  const discover = circles.filter((c) => !c.joined);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accountability circles</h1>
          <p className="text-sm text-muted-foreground">
            Quiet company while you work. No public ranks — just friends keeping each other steady.
          </p>
        </div>
        <NewCircleDialog />
      </div>

      {joined.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-muted-foreground">
          You haven't joined a circle yet. Try one below.
        </div>
      ) : (
        <div className="space-y-6">
          {joined.map((c) => (
            <CircleCard key={c.id} circle={c} friendMap={friendMap} />
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Discover circles
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {discover.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.description}</div>
                </div>
                <span className="shrink-0 rounded-full bg-accent/60 px-2 py-1 text-[10px] font-medium uppercase tracking-wider">
                  {c.memberIds.length} members
                </span>
              </div>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  actions.joinCircle(c.id);
                  toast.success(`Joined ${c.name}`);
                }}
              >
                <Plus className="h-4 w-4" /> Join
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CircleCard({
  circle,
  friendMap,
}: {
  circle: ReturnType<typeof useClientStore<any[]>>[number];
  friendMap: Record<string, Friend>;
}) {
  const members = circle.memberIds
    .map((id: string) => friendMap[id])
    .filter(Boolean) as Friend[];
  const ranked = [...members].sort((a, b) => b.todayMinutes - a.todayMinutes);
  const totalToday = ranked.reduce((n, m) => n + m.todayMinutes, 0);
  const goalPct = Math.min(100, Math.round((totalToday / Math.max(1, circle.weeklyGoalMinutes / 7)) * 100));

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="text-base font-semibold">{circle.name}</div>
              <div className="text-xs text-muted-foreground">{circle.description}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-border bg-card px-3 py-1 text-xs">
            <span className="font-semibold">{totalToday}</span>{" "}
            <span className="text-muted-foreground">min today · {goalPct}% of pace</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              actions.leaveCircle(circle.id);
              toast("Left the circle. You can rejoin anytime.");
            }}
          >
            Leave
          </Button>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-primary" /> Today's quiet leaderboard
        </div>
        <ul className="divide-y divide-border/60">
          {ranked.map((m, i) => (
            <MemberRow key={m.id} m={m} rank={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function MemberRow({ m, rank }: { m: Friend; rank: number }) {
  const isMe = m.id === "me";
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState(NUDGE_MESSAGES[0]);

  const send = () => {
    const ok = actions.sendNudge(m.id, msg);
    if (ok) {
      toast.success(`Soft nudge sent to ${m.name}`);
      setOpen(false);
    } else {
      toast("You already nudged them recently — give them space.");
    }
  };

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/60 text-base">
          {m.emoji}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            {rank === 0 && <Crown className="h-3.5 w-3.5 text-warning" />}
            <span className={cn("truncate", isMe && "text-primary")}>{m.name}{isMe && " (you)"}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3 text-warning" />{m.streak}d</span>
            <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" />{m.xp} XP</span>
            <span>{m.todayMinutes} min today</span>
          </div>
        </div>
      </div>
      {!isMe && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="rounded-lg">
              <Bell className="h-4 w-4" /> Nudge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Send a soft nudge</DialogTitle>
              <DialogDescription>
                Kind, low-pressure messages only. Limited to once every 30 minutes per friend.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {NUDGE_MESSAGES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMsg(m)}
                  className={cn(
                    "block w-full rounded-xl border p-3 text-left text-sm transition-colors",
                    msg === m
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-card hover:bg-accent/40",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <Button onClick={send} className="rounded-xl bg-gradient-primary shadow-glow">
              <Send className="h-4 w-4" /> Send to {m.name}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </li>
  );
}

function NewCircleDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-gradient-primary shadow-glow">
          <Plus className="h-4 w-4" /> New circle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Start a private circle</DialogTitle>
          <DialogDescription>Invite a few friends. Quiet, supportive, no public ranks.</DialogDescription>
        </DialogHeader>
        <input
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder="Circle name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder="Short description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <Button
          className="rounded-xl bg-gradient-primary shadow-glow"
          onClick={() => {
            if (!name.trim()) { toast.error("Add a circle name"); return; }
            // For this demo, simulate creating a joined circle locally.
            // Future: backend with invites.
            const fake = {
              id: "new-" + Date.now(),
              name: name.trim(),
              description: desc.trim() || "Your private space.",
              memberIds: ["me"],
              joined: true,
              weeklyGoalMinutes: 180,
            };
            // direct mutation through actions (push as joined via state hack)
            // simplest: we'll just toast for now in this preview build
            (window as any).__addCircle?.(fake);
            toast.success(`Created “${fake.name}” — invite friends soon.`);
            setOpen(false);
            setName(""); setDesc("");
          }}
        >
          <Heart className="h-4 w-4" /> Create
        </Button>
      </DialogContent>
    </Dialog>
  );
}
