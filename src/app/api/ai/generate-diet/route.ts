import { chatCompletion } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { diet_type, calorie_target, protein_g, carbs_g, fat_g, meals_per_day, preferences } = body;

  try {
    const prompt = `Create a 7-day meal plan.

Diet type: ${diet_type || "Flexible"}
Daily calorie target: ${calorie_target || 2000} kcal
Macros: ${protein_g || 150}g protein, ${carbs_g || 200}g carbs, ${fat_g || 70}g fat
Meals per day: ${meals_per_day || 3}
${preferences ? `Preferences/restrictions: ${preferences}` : ""}

Return ONLY valid JSON (no markdown, no explanation) in this format:
{
  "name": "7-Day ${diet_type || "Balanced"} Meal Plan",
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "name": "Breakfast",
          "foods": ["2 eggs scrambled", "1 slice whole grain toast", "1/2 avocado"],
          "calories": 450,
          "protein_g": 25,
          "carbs_g": 30,
          "fat_g": 28
        }
      ]
    }
  ],
  "grocery_list": ["eggs", "whole grain bread", "avocados"]
}

Make it practical, delicious, and exactly matching the macro targets. Include all 7 days.`;

    const result = await chatCompletion([{ role: "user", content: prompt }]);
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Diet generation error:", error);
    return NextResponse.json({ error: "Failed to generate diet plan" }, { status: 500 });
  }
}
