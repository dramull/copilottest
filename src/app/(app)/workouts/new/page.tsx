"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Check, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SetData {
  reps: string;
  weight: string;
  rpe: string;
  completed: boolean;
}

interface ExerciseData {
  name: string;
  sets: SetData[];
}

export default function NewWorkoutPage() {
  const [name, setName] = useState(`Workout — ${new Date().toLocaleDateString()}`);
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseData[]>([
    { name: "", sets: [{ reps: "", weight: "", rpe: "", completed: false }] },
  ]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function addExercise() {
    setExercises([
      ...exercises,
      { name: "", sets: [{ reps: "", weight: "", rpe: "", completed: false }] },
    ]);
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  function updateExerciseName(index: number, value: string) {
    const updated = [...exercises];
    updated[index].name = value;
    setExercises(updated);
  }

  function addSet(exerciseIndex: number) {
    const updated = [...exercises];
    updated[exerciseIndex].sets.push({ reps: "", weight: "", rpe: "", completed: false });
    setExercises(updated);
  }

  function updateSet(exerciseIndex: number, setIndex: number, field: keyof SetData, value: string | boolean) {
    const updated = [...exercises];
    (updated[exerciseIndex].sets[setIndex] as unknown as Record<string, string | boolean>)[field] = value;
    setExercises(updated);
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    const updated = [...exercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setExercises(updated);
  }

  async function handleSave() {
    if (!name) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create workout
    const { data: workout } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        name,
        notes: notes || null,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (workout) {
      // Create exercises and sets
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        if (!ex.name) continue;

        const { data: exercise } = await supabase
          .from("exercises")
          .insert({
            workout_id: workout.id,
            name: ex.name,
            order_index: i,
          })
          .select()
          .single();

        if (exercise) {
          const sets = ex.sets
            .filter((s) => s.reps || s.weight)
            .map((s, j) => ({
              exercise_id: exercise.id,
              set_number: j + 1,
              reps: s.reps ? parseInt(s.reps) : null,
              weight_kg: s.weight ? parseFloat(s.weight) : null,
              rpe: s.rpe ? parseFloat(s.rpe) : null,
              completed: s.completed,
            }));

          if (sets.length > 0) {
            await supabase.from("exercise_sets").insert(sets);
          }
        }
      }
    }

    router.push("/workouts");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workouts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">New Workout</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Log your exercises, sets, and reps</p>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          id="name"
          label="Workout Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          id="notes"
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How are you feeling today?"
        />
      </div>

      {/* Exercises */}
      <div className="space-y-6">
        {exercises.map((exercise, exIndex) => (
          <div
            key={exIndex}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-3 flex items-center gap-2">
              <Input
                id={`ex-${exIndex}`}
                value={exercise.name}
                onChange={(e) => updateExerciseName(exIndex, e.target.value)}
                placeholder="Exercise name (e.g., Bench Press)"
                className="flex-1"
              />
              {exercises.length > 1 && (
                <button
                  onClick={() => removeExercise(exIndex)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sets header */}
            <div className="mb-2 grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 text-xs font-medium text-zinc-400">
              <span>Set</span>
              <span>Reps</span>
              <span>Weight (kg)</span>
              <span>RPE</span>
              <span></span>
            </div>

            {/* Sets */}
            {exercise.sets.map((set, setIndex) => (
              <div
                key={setIndex}
                className="mb-2 grid grid-cols-[2rem_1fr_1fr_1fr_2rem] items-center gap-2"
              >
                <button
                  onClick={() => updateSet(exIndex, setIndex, "completed", !set.completed)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs transition-colors ${
                    set.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-zinc-300 text-zinc-400 dark:border-zinc-600"
                  }`}
                >
                  {set.completed ? <Check className="h-3 w-3" /> : setIndex + 1}
                </button>
                <input
                  type="number"
                  value={set.reps}
                  onChange={(e) => updateSet(exIndex, setIndex, "reps", e.target.value)}
                  placeholder="—"
                  className="h-8 w-full rounded-lg border border-zinc-200 bg-transparent px-2 text-center text-sm dark:border-zinc-700"
                />
                <input
                  type="number"
                  value={set.weight}
                  onChange={(e) => updateSet(exIndex, setIndex, "weight", e.target.value)}
                  placeholder="—"
                  className="h-8 w-full rounded-lg border border-zinc-200 bg-transparent px-2 text-center text-sm dark:border-zinc-700"
                />
                <input
                  type="number"
                  value={set.rpe}
                  onChange={(e) => updateSet(exIndex, setIndex, "rpe", e.target.value)}
                  placeholder="—"
                  className="h-8 w-full rounded-lg border border-zinc-200 bg-transparent px-2 text-center text-sm dark:border-zinc-700"
                />
                <button
                  onClick={() => removeSet(exIndex, setIndex)}
                  className="text-zinc-300 hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={() => addSet(exIndex)}
              className="mt-2 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              + Add Set
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addExercise}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 py-4 text-sm font-medium text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
      >
        <Plus className="h-4 w-4" /> Add Exercise
      </button>

      <Button onClick={handleSave} className="w-full" loading={saving} disabled={!name}>
        Save Workout
      </Button>
    </div>
  );
}
