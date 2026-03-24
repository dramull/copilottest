import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/utils";
import { Plus, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

export default async function MealsPage() {
  const supabase = await createClient();
  const { data: meals } = await supabase
    .from("meals")
    .select("*")
    .order("logged_at", { ascending: false })
    .limit(50);

  // Group meals by date
  const grouped = (meals || []).reduce<Record<string, typeof meals>>((acc, meal) => {
    const date = new Date(meal.logged_at).toISOString().split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date]!.push(meal);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Meals</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Track your nutrition with photos</p>
        </div>
        <Link href="/meals/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> Log Meal
          </Button>
        </Link>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No meals logged yet"
          description="Take a photo of your next meal to get started"
          action={
            <Link href="/meals/new">
              <Button>Log Your First Meal</Button>
            </Link>
          }
        />
      ) : (
        Object.entries(grouped).map(([date, dayMeals]) => {
          const dayCalories = dayMeals!.reduce((s, m) => s + (m.calories || 0), 0);
          return (
            <div key={date}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {formatDate(date)}
                </h2>
                <span className="text-xs text-zinc-400">{dayCalories} cal total</span>
              </div>
              <div className="space-y-2">
                {dayMeals!.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {meal.photo_url ? (
                      <img
                        src={meal.photo_url}
                        alt={meal.name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                        <UtensilsCrossed className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {meal.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {formatTime(meal.logged_at)} • {meal.calories} cal
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-400">
                      <span>{meal.protein_g}g P</span>
                      <span>{meal.carbs_g}g C</span>
                      <span>{meal.fat_g}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
