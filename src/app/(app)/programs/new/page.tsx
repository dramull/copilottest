"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const philosophies = [
  { value: "ppl", label: "Push / Pull / Legs" },
  { value: "upper_lower", label: "Upper / Lower Split" },
  { value: "rp", label: "Renaissance Periodization (RP)" },
  { value: "starting_strength", label: "Starting Strength" },
  { value: "greg_doucette", label: "Greg Doucette Style" },
  { value: "full_body", label: "Full Body" },
  { value: "custom", label: "Custom — I'll describe it" },
];

export default function NewProgramPage() {
  const [philosophy, setPhilosophy] = useState("");
  const [customPhilosophy, setCustomPhilosophy] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("4");
  const [weeks, setWeeks] = useState("4");
  const [goal, setGoal] = useState("hypertrophy");
  const [experience, setExperience] = useState("intermediate");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleGenerate() {
    const phil = philosophy === "custom" ? customPhilosophy : philosophies.find((p) => p.value === philosophy)?.label || philosophy;
    if (!phil) return;

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          philosophy: phil,
          days_per_week: parseInt(daysPerWeek),
          weeks: parseInt(weeks),
          goal,
          experience,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();

      // Save to database
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("programs").insert({
        user_id: user.id,
        name: data.name || `${phil} Program`,
        philosophy: phil,
        weeks: parseInt(weeks),
        days_per_week: parseInt(daysPerWeek),
        program_data: data.weeks || [],
        active: true,
      });

      router.push("/programs");
      router.refresh();
    } catch {
      setError("Failed to generate program. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/programs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Generate Program</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">AI will build a periodized plan for you</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Training Philosophy</label>
          <div className="grid grid-cols-2 gap-2">
            {philosophies.map((p) => (
              <button
                key={p.value}
                onClick={() => setPhilosophy(p.value)}
                className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                  philosophy === p.value
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {philosophy === "custom" && (
          <Input
            id="custom"
            label="Describe your training approach"
            value={customPhilosophy}
            onChange={(e) => setCustomPhilosophy(e.target.value)}
            placeholder="e.g., 5/3/1 with BBB accessories, focusing on powerlifting"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Days per Week</label>
            <select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {[2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Program Length</label>
            <select
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {[4, 6, 8, 12].map((w) => (
                <option key={w} value={w}>{w} weeks</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="hypertrophy">Muscle Growth</option>
              <option value="strength">Strength</option>
              <option value="powerlifting">Powerlifting</option>
              <option value="general">General Fitness</option>
              <option value="athletic">Athletic Performance</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Experience</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        <Button
          onClick={handleGenerate}
          className="w-full"
          loading={generating}
          disabled={!philosophy || (philosophy === "custom" && !customPhilosophy)}
        >
          <Sparkles className="h-4 w-4" />
          {generating ? "Generating program..." : "Generate with AI"}
        </Button>
      </div>
    </div>
  );
}
