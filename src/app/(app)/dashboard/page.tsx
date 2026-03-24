import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { StreakDisplay } from "@/components/ui/streak-display";
import { AchievementBadge } from "@/components/ui/achievement-badge";
import { LevelBadge } from "@/components/ui/level-badge";
import { ActivityHeatmap } from "@/components/ui/activity-heatmap";
import { createClient } from "@/lib/supabase/server";
import { formatDate, xpToNextLevel } from "@/lib/utils";
import {
  Apple,
  ArrowRight,
  CalendarCheck,
  Dumbbell,
  Flame,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Utensils,
  Video,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const heatmapSince = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all data in parallel
  const [
    mealsResult,
    workoutsResult,
    profileResult,
    streaksResult,
    achievementsResult,
    scheduledResult,
    recentWorkoutsResult,
  ] = await Promise.all([
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
    supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user!.id),
    supabase
      .from("achievements")
      .select("*")
      .eq("user_id", user!.id)
      .order("earned_at", { ascending: false })
      .limit(8),
    supabase
      .from("scheduled_workouts")
      .select("*")
      .eq("user_id", user!.id)
      .eq("scheduled_date", today)
      .eq("status", "pending"),
    // Get activity data for heatmap (last 84 days)
    supabase
      .from("workouts")
      .select("started_at")
      .eq("user_id", user!.id)
      .gte("started_at", heatmapSince)
      .order("started_at", { ascending: false }),
  ]);

  const meals = mealsResult.data || [];
  const workouts = workoutsResult.data || [];
  const profile = profileResult.data;
  const streaks = streaksResult.data || [];
  const achievements = achievementsResult.data || [];
  const todayScheduled = scheduledResult.data?.[0] || null;
  const recentWorkouts = recentWorkoutsResult.data || [];

  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein_g || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs_g || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat_g || 0), 0);
  const calorieTarget = profile?.calorie_target || 2000;

  const workoutStreak = streaks.find((s) => s.streak_type === "workout");
  const mealStreak = streaks.find((s) => s.streak_type === "meal");

  const xpInfo = xpToNextLevel(profile?.xp || 0);
  const level = profile?.level || 1;

  // Build heatmap data
  const heatmapData: { date: string; count: number }[] = [];
  const workoutsByDate: Record<string, number> = {};
  for (const w of recentWorkouts) {
    const d = new Date(w.started_at).toISOString().split("T")[0];
    workoutsByDate[d] = (workoutsByDate[d] || 0) + 1;
  }
  for (const [date, count] of Object.entries(workoutsByDate)) {
    heatmapData.push({ date, count });
  }

  return (
    <div className="space-y-6">
      {/* Header with Level */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(now)}</p>
        </div>
        <div className="flex items-center gap-4">
          <StreakDisplay count={workoutStreak?.current_streak || 0} size="sm" />
        </div>
      </div>

      {/* Level Progress */}
      <LevelBadge
        level={level}
        xp={xpInfo.current}
        xpToNext={xpInfo.needed}
        progress={xpInfo.progress}
      />

      {/* Today's Scheduled Workout — Hero Card */}
      {todayScheduled && (
        <Card className="overflow-hidden border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-violet-50 dark:border-blue-800 dark:from-blue-950/50 dark:to-violet-950/50">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-300/30 dark:shadow-blue-900/30">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">Today&apos;s Workout</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{todayScheduled.day_name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {Array.isArray(todayScheduled.exercises) ? todayScheduled.exercises.length : 0} exercises scheduled
                </p>
              </div>
            </div>
            <Link href="/workouts/today">
              <Button size="sm">
                Start <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Streak Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Flame className="h-4 w-4 text-orange-500" />
            Workout Streak
          </div>
          <StreakDisplay count={workoutStreak?.current_streak || 0} size="md" />
          <p className="mt-1 text-[10px] text-zinc-400">
            Best: {workoutStreak?.longest_streak || 0} days
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Utensils className="h-4 w-4 text-emerald-500" />
            Meal Streak
          </div>
          <StreakDisplay count={mealStreak?.current_streak || 0} size="md" />
          <p className="mt-1 text-[10px] text-zinc-400">
            Best: {mealStreak?.longest_streak || 0} days
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Flame} label="Calories" value={totalCalories} unit={`/ ${calorieTarget}`} />
        <StatCard icon={Target} label="Protein" value={Math.round(totalProtein)} unit="g" />
        <StatCard icon={Utensils} label="Meals" value={meals.length} />
        <StatCard icon={Dumbbell} label="Workouts" value={workouts.length} />
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link href="/meals/new" className="group">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 p-4 transition-all hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-600">
            <div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/30">
              <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Log Meal</span>
          </div>
        </Link>
        <Link href="/workouts/new" className="group">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 p-4 transition-all hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-600">
            <div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/30">
              <Dumbbell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Free Workout</span>
          </div>
        </Link>
        <Link href="/form-check" className="group">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 p-4 transition-all hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-600">
            <div className="rounded-xl bg-violet-100 p-2.5 dark:bg-violet-900/30">
              <Video className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Form Check</span>
          </div>
        </Link>
        <Link href="/progress" className="group">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 p-4 transition-all hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-600">
            <div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/30">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Progress</span>
          </div>
        </Link>
      </div>

      {/* Macro Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Apple className="h-5 w-5" />
            Today&apos;s Nutrition
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

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-5 w-5" />
            Activity
          </CardTitle>
          <CardDescription>Last 12 weeks of training</CardDescription>
        </CardHeader>
        <ActivityHeatmap data={heatmapData} weeks={12} />
      </Card>

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-amber-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-4">
            {achievements.map((a) => (
              <AchievementBadge
                key={a.id}
                icon={a.icon}
                title={a.title}
                description={a.description}
                size="sm"
              />
            ))}
          </div>
        </Card>
      )}

      {/* Today's Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="h-5 w-5" />
            Today&apos;s Meals
          </CardTitle>
        </CardHeader>
        {meals.length > 0 ? (
          <div className="space-y-2">
            {meals.slice(0, 4).map((meal) => (
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
        <div className="mt-3">
          <Link href="/meals/new">
            <Button size="sm" variant="secondary">
              <Plus className="h-4 w-4" /> Log Meal
            </Button>
          </Link>
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/programs" className="group">
          <div className="rounded-2xl border border-zinc-200 p-4 transition-all hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
            <Sparkles className="mb-2 h-5 w-5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
            <p className="text-sm font-medium text-zinc-900 dark:text-white">AI Programs</p>
            <p className="text-xs text-zinc-400">Generate training plans</p>
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
