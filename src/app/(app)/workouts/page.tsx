import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Dumbbell, Plus } from "lucide-react";
import Link from "next/link";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const { data: workouts } = await supabase
    .from("workouts")
    .select("*, exercises(*, exercise_sets(*))")
    .order("started_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Workouts</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Track your training sessions</p>
        </div>
        <Link href="/workouts/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> New Workout
          </Button>
        </Link>
      </div>

      {!workouts || workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts yet"
          description="Start your first workout to begin tracking your progress"
          action={
            <Link href="/workouts/new">
              <Button>Start Workout</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => {
            const exerciseCount = workout.exercises?.length || 0;
            const totalSets = workout.exercises?.reduce(
              (sum: number, ex: { exercise_sets?: unknown[] }) => sum + (ex.exercise_sets?.length || 0),
              0
            ) || 0;

            return (
              <div
                key={workout.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {workout.name}
                    </h3>
                    <p className="text-xs text-zinc-400">{formatDate(workout.started_at)}</p>
                  </div>
                  <Badge variant={workout.completed_at ? "success" : "warning"}>
                    {workout.completed_at ? "Completed" : "In Progress"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
                  <span>{exerciseCount} exercises</span>
                  <span>{totalSets} sets</span>
                </div>
                {workout.notes && (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{workout.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
