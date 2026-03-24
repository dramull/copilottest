"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MediaCapture } from "@/components/ui/media-capture";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, ArrowLeft, CheckCircle2, Target, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface FormResult {
  exercise_detected: string;
  form_score: number;
  phase_detected?: string;
  good_points: string[];
  issues: string[];
  cues: string[];
  injury_risk?: string;
  rep_quality?: string;
  overall_assessment: string;
  xp_earned?: number;
}

interface PastAnalysis {
  id: string;
  exercise_name: string;
  form_score: number;
  created_at: string;
}

export default function FormCheckPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FormResult | null>(null);
  const [error, setError] = useState("");
  const [exercise, setExercise] = useState("");
  const [pastAnalyses, setPastAnalyses] = useState<PastAnalysis[]>([]);

  useEffect(() => {
    async function loadPast() {
      const supabase = createClient();
      const { data } = await supabase
        .from("form_analyses")
        .select("id, exercise_name, form_score, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setPastAnalyses(data);
    }
    loadPast();
  }, [result]);

  async function handleCapture(file: File, base64: string) {
    setPreview(URL.createObjectURL(file));

    if (file.type.startsWith("video/")) {
      // Extract frames from video using canvas
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.muted = true;

      await new Promise<void>((resolve) => {
        video.onloadeddata = () => resolve();
        video.load();
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = 640;
      canvas.height = 480;

      const extractedFrames: string[] = [];
      const duration = video.duration;
      const frameCount = Math.min(3, Math.ceil(duration));

      for (let i = 0; i < frameCount; i++) {
        video.currentTime = (duration / (frameCount + 1)) * (i + 1);
        await new Promise<void>((resolve) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frameBase64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
            extractedFrames.push(frameBase64);
            resolve();
          };
        });
      }

      setFrames(extractedFrames);
    } else {
      // Image: use as single frame
      setFrames([base64]);
    }
  }

  async function handleAnalyze() {
    if (frames.length === 0) return;
    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai/analyze-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames, exercise }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data: FormResult = await res.json();
      setResult(data);
    } catch {
      setError("Could not analyze form. Please try again with a clearer video.");
    } finally {
      setAnalyzing(false);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 8) return "text-emerald-500";
    if (score >= 6) return "text-amber-500";
    return "text-red-500";
  }

  function getScoreBg(score: number) {
    if (score >= 8) return "from-emerald-400 to-emerald-600";
    if (score >= 6) return "from-amber-400 to-amber-600";
    return "from-red-400 to-red-600";
  }

  function getRiskVariant(risk?: string): "success" | "warning" | "danger" {
    if (risk === "low") return "success";
    if (risk === "medium") return "warning";
    return "danger";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Form Check</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Upload a video of your lift for AI coaching</p>
        </div>
      </div>

      {!result ? (
        <>
          {/* Video capture */}
          <MediaCapture
            onCapture={handleCapture}
            preview={preview}
            onClear={() => { setPreview(null); setFrames([]); }}
            label="Record or upload a video of your lift"
            accept="both"
          />

          {/* Exercise hint */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Exercise (optional — AI will auto-detect)
            </label>
            <select
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Auto-detect</option>
              <option value="squat">Squat</option>
              <option value="bench_press">Bench Press</option>
              <option value="deadlift">Deadlift</option>
              <option value="overhead_press">Overhead Press</option>
              <option value="barbell_row">Barbell Row</option>
              <option value="pull_up">Pull-up</option>
              <option value="romanian_deadlift">Romanian Deadlift</option>
              <option value="hip_thrust">Hip Thrust</option>
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <Button
            onClick={handleAnalyze}
            className="w-full"
            loading={analyzing}
            disabled={frames.length === 0}
            size="lg"
          >
            <Video className="h-5 w-5" />
            {analyzing ? "Analyzing form..." : "Analyze My Form"}
          </Button>
        </>
      ) : (
        <>
          {/* Score */}
          <div className="flex flex-col items-center py-6">
            <div className={`mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${getScoreBg(result.form_score)} shadow-lg`}>
              <span className="text-3xl font-bold text-white">{result.form_score}</span>
            </div>
            <p className="text-lg font-bold text-zinc-900 dark:text-white">{result.exercise_detected}</p>
            <div className="mt-2 flex gap-2">
              {result.injury_risk && (
                <Badge variant={getRiskVariant(result.injury_risk)}>
                  {result.injury_risk} injury risk
                </Badge>
              )}
              {result.rep_quality && (
                <Badge variant="info">{result.rep_quality} quality</Badge>
              )}
            </div>
            {result.xp_earned && (
              <p className="mt-2 text-xs text-violet-500 font-medium">+{result.xp_earned} XP earned</p>
            )}
          </div>

          {/* Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overall Assessment</CardTitle>
            </CardHeader>
            <p className="px-6 pb-6 text-sm text-zinc-600 dark:text-zinc-400">{result.overall_assessment}</p>
          </Card>

          {/* Good Points */}
          {result.good_points.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" /> What You&apos;re Doing Well
                </CardTitle>
              </CardHeader>
              <ul className="space-y-2">
                {result.good_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="mt-1 text-emerald-500">✓</span> {point}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Issues */}
          {result.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" /> Areas to Improve
                </CardTitle>
              </CardHeader>
              <ul className="space-y-2">
                {result.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="mt-1 text-amber-500">!</span> {issue}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Coaching Cues */}
          {result.cues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-blue-600 dark:text-blue-400">
                  <Target className="h-5 w-5" /> Coaching Cues
                </CardTitle>
                <CardDescription>Focus on these during your next set</CardDescription>
              </CardHeader>
              <div className="space-y-2">
                {result.cues.map((cue, i) => (
                  <div key={i} className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    💡 {cue}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setResult(null); setPreview(null); setFrames([]); }} className="flex-1">
              Analyze Another
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">Done</Button>
            </Link>
          </div>
        </>
      )}

      {/* Past analyses */}
      {pastAnalyses.length > 0 && !result && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Recent Form Checks</h2>
          <div className="space-y-2">
            {pastAnalyses.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{a.exercise_name}</p>
                  <p className="text-xs text-zinc-400">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <div className={`text-lg font-bold ${getScoreColor(a.form_score)}`}>
                  {a.form_score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
