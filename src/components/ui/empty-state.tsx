import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
        <Icon className="h-8 w-8 text-zinc-400" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      {action}
    </div>
  );
}
