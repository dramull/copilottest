# FitVision

A computer-vision-first fitness app that removes friction from every interaction. Snap a photo — the AI handles the rest.

## Tech Stack

| Layer            | Choice                                      |
| ---------------- | ------------------------------------------- |
| Frontend         | Next.js 15 (App Router) + Tailwind CSS v4   |
| Auth             | Supabase Auth                                |
| Database         | Supabase (Postgres + Storage + Realtime)    |
| AI / Vision API  | OpenRouter (multi-model, vision-capable)     |
| Hosting          | Vercel                                      |

## Core Features

### Vision-Powered Onboarding
- User uploads or snaps a selfie.
- Model estimates approximate age, gender, and BMI.
- A starter fitness plan is suggested automatically — user confirms or adjusts.

### Meal Tracking (Photo-First)
- Upload or capture a photo of any meal.
- Model identifies foods, estimates calories and macros.
- User confirms with a single tap; entry is logged.

### Lift Form Analysis
- Record or upload a video of a lift.
- Model analyzes joint angles, bar path, and tempo.
- Real-time rep counting and form score overlay.
- Actionable cues ("knees caving — push them out") returned after each set.

### AI Workout Programming
- Choose a training philosophy (e.g., Renaissance Periodization / Mike Israetel, Greg Doucette, Starting Strength) or describe your own approach.
- The AI agent builds a periodized program with progressive overload tracking.
- Automatic deload suggestions based on fatigue and performance trends.

### AI Diet Planning
- Select a diet type: keto, vegan, Mediterranean, flexible IIFYM, carnivore, etc.
- Set calorie and macro targets, or let the model recommend them from your goal (cut / bulk / recomp).
- Weekly meal plan generation with grocery list export.

### Additional Features
- **Progress Photos & Body Composition Trends** — side-by-side comparisons with AI-estimated body-fat tracking over time.
- **Wearable Integration** — sync heart rate, sleep, and step data from Apple Health / Google Health Connect.
- **Social & Accountability** — optional workout partners, shared challenges, and streak tracking.
- **Voice Logging** — hands-free logging via voice commands mid-workout.
- **Injury Prevention Alerts** — flag overuse patterns and recommend mobility work or rest days.
- **Supplement Tracker** — log and time supplements; get evidence-based recommendations.
- **Hydration Tracking** — smart reminders based on activity level and weather.

## Design Principles

1. **Simple code that does complex things** — no over-engineering.
2. **Minimal friction** — the camera is the primary input; text entry is a fallback.
3. **Maximalist UX, minimalist UI** — every screen earns its pixels.

## Getting Started

> **Prerequisites:** Node.js 20+ and [pnpm](https://pnpm.io/) 9+.

```bash
# install dependencies
pnpm install

# copy environment template and fill in keys
cp .env.example .env.local

# run the dev server
pnpm dev
```

## Environment Variables

| Variable                       | Description                        |
| ------------------------------ | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`     | Supabase project URL               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Supabase anonymous/public key      |
| `SUPABASE_SERVICE_ROLE_KEY`    | Supabase service-role secret       |
| `OPENROUTER_API_KEY`           | OpenRouter API key                 |

## License

MIT
