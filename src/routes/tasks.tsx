import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { actions, generateSubtasks, useClientStore, riskOf } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "Tasks — Stillpath" }] }),
});

function TasksPage() {
  const assignments = useClientStore((s) => s.assignments, []);
  const sorted = [...assignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks & breakdowns</h1>
          <p className="text-sm text-muted-foreground">
            Big work feels lighter when it's split into small, doable steps.
          </p>
        </div>
        <NewAssignmentDialog />
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-muted-foreground">
          Nothing here yet. Add a task to begin.
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((a) => (
            <TaskItem key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskItem({ a }: { a: { id: string; title: string; subject: string; dueDate: string; estimatedHours: number; hoursCompleted: number; subtasks: { id: string; title: string; done: boolean }[] } }) {
  const days = Math.max(0, Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000));
  const done = a.subtasks.filter((s) => s.done).length;
  const pct = a.subtasks.length ? Math.round((done / a.subtasks.length) * 100) : 0;
  const risk = riskOf(a as any);
  const riskColor =
    risk === "high" ? "text-destructive" : risk === "medium" ? "text-warning-foreground" : "text-success";

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{a.subject}</div>
          <h2 className="text-lg font-semibold">{a.title}</h2>
          <div className="mt-1 text-xs text-muted-foreground">
            Due in {days} day{days === 1 ? "" : "s"} · {a.hoursCompleted.toFixed(1)}/{a.estimatedHours}h ·{" "}
            <span className={cn("font-medium", riskColor)}>
              {risk === "high" ? "Needs attention" : risk === "medium" ? "Stay steady" : "On track"}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            actions.deleteAssignment(a.id);
            toast.success("Removed");
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4">
        <Progress value={pct} className="h-2" />
        <div className="mt-1 text-xs text-muted-foreground">
          {done}/{a.subtasks.length} steps complete
        </div>
      </div>

      <ul className="mt-4 space-y-1.5">
        {a.subtasks.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
          >
            <Checkbox
              checked={s.done}
              onCheckedChange={() => {
                const done = actions.toggleSubtask(a.id, s.id);
                if (done) toast.success("Step complete · +5 XP");
              }}
              id={s.id}
            />
            <label
              htmlFor={s.id}
              className={cn(
                "cursor-pointer text-sm",
                s.done && "text-muted-foreground line-through",
              )}
            >
              {s.title}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewAssignmentDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [hours, setHours] = useState(4);
  const [preview, setPreview] = useState<{ id: string; title: string; done: boolean }[]>([]);

  const onBreakdown = () => {
    if (!title.trim()) {
      toast.error("Add a title first");
      return;
    }
    setPreview(generateSubtasks(title, description));
    toast.success("Broken down into smaller steps");
  };

  const onSubmit = () => {
    if (!title.trim() || !subject.trim()) {
      toast.error("Add a title and subject");
      return;
    }
    actions.addAssignment({
      title: title.trim(),
      subject: subject.trim(),
      description,
      dueDate: new Date(dueDate).toISOString(),
      estimatedHours: Number(hours) || 1,
      subtasks: preview.length ? preview : generateSubtasks(title, description),
    });
    toast.success("Added — one step at a time.");
    setOpen(false);
    setTitle(""); setSubject(""); setDescription(""); setHours(4); setPreview([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-gradient-primary shadow-glow">
          <Plus className="h-4 w-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an assignment</DialogTitle>
          <DialogDescription>We'll gently break it into smaller, doable steps.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="t">Title</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Biology lab report" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="s">Subject</Label>
              <Input id="s" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Biology" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="h">Estimated hours</Label>
              <Input id="h" type="number" min={0.5} step={0.5} value={hours} onChange={(e) => setHours(+e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="d">Due date</Label>
            <Input id="d" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="desc">Notes (optional)</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="A short description helps the breakdown." />
          </div>

          <Button type="button" variant="outline" onClick={onBreakdown} className="rounded-xl">
            <Wand2 className="h-4 w-4" /> Break it down for me
          </Button>

          {preview.length > 0 && (
            <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Suggested steps
              </div>
              <ul className="space-y-1 text-sm">
                {preview.map((p) => (
                  <li key={p.id}>· {p.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Button onClick={onSubmit} className="rounded-xl bg-gradient-primary shadow-glow">
          Save task
        </Button>
      </DialogContent>
    </Dialog>
  );
}
