"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { Check, Dumbbell, PartyPopper, SkipForward, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ScheduledExercise {
  name: string;
  sets: number;
  reps: string;
  weight_kg: number | null;
  rest_seconds: number;
  notes?: string;
}

interface ScheduledWorkout {
  id: string;
  day_name: string;
  exercises: ScheduledExercise[];
  status: string;
}

interface LiveSet {
  reps: string;
  weight: string;
  completed: boolean;
}

interface LiveExercise {
  name: string;
  targetSets: number;
  targetReps: string;
  rest_seconds: number;
  notes?: string;
  sets: LiveSet[];
}

export default function TodayWorkoutPage() {
  const [scheduled, setScheduled] = useState<ScheduledWorkout | null>(null);
  const [exercises, setExercises] = useState<LiveExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function loadSchedule() {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/schedule?date=${today}`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const workout = data[0];
        setScheduled(workout);

        // Pre-fill exercises from scheduled workout
        const exs = (workout.exercises || []).map((ex: ScheduledExercise) => ({
          name: ex.name,
          targetSets: ex.sets,
          targetReps: ex.reps,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
          sets: Array.from({ length: ex.sets }, () => ({
            reps: ex.reps?.split("-")[0] || "10",
            weight: ex.weight_kg ? String(ex.weight_kg) : "",
            completed: false,
          })),
        }));
        setExercises(exs);
      }
      setLoading(false);
    }
    loadSchedule();
  }, []);

  function toggleSet(exIdx: number, setIdx: number) {
    const updated = [...exercises];
    updated[exIdx].sets[setIdx].completed = !updated[exIdx].sets[setIdx].completed;
    setExercises(updated);
  }

  function updateSet(exIdx: number, setIdx: number, field: "reps" | "weight", value: string) {
    const updated = [...exercises];
    updated[exIdx].sets[setIdx][field] = value;
    setExercises(updated);
  }

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0);
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  async function handleComplete() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create actual workout record
    const { data: workout } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        name: scheduled?.day_name || "Today's Workout",
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (workout) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        if (!ex.name) continue;

        const { data: exercise } = await supabase
          .from("exercises")
          .insert({ workout_id: workout.id, name: ex.name, order_index: i })
          .select()
          .single();

        if (exercise) {
          const sets = ex.sets
            .filter((s) => s.completed)
            .map((s, j) => ({
              exercise_id: exercise.id,
              set_number: j + 1,
              reps: s.reps ? parseInt(s.reps) : null,
              weight_kg: s.weight ? parseFloat(s.weight) : null,
              completed: true,
            }));
          if (sets.length > 0) {
            await supabase.from("exercise_sets").insert(sets);
          }
        }
      }

      // Mark scheduled workout as completed
      if (scheduled) {
        await fetch("/api/schedule", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: scheduled.id,
            status: completedSets === totalSets ? "completed" : "partial",
            workout_id: workout.id,
          }),
        });
      }

      // Update workout streak
      await fetch("/api/streaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streak_type: "workout" }),
      });

      // Award XP
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp")
        .eq("id", user.id)
        .single();

      if (profile) {
        const xpEarned = completedSets === totalSets ? 30 : 15;
        await supabase.from("profiles").update({
          xp: (profile.xp || 0) + xpEarned,
        }).eq("id", user.id);
      }
    }

    setCompleted(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2500);
  }

  async function handleSkip() {
    if (scheduled) {
      await fetch("/api/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scheduled.id, status: "skipped" }),
      });
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return <div className="py-12 text-center text-zinc-400">Loading today&apos;s workout...</div>;
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-5 shadow-lg">
          <PartyPopper className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Workout Complete! 🎉</h2>
        <p className="mt-2 text-sm text-zinc-400">{completedSets}/{totalSets} sets completed • +{completedSets === totalSets ? 30 : 15} XP</p>
      </div>
    );
  }

  if (!scheduled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Today&apos;s Workout</h1>
        <EmptyState
          icon={Dumbbell}
          title="Rest day!"
          description="No workout scheduled for today. You can start a freestyle workout or generate a program."
          action={
            <div className="flex gap-3">
              <Link href="/workouts/new">
                <Button variant="secondary">Freestyle Workout</Button>
              </Link>
              <Link href="/programs/new">
                <Button>Generate Program</Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{scheduled.day_name}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {exercises.length} exercises • {totalSets} sets total
        </p>
        <div className="mt-3 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-zinc-400">{completedSets}/{totalSets} sets done ({progress}%)</p>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {exercises.map((exercise, exIdx) => {
          const exCompleted = exercise.sets.filter((s) => s.completed).length;
          const isActive = exIdx === currentExercise;

          return (
            <Card
              key={exIdx}
              className={isActive ? "ring-2 ring-zinc-900 dark:ring-white" : "opacity-80"}
              onClick={() => setCurrentExercise(exIdx)}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    exCompleted === exercise.sets.length
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {exCompleted === exercise.sets.length ? <Check className="h-4 w-4" /> : exIdx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{exercise.name}</p>
                    <p className="text-xs text-zinc-400">
                      {exercise.targetSets} × {exercise.targetReps} • {exercise.rest_seconds}s rest
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  {exCompleted}/{exercise.sets.length}
                </span>
              </div>

              {isActive && (
                <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                  {exercise.notes && (
                    <p className="mb-3 flex items-center gap-1 text-xs text-zinc-400">
                      <Sparkles className="h-3 w-3" /> {exercise.notes}
                    </p>
                  )}

                  <div className="mb-2 grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-2 text-[10px] font-medium uppercase text-zinc-400">
                    <span>Set</span>
                    <span>Reps</span>
                    <span>Weight (kg)</span>
                    <span></span>
                  </div>

                  {exercise.sets.map((set, setIdx) => (
                    <div key={setIdx} className="mb-2 grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSet(exIdx, setIdx); }}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                          set.completed
                            ? "border-emerald-500 bg-emerald-500 text-white scale-110"
                            : "border-zinc-300 text-zinc-400 dark:border-zinc-600"
                        }`}
                      >
                        {set.completed ? <Check className="h-3.5 w-3.5" /> : setIdx + 1}
                      </button>
                      <input
                        type="number"
                        value={set.reps}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                        className="h-9 w-full rounded-lg border border-zinc-200 bg-transparent px-2 text-center text-sm font-medium dark:border-zinc-700"
                      />
                      <input
                        type="number"
                        value={set.weight}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                        placeholder="—"
                        className="h-9 w-full rounded-lg border border-zinc-200 bg-transparent px-2 text-center text-sm font-medium dark:border-zinc-700"
                      />
                      <div />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={handleSkip} className="flex-shrink-0">
          <SkipForward className="h-4 w-4" /> Skip
        </Button>
        <Button onClick={handleComplete} className="flex-1" loading={saving} disabled={completedSets === 0}>
          Complete Workout ({completedSets}/{totalSets})
        </Button>
      </div>
    </div>
  );
}
