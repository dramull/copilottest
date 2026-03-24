import { Button } from "@/components/ui/button";
import { Activity, Camera, Dumbbell, Sparkles, UtensilsCrossed, TrendingUp } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Camera,
    title: "Photo-First Everything",
    description: "Snap a photo of your meal, your body, or your lift. AI identifies and logs it automatically.",
  },
  {
    icon: Dumbbell,
    title: "Smart Lift Analysis",
    description: "Upload a video of your set. Get form feedback, rep counts, and actionable coaching cues.",
  },
  {
    icon: UtensilsCrossed,
    title: "Effortless Meal Tracking",
    description: "Point your camera at your plate. Calories, protein, carbs, and fat — estimated in seconds.",
  },
  {
    icon: Sparkles,
    title: "AI Workout Programs",
    description: "Choose your philosophy — RP, Starting Strength, or your own style. AI builds the periodized plan.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Side-by-side progress photos with AI-estimated body composition trends over time.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-zinc-900 dark:text-white" />
          <span className="text-xl font-bold text-zinc-900 dark:text-white">FitVision</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center md:pt-32 md:pb-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          <Sparkles className="h-4 w-4" />
          AI-Powered Fitness for 2026
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-zinc-900 md:text-7xl dark:text-white">
          Snap a photo.
          <br />
          <span className="text-zinc-400">The AI handles the rest.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
          FitVision uses computer vision to track meals, analyze lifting form, and build
          personalized workout and diet plans — all from your camera.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Start Free →</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-4 inline-flex rounded-xl bg-white p-2.5 dark:bg-zinc-800">
                <feature.icon className="h-5 w-5 text-zinc-900 dark:text-white" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-6 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
        © 2026 FitVision. Built with AI.
      </footer>
    </div>
  );
}
