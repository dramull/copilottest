import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ icon: Icon, label, value, unit, className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900", className)}>
      <div className="mb-3 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</span>
        {unit && <span className="text-sm text-zinc-400">{unit}</span>}
      </div>
    </div>
  );
}
