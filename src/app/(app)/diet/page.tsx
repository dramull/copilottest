"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { Apple, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DietPlan {
  id: string;
  name: string;
  diet_type: string;
  calorie_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  plan_data: { day: string; meals: { name: string; foods: string[]; calories: number; protein_g: number; carbs_g: number; fat_g: number }[] }[];
  grocery_list?: string[];
  active: boolean;
  created_at: string;
}

const dietTypes = ["Flexible", "Keto", "Vegan", "Mediterranean", "Carnivore", "Paleo", "IIFYM"];

export default function DietPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [activePlan, setActivePlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Generator fields
  const [dietType, setDietType] = useState("Flexible");
  const [calories, setCalories] = useState("2000");
  const [protein, setProtein] = useState("150");
  const [carbs, setCarbs] = useState("200");
  const [fat, setFat] = useState("70");
  const [mealsPerDay, setMealsPerDay] = useState("3");

  useEffect(() => {
    async function loadPlans() {
      const supabase = createClient();
      const { data } = await supabase
        .from("diet_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setPlans(data);
        const active = data.find((p) => p.active);
        if (active) setActivePlan(active);
      }
      setLoading(false);
    }
    loadPlans();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diet_type: dietType,
          calorie_target: parseInt(calories),
          protein_g: parseInt(protein),
          carbs_g: parseInt(carbs),
          fat_g: parseInt(fat),
          meals_per_day: parseInt(mealsPerDay),
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Deactivate existing plans
      await supabase.from("diet_plans").update({ active: false }).eq("user_id", user.id);

      const { data: plan } = await supabase
        .from("diet_plans")
        .insert({
          user_id: user.id,
          name: data.name || `${dietType} Plan`,
          diet_type: dietType,
          calorie_target: parseInt(calories),
          protein_g: parseInt(protein),
          carbs_g: parseInt(carbs),
          fat_g: parseInt(fat),
          meals_per_day: parseInt(mealsPerDay),
          plan_data: data.days || [],
          active: true,
        })
        .select()
        .single();

      if (plan) {
        setPlans((prev) => [plan, ...prev.map((p) => ({ ...p, active: false }))]);
        setActivePlan(plan);
        setShowGenerator(false);
      }
    } catch {
      setError("Failed to generate plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-zinc-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Diet Plans</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">AI-powered meal planning</p>
        </div>
        <Button size="sm" onClick={() => setShowGenerator(!showGenerator)}>
          <Sparkles className="h-4 w-4" /> Generate Plan
        </Button>
      </div>

      {/* Generator */}
      {showGenerator && (
        <Card>
          <CardHeader>
            <CardTitle>Generate a Meal Plan</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Diet Type</label>
              <div className="flex flex-wrap gap-2">
                {dietTypes.map((dt) => (
                  <button
                    key={dt}
                    onClick={() => setDietType(dt)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      dietType === dt
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {dt}
                  </button>
                ))}
              </div>
            </div>

            <Input id="cal" label="Daily Calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
            <div className="grid grid-cols-3 gap-3">
              <Input id="p" label="Protein (g)" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
              <Input id="c" label="Carbs (g)" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              <Input id="f" label="Fat (g)" type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
            )}

            <Button onClick={handleGenerate} className="w-full" loading={generating}>
              <Sparkles className="h-4 w-4" /> Generate Plan
            </Button>
          </div>
        </Card>
      )}

      {/* Active plan */}
      {activePlan && activePlan.plan_data && activePlan.plan_data.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{activePlan.name}</h2>
          {activePlan.plan_data.map((day, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-base">{day.day}</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {day.meals?.map((meal, j) => (
                  <div key={j} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{meal.name}</span>
                      <span className="text-xs text-zinc-400">{meal.calories} cal</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {meal.foods?.join(", ")}
                    </p>
                    <div className="mt-1 flex gap-3 text-xs text-zinc-400">
                      <span>{meal.protein_g}g P</span>
                      <span>{meal.carbs_g}g C</span>
                      <span>{meal.fat_g}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : !showGenerator ? (
        <EmptyState
          icon={Apple}
          title="No diet plans yet"
          description="Generate an AI-powered meal plan tailored to your goals"
          action={
            <Button onClick={() => setShowGenerator(true)}>
              <Sparkles className="h-4 w-4" /> Generate a Plan
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
