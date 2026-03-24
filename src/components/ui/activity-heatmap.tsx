import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
  weeks?: number;
  className?: string;
}

export function ActivityHeatmap({ data, weeks = 12, className }: ActivityHeatmapProps) {
  // Build a grid of days for the last N weeks
  const today = new Date();
  const days: { date: string; count: number; dayOfWeek: number }[] = [];

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const entry = data.find((e) => e.date === dateStr);
    days.push({
      date: dateStr,
      count: entry?.count || 0,
      dayOfWeek: d.getDay(),
    });
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-zinc-100 dark:bg-zinc-800";
    if (count === 1) return "bg-emerald-200 dark:bg-emerald-900";
    if (count === 2) return "bg-emerald-400 dark:bg-emerald-700";
    return "bg-emerald-600 dark:bg-emerald-500";
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex gap-[3px]">
        {Array.from({ length: weeks }).map((_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, dayIdx) => {
              const idx = weekIdx * 7 + dayIdx;
              const day = days[idx];
              if (!day) return <div key={dayIdx} className="h-3 w-3" />;
              return (
                <div
                  key={dayIdx}
                  className={cn("h-3 w-3 rounded-sm transition-colors", getColor(day.count))}
                  title={`${day.date}: ${day.count} activities`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
