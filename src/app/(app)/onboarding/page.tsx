"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { createClient } from "@/lib/supabase/client";
import { Activity, ArrowRight, Camera, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "photo" | "analyzing" | "review" | "complete";

interface AiSuggestions {
  estimated_age?: number;
  estimated_gender?: string;
  estimated_bmi?: number;
  suggested_goal?: string;
  suggested_calorie_target?: number;
  suggested_protein_g?: number;
  suggested_carbs_g?: number;
  suggested_fat_g?: number;
  suggested_training_days?: number;
  suggested_philosophy?: string;
  notes?: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("photo");
  const [preview, setPreview] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestions>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Editable fields
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [philosophy, setPhilosophy] = useState("");

  async function handlePhotoUpload(_file: File, base64: string) {
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

      const data: AiSuggestions = await res.json();
      setSuggestions(data);
      setAge(String(data.estimated_age || ""));
      setGender(data.estimated_gender || "");
      setGoal(data.suggested_goal || "recomp");
      setCalories(String(data.suggested_calorie_target || 2000));
      setProtein(String(data.suggested_protein_g || 150));
      setCarbs(String(data.suggested_carbs_g || 200));
      setFat(String(data.suggested_fat_g || 70));
      setPhilosophy(data.suggested_philosophy || "Push/Pull/Legs");
      setStep("review");
    } catch {
      setError("Could not analyze photo. You can fill in details manually.");
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
    setPhilosophy("Push/Pull/Legs");
    setStep("review");
  }

  async function handleComplete() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      age: age ? parseInt(age) : null,
      gender: gender || null,
      goal: goal || null,
      calorie_target: calories ? parseInt(calories) : null,
      protein_g: protein ? parseInt(protein) : null,
      carbs_g: carbs ? parseInt(carbs) : null,
      fat_g: fat ? parseInt(fat) : null,
      training_philosophy: philosophy || null,
      onboarded: true,
    }).eq("id", user.id);

    setStep("complete");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Activity className="mx-auto mb-4 h-10 w-10 text-zinc-900 dark:text-white" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {step === "photo" && "Let's get started"}
            {step === "analyzing" && "Analyzing..."}
            {step === "review" && "Confirm your profile"}
            {step === "complete" && "You're all set!"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {step === "photo" && "Snap a selfie and AI will set up your fitness profile"}
            {step === "analyzing" && "AI is estimating your profile"}
            {step === "review" && "Adjust anything that doesn't look right"}
            {step === "complete" && "Redirecting to your dashboard..."}
          </p>
        </div>

        {step === "photo" && (
          <div className="space-y-4">
            <PhotoUpload
              onUpload={handlePhotoUpload}
              preview={preview}
              onClear={() => setPreview(null)}
              label="Upload a selfie or body photo"
            />
            <button
              onClick={handleSkipPhoto}
              className="block w-full text-center text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Skip — I'll fill in details manually
            </button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center py-12">
            <div className="mb-4 animate-pulse rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
              <Sparkles className="h-8 w-8 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-400">This usually takes a few seconds...</p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            {error && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                {error}
              </p>
            )}
            {suggestions.notes && (
              <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800">
                <p className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  {suggestions.notes}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input id="age" label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
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

            <Input id="calories" label="Daily Calorie Target" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />

            <div className="grid grid-cols-3 gap-3">
              <Input id="protein" label="Protein (g)" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
              <Input id="carbs" label="Carbs (g)" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              <Input id="fat" label="Fat (g)" type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
            </div>

            <Input id="philosophy" label="Training Style" value={philosophy} onChange={(e) => setPhilosophy(e.target.value)} placeholder="e.g., Push/Pull/Legs, Starting Strength" />

            <Button onClick={handleComplete} className="w-full" loading={loading}>
              Confirm & Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "complete" && (
          <div className="flex flex-col items-center py-12">
            <div className="mb-4 rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30">
              <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
