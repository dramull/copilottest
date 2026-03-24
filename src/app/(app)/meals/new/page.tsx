"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaCapture } from "@/components/ui/media-capture";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MealAnalysis {
  name: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export default function NewMealPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Manual fields
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  async function handlePhotoUpload(_file: File, b64: string) {
    setBase64(b64);
    setPreview(`data:image/jpeg;base64,${b64}`);
    setAnalyzing(true);
    setError("");

    try {
      const res = await fetch("/api/ai/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64 }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data: MealAnalysis = await res.json();
      setAnalysis(data);
      setName(data.name);
      setCalories(String(data.calories));
      setProtein(String(data.protein_g));
      setCarbs(String(data.carbs_g));
      setFat(String(data.fat_g));
    } catch {
      setError("Could not analyze photo. Enter details manually.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!name) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upload photo if we have one
    let photoUrl: string | null = null;
    if (base64) {
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const byteString = atob(base64);
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        bytes[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/jpeg" });

      const { data: upload } = await supabase.storage
        .from("meals")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (upload) {
        const { data: urlData } = supabase.storage.from("meals").getPublicUrl(upload.path);
        photoUrl = urlData.publicUrl;
      }
    }

    await supabase.from("meals").insert({
      user_id: user.id,
      name,
      photo_url: photoUrl,
      calories: parseInt(calories) || 0,
      protein_g: parseFloat(protein) || 0,
      carbs_g: parseFloat(carbs) || 0,
      fat_g: parseFloat(fat) || 0,
    });

    // Update meal streak
    await fetch("/api/streaks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streak_type: "meal" }),
    });

    router.push("/meals");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/meals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Log Meal</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Snap a photo or enter details manually</p>
        </div>
      </div>

      <MediaCapture
        onCapture={handlePhotoUpload}
        preview={preview}
        onClear={() => { setPreview(null); setBase64(null); setAnalysis(null); }}
        label="Photo of your meal"
        accept="photo"
      />

      {analyzing && (
        <div className="flex items-center gap-3 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800">
          <Sparkles className="h-5 w-5 animate-pulse text-zinc-400" />
          <p className="text-sm text-zinc-600 dark:text-zinc-300">AI is analyzing your meal...</p>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          {error}
        </p>
      )}

      {analysis && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            AI identified: {analysis.description || analysis.name}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <Input
          id="name"
          label="Meal Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Grilled chicken with rice"
        />

        <Input
          id="calories"
          label="Calories"
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="0"
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            id="protein"
            label="Protein (g)"
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="0"
          />
          <Input
            id="carbs"
            label="Carbs (g)"
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="0"
          />
          <Input
            id="fat"
            label="Fat (g)"
            type="number"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            placeholder="0"
          />
        </div>

        <Button onClick={handleSave} className="w-full" loading={saving} disabled={!name}>
          Save Meal
        </Button>
      </div>
    </div>
  );
}
