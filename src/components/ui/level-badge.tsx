import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  xp: number;
  xpToNext: number;
  progress: number;
  className?: string;
}

export function LevelBadge({ level, xp, xpToNext, progress, className }: LevelBadgeProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-purple-300/30 dark:shadow-purple-900/30">
        {level}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Level {level}</span>
          <span className="text-[10px] text-zinc-400">{xp} / {xpToNext} XP</span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
