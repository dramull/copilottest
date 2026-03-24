import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Apple, Dumbbell, Flame, Plus, Target, TrendingUp, Utensils } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  // Fetch today's data
  const [mealsResult, workoutsResult, profileResult] = await Promise.all([
    supabase
      .from("meals")
      .select("*")
      .gte("logged_at", `${today}T00:00:00`)
      .lte("logged_at", `${today}T23:59:59`)
      .order("logged_at", { ascending: false }),
    supabase
      .from("workouts")
      .select("*")
      .gte("started_at", `${today}T00:00:00`)
      .lte("started_at", `${today}T23:59:59`),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user!.id)
      .single(),
  ]);

  const meals = mealsResult.data || [];
  const workouts = workoutsResult.data || [];
  const profile = profileResult.data;

  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein_g || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs_g || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat_g || 0), 0);
  const calorieTarget = profile?.calorie_target || 2000;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(new Date())}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Flame} label="Calories" value={totalCalories} unit={`/ ${calorieTarget}`} />
        <StatCard icon={Target} label="Protein" value={Math.round(totalProtein)} unit="g" />
        <StatCard icon={Utensils} label="Meals" value={meals.length} />
        <StatCard icon={Dumbbell} label="Workouts" value={workouts.length} />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Today&apos;s Meals
            </CardTitle>
          </CardHeader>
          {meals.length > 0 ? (
            <div className="space-y-3">
              {meals.slice(0, 3).map((meal) => (
                <div key={meal.id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{meal.name}</p>
                    <p className="text-xs text-zinc-400">{meal.calories} cal • {meal.protein_g}g P</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No meals logged today</p>
          )}
          <div className="mt-4">
            <Link href="/meals/new">
              <Button size="sm" variant="secondary">
                <Plus className="h-4 w-4" /> Log Meal
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Today&apos;s Workouts
            </CardTitle>
          </CardHeader>
          {workouts.length > 0 ? (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{workout.name}</p>
                    <p className="text-xs text-zinc-400">{workout.completed_at ? "Completed" : "In progress"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No workouts today</p>
          )}
          <div className="mt-4">
            <Link href="/workouts/new">
              <Button size="sm" variant="secondary">
                <Plus className="h-4 w-4" /> Start Workout
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Macro breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5" />
            Macro Breakdown
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mb-1 text-2xl font-bold text-zinc-900 dark:text-white">{Math.round(totalProtein)}g</div>
            <div className="text-xs font-medium text-zinc-400">Protein</div>
            <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min((totalProtein / (profile?.protein_g || 150)) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="mb-1 text-2xl font-bold text-zinc-900 dark:text-white">{Math.round(totalCarbs)}g</div>
            <div className="text-xs font-medium text-zinc-400">Carbs</div>
            <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-2 rounded-full bg-amber-500 transition-all"
                style={{ width: `${Math.min((totalCarbs / (profile?.carbs_g || 200)) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="mb-1 text-2xl font-bold text-zinc-900 dark:text-white">{Math.round(totalFat)}g</div>
            <div className="text-xs font-medium text-zinc-400">Fat</div>
            <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-2 rounded-full bg-rose-500 transition-all"
                style={{ width: `${Math.min((totalFat / (profile?.fat_g || 70)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/programs" className="group">
          <div className="rounded-2xl border border-zinc-200 p-4 transition-all hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
            <TrendingUp className="mb-2 h-5 w-5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Workout Programs</p>
            <p className="text-xs text-zinc-400">AI-generated training plans</p>
          </div>
        </Link>
        <Link href="/diet" className="group">
          <div className="rounded-2xl border border-zinc-200 p-4 transition-all hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
            <Apple className="mb-2 h-5 w-5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Diet Plans</p>
            <p className="text-xs text-zinc-400">AI-powered meal planning</p>
          </div>
        </Link>
        <Link href="/progress" className="group">
          <div className="rounded-2xl border border-zinc-200 p-4 transition-all hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
            <Target className="mb-2 h-5 w-5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Progress Photos</p>
            <p className="text-xs text-zinc-400">Track your transformation</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
