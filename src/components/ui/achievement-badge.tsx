import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  icon: string;
  title: string;
  description?: string;
  earned?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AchievementBadge({ icon, title, description, earned = true, size = "md", className }: AchievementBadgeProps) {
  const sizeClasses = {
    sm: "w-12 h-12 text-lg",
    md: "w-16 h-16 text-2xl",
    lg: "w-20 h-20 text-3xl",
  };

  return (
    <div className={cn("flex flex-col items-center gap-1 text-center", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl transition-all",
          sizeClasses[size],
          earned
            ? "bg-gradient-to-br from-amber-100 to-amber-200 shadow-lg shadow-amber-200/50 dark:from-amber-900/40 dark:to-amber-800/40 dark:shadow-amber-800/20"
            : "bg-zinc-100 grayscale opacity-40 dark:bg-zinc-800"
        )}
      >
        {icon}
      </div>
      <span className={cn(
        "text-xs font-medium",
        earned ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-600"
      )}>
        {title}
      </span>
      {description && (
        <span className="text-[10px] text-zinc-400">{description}</span>
      )}
    </div>
  );
}
