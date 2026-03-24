"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaCapture } from "@/components/ui/media-capture";
import { createClient } from "@/lib/supabase/client";
import { Activity, ArrowRight, Check, ChevronDown, ChevronUp, Dumbbell, Sparkles, UtensilsCrossed, Weight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "photo" | "analyzing" | "review" | "plans" | "complete";

interface AnalysisData {
  estimated_weight_kg?: number;
  age_range_low?: number;
  age_range_high?: number;
  estimated_gender?: string;
  estimated_body_fat_pct?: number;
  estimated_bmi?: number;
  body_type?: string;
  fitness_level?: string;
  suggested_goal?: string;
  notes?: string;
}

interface NutritionData {
  calorie_target?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("photo");
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData>({});
  const [, setNutrition] = useState<NutritionData>({});
  const [program, setProgram] = useState<Record<string, unknown> | null>(null);
  const [diet, setDiet] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showProgramDetail, setShowProgramDetail] = useState(false);
  const [showDietDetail, setShowDietDetail] = useState(false);
  const router = useRouter();

  // Editable fields
  const [weight, setWeight] = useState("");
  const [ageLow, setAgeLow] = useState("");
  const [ageHigh, setAgeHigh] = useState("");
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  async function handleCapture(_file: File, base64: string) {
    setPreview(`data:image/jpeg;base64,${base64}`);
    setStep("analyzing");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();

      setAnalysis(data.analysis || {});
      setNutrition(data.nutrition || {});
      setProgram(data.program || null);
      setDiet(data.diet || null);

      // Pre-fill editable fields
      setWeight(String(data.analysis?.estimated_weight_kg || ""));
      setAgeLow(String(data.analysis?.age_range_low || ""));
      setAgeHigh(String(data.analysis?.age_range_high || ""));
      setGender(data.analysis?.estimated_gender || "");
      setGoal(data.analysis?.suggested_goal || "recomp");
      setCalories(String(data.nutrition?.calorie_target || 2000));
      setProtein(String(data.nutrition?.protein_g || 150));
      setCarbs(String(data.nutrition?.carbs_g || 200));
      setFat(String(data.nutrition?.fat_g || 70));

      setStep("review");
    } catch {
      setError("Could not analyze photo. You can fill in details manually.");
      setGoal("recomp");
      setCalories("2000");
      setProtein("150");
      setCarbs("200");
      setFat("70");
      setStep("review");
    } finally {
      setLoading(false);
    }
  }

  function handleSkipPhoto() {
    setGoal("recomp");
    setCalories("2000");
    setProtein("150");
    setCarbs("200");
    setFat("70");
    setStep("review");
  }

  async function handleComplete() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update profile
    await supabase.from("profiles").update({
      estimated_weight_kg: weight ? parseFloat(weight) : null,
      weight_kg: weight ? parseFloat(weight) : null,
      age_range_low: ageLow ? parseInt(ageLow) : null,
      age_range_high: ageHigh ? parseInt(ageHigh) : null,
      age: ageLow && ageHigh ? Math.round((parseInt(ageLow) + parseInt(ageHigh)) / 2) : null,
      gender: gender || null,
      goal: goal || null,
      calorie_target: calories ? parseInt(calories) : null,
      protein_g: protein ? parseInt(protein) : null,
      carbs_g: carbs ? parseInt(carbs) : null,
      fat_g: fat ? parseInt(fat) : null,
      training_philosophy: (program as { philosophy?: string })?.philosophy || "Push/Pull/Legs",
      onboarded: true,
      xp: 50,
    }).eq("id", user.id);

    // Save program if we have one
    if (program && (program as { weeks?: unknown[] }).weeks) {
      const p = program as { name?: string; philosophy?: string; weeks?: unknown[]; days_per_week?: number };
      const { data: savedProgram } = await supabase.from("programs").insert({
        user_id: user.id,
        name: p.name || "Your Personalized Program",
        philosophy: p.philosophy || "Push/Pull/Legs",
        weeks: 4,
        days_per_week: p.days_per_week || 4,
        program_data: p.weeks || [],
        active: true,
      }).select().single();

      // Auto-populate first week of scheduled workouts
      if (savedProgram && p.weeks && Array.isArray(p.weeks) && p.weeks.length > 0) {
        const firstWeek = p.weeks[0] as { days?: { day: number; name: string; exercises: unknown[] }[] };
        if (firstWeek.days) {
          const today = new Date();
          const dayOfWeek = today.getDay() || 7;
          for (const day of firstWeek.days) {
            const schedDate = new Date(today);
            // If the training day number has already passed this week, schedule it for next week
            const diff = (day.day <= dayOfWeek) ? day.day + 7 - dayOfWeek : day.day - dayOfWeek;
            schedDate.setDate(today.getDate() + diff);

            await supabase.from("scheduled_workouts").insert({
              user_id: user.id,
              program_id: savedProgram.id,
              scheduled_date: schedDate.toISOString().split("T")[0],
              day_name: day.name,
              exercises: day.exercises || [],
              status: "pending",
            });
          }
        }
      }
    }

    // Save diet plan if we have one
    if (diet && (diet as { days?: unknown[] }).days) {
      const d = diet as { name?: string; diet_type?: string; days?: unknown[] };
      await supabase.from("diet_plans").insert({
        user_id: user.id,
        name: d.name || "Your Personalized Meal Plan",
        diet_type: d.diet_type || "Balanced",
        calorie_target: parseInt(calories) || 2000,
        protein_g: parseInt(protein) || 150,
        carbs_g: parseInt(carbs) || 200,
        fat_g: parseInt(fat) || 70,
        meals_per_day: 4,
        plan_data: d.days || [],
        active: true,
      });
    }

    // Initialize streaks
    await supabase.from("streaks").upsert([
      { user_id: user.id, streak_type: "workout", current_streak: 0, longest_streak: 0 },
      { user_id: user.id, streak_type: "meal", current_streak: 0, longest_streak: 0 },
      { user_id: user.id, streak_type: "login", current_streak: 1, longest_streak: 1, last_activity_date: new Date().toISOString().split("T")[0] },
    ], { onConflict: "user_id,streak_type" });

    // Award first achievement
    await supabase.from("achievements").insert({
      user_id: user.id,
      achievement_type: "onboarding",
      title: "First Steps",
      description: "Completed your fitness profile setup",
      icon: "🚀",
    });

    setStep("complete");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="mb-6 flex justify-center gap-2">
          {["photo", "review", "plans", "complete"].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-12 rounded-full transition-colors ${
                ["photo", "analyzing", "review", "plans", "complete"].indexOf(step) >= i
                  ? "bg-zinc-900 dark:bg-white"
                  : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>

        <div className="mb-8 text-center">
          <Activity className="mx-auto mb-4 h-10 w-10 text-zinc-900 dark:text-white" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {step === "photo" && "Stand back, strike a pose"}
            {step === "analyzing" && "AI is working its magic..."}
            {step === "review" && "Here\u2019s what we see"}
            {step === "plans" && "Your personalized plan"}
            {step === "complete" && "You\u2019re ready to crush it!"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {step === "photo" && "Take or upload a full-body photo. AI will estimate your stats and build your plan."}
            {step === "analyzing" && "Analyzing your photo, generating workout program, and creating your meal plan..."}
            {step === "review" && "Adjust anything that doesn\u2019t look right"}
            {step === "plans" && "We built a complete workout and diet plan for you"}
            {step === "complete" && "Your program and diet are ready. Let\u2019s go!"}
          </p>
        </div>

        {step === "photo" && (
          <div className="space-y-4">
            <MediaCapture
              onCapture={handleCapture}
              preview={preview}
              onClear={() => setPreview(null)}
              label="Full-body photo"
              accept="photo"
            />
            <p className="text-center text-xs text-zinc-400">
              💡 Stand 6-8 feet from the camera. Good lighting helps accuracy.
            </p>
            <button
              onClick={handleSkipPhoto}
              className="block w-full text-center text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Skip — I&apos;ll fill in details manually
            </button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center py-12">
            <div className="relative mb-6">
              <div className="h-20 w-20 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white" />
              <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-zinc-400" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Analyzing your physique...</p>
              <p className="text-xs text-zinc-400">Building your workout program...</p>
              <p className="text-xs text-zinc-400">Creating your meal plan...</p>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            {error && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                {error}
              </p>
            )}

            {analysis.notes && (
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 p-4 dark:from-blue-900/20 dark:to-violet-900/20">
                <p className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                  {analysis.notes}
                </p>
              </div>
            )}

            {/* Weight & Age Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-400">
                  <Weight className="h-3.5 w-3.5" />
                  Estimated Weight
                </div>
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="text-center text-lg font-bold"
                />
                <p className="mt-1 text-center text-xs text-zinc-400">kg</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-2 text-xs font-medium text-zinc-400">Age Range</div>
                <div className="flex items-center gap-2">
                  <Input id="ageLow" type="number" value={ageLow} onChange={(e) => setAgeLow(e.target.value)} className="text-center font-bold" />
                  <span className="text-zinc-400">-</span>
                  <Input id="ageHigh" type="number" value={ageHigh} onChange={(e) => setAgeHigh(e.target.value)} className="text-center font-bold" />
                </div>
                <p className="mt-1 text-center text-xs text-zinc-400">years</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="gender" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Gender</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="goal" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Goal</label>
                <select
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="cut">Cut (Lose Fat)</option>
                  <option value="bulk">Bulk (Build Muscle)</option>
                  <option value="recomp">Recomp (Both)</option>
                  <option value="maintain">Maintain</option>
                </select>
              </div>
            </div>

            {/* Nutrition targets */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Daily Nutrition Targets</p>
              <Input id="calories" label="Calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Input id="protein" label="Protein (g)" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
                <Input id="carbs" label="Carbs (g)" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
                <Input id="fat" label="Fat (g)" type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
              </div>
            </div>

            <Button onClick={() => setStep("plans")} className="w-full">
              Next: View Your Plan <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "plans" && (
          <div className="space-y-4">
            {/* Workout Program Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Dumbbell className="h-5 w-5 text-blue-500" />
                  {(program as { name?: string })?.name || "Your Workout Program"}
                </CardTitle>
              </CardHeader>
              {program ? (
                <div className="space-y-2 px-6 pb-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {(program as { philosophy?: string }).philosophy || "Custom"}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {(program as { days_per_week?: number }).days_per_week || 4} days/week
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      4 weeks
                    </span>
                  </div>
                  <button
                    onClick={() => setShowProgramDetail(!showProgramDetail)}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {showProgramDetail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {showProgramDetail ? "Hide details" : "View weekly breakdown"}
                  </button>
                  {showProgramDetail && (program as { weeks?: { days?: { name: string; exercises?: { name: string }[] }[] }[] }).weeks && (
                    <div className="space-y-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                      {((program as { weeks: { days: { name: string; exercises: { name: string }[] }[] }[] }).weeks[0]?.days || []).map((day: { name: string; exercises: { name: string }[] }, i: number) => (
                        <div key={i} className="rounded-lg bg-white p-2 dark:bg-zinc-900">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white">{day.name}</p>
                          <p className="text-[10px] text-zinc-400">
                            {day.exercises?.map((e: { name: string }) => e.name).join(" • ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="px-6 pb-6 text-sm text-zinc-400">No program generated — you can create one later.</p>
              )}
            </Card>

            {/* Diet Plan Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UtensilsCrossed className="h-5 w-5 text-emerald-500" />
                  {(diet as { name?: string })?.name || "Your Meal Plan"}
                </CardTitle>
              </CardHeader>
              {diet ? (
                <div className="space-y-2 px-6 pb-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {calories} cal/day
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {protein}g P / {carbs}g C / {fat}g F
                    </span>
                  </div>
                  <button
                    onClick={() => setShowDietDetail(!showDietDetail)}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    {showDietDetail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {showDietDetail ? "Hide details" : "View meal breakdown"}
                  </button>
                  {showDietDetail && (diet as { days?: { day: string; meals?: { name: string; calories: number }[] }[] }).days && (
                    <div className="space-y-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                      {((diet as { days: { day: string; meals: { name: string; calories: number }[] }[] }).days.slice(0, 2) || []).map((day: { day: string; meals: { name: string; calories: number }[] }, i: number) => (
                        <div key={i} className="rounded-lg bg-white p-2 dark:bg-zinc-900">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white">{day.day}</p>
                          <div className="mt-1 space-y-0.5">
                            {day.meals?.map((meal: { name: string; calories: number }, j: number) => (
                              <p key={j} className="text-[10px] text-zinc-400">
                                {meal.name} — {meal.calories} cal
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                      <p className="text-[10px] text-zinc-400">+ {((diet as { days: unknown[] }).days.length || 0) - 2} more days...</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="px-6 pb-6 text-sm text-zinc-400">No diet plan generated — you can create one later.</p>
              )}
            </Card>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("review")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleComplete} className="flex-1" loading={loading}>
                Let&apos;s Go! <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="flex flex-col items-center py-12">
            <div className="mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-5 shadow-lg shadow-emerald-300/30 dark:shadow-emerald-900/30">
              <Check className="h-10 w-10 text-white" />
            </div>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">+50 XP earned! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}
