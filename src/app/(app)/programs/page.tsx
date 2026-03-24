import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";

export default async function ProgramsPage() {
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Workout Programs</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">AI-generated periodized training</p>
        </div>
        <Link href="/programs/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> Generate Program
          </Button>
        </Link>
      </div>

      {!programs || programs.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No programs yet"
          description="Let AI build you a periodized training program based on your goals"
          action={
            <Link href="/programs/new">
              <Button>Generate a Program</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <div
              key={program.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{program.name}</h3>
                  <p className="text-xs text-zinc-400">{program.philosophy} • {program.weeks} weeks • {program.days_per_week} days/week</p>
                </div>
                <Badge variant={program.active ? "success" : "default"}>
                  {program.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-zinc-400">Created {formatDate(program.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
