import { chatCompletion } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { philosophy, days_per_week, weeks, goal, experience } = await request.json();

  try {
    const prompt = `Create a ${weeks || 4}-week workout program.

Training philosophy: ${philosophy || "General fitness"}
Days per week: ${days_per_week || 4}
Goal: ${goal || "General fitness"}
Experience level: ${experience || "Intermediate"}

Return ONLY valid JSON (no markdown, no explanation) in this format:
{
  "name": "Program Name",
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "name": "Upper Body A",
          "exercises": [
            {
              "name": "Bench Press",
              "sets": 4,
              "reps": "8-10",
              "rest_seconds": 120,
              "notes": "Focus on controlled eccentric"
            }
          ]
        }
      ]
    }
  ]
}

Create a complete, periodized program with progressive overload. Include compound movements. Each week should have ${days_per_week || 4} training days.`;

    const result = await chatCompletion([{ role: "user", content: prompt }]);
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Program generation error:", error);
    return NextResponse.json({ error: "Failed to generate program" }, { status: 500 });
  }
}
