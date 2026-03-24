import { cn } from "@/lib/utils";
import { Flame, Zap } from "lucide-react";

interface StreakDisplayProps {
  count: number;
  type?: "workout" | "meal" | "login";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StreakDisplay({ count, type = "workout", size = "md", className }: StreakDisplayProps) {
  const isActive = count > 0;
  const isMilestone = count >= 7;
  const isEpic = count >= 30;

  const sizeClasses = {
    sm: "gap-1 text-sm",
    md: "gap-2 text-lg",
    lg: "gap-3 text-3xl",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center font-bold",
        sizeClasses[size],
        isActive ? "text-orange-500" : "text-zinc-300 dark:text-zinc-600",
        isEpic && "text-amber-500",
        className
      )}
    >
      <Flame
        className={cn(
          iconSizes[size],
          isActive && "drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]",
          isEpic && "drop-shadow-[0_0_10px_rgba(245,158,11,0.7)]"
        )}
      />
      <span>{count}</span>
      {isMilestone && <Zap className={cn(iconSizes[size], "text-yellow-400")} />}
    </div>
  );
}
