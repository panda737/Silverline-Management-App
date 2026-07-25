import { CheckCircle2, Clock, Flag, FolderKanban, Hourglass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "emerald" | "blue" | "amber" | "violet" | "red";

const TONE_CLASSES: Record<StatTone, string> = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function Stat({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  alert,
}: {
  label: string;
  value: number;
  caption: string;
  icon: typeof FolderKanban;
  tone: StatTone;
  alert?: boolean;
}) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            TONE_CLASSES[tone]
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={cn(
              "text-2xl leading-none font-medium tabular-nums",
              alert && value > 0 && "text-red-600 dark:text-red-400"
            )}
          >
            {value}
          </p>
          <p className="truncate text-xs text-muted-foreground">{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectStats({
  total,
  inProgress,
  waiting,
  completed,
  overdue,
}: {
  total: number;
  inProgress: number;
  waiting: number;
  completed: number;
  overdue: number;
}) {
  const pct = (n: number) =>
    total === 0 ? "—" : `${Math.round((n / total) * 100)}% of projects`;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      <Stat
        label="Total Projects"
        value={total}
        caption="All time"
        icon={FolderKanban}
        tone="emerald"
      />
      <Stat
        label="In Progress"
        value={inProgress}
        caption={pct(inProgress)}
        icon={Clock}
        tone="blue"
      />
      <Stat
        label="Waiting"
        value={waiting}
        caption={pct(waiting)}
        icon={Hourglass}
        tone="amber"
      />
      <Stat
        label="Completed"
        value={completed}
        caption={pct(completed)}
        icon={CheckCircle2}
        tone="violet"
      />
      <Stat
        label="Overdue"
        value={overdue}
        caption="Action required"
        icon={Flag}
        tone="red"
        alert
      />
    </div>
  );
}
