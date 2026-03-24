import { analyzeImage, chatCompletion } from "@/lib/openrouter";
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
  const { image } = body;
  if (!image || typeof image !== "string") return NextResponse.json({ error: "Image required" }, { status: 400 });
  if (image.length > 10_000_000) return NextResponse.json({ error: "Image too large (max 7.5MB)" }, { status: 400 });

  try {
    // Step 1: Analyze the body photo
    const analysisPrompt = `Analyze this full-body photo for a fitness assessment. Be realistic and helpful.

Return ONLY valid JSON (no markdown, no explanation):
{
  "estimated_weight_kg": 82,
  "age_range_low": 25,
  "age_range_high": 30,
  "estimated_gender": "male",
  "estimated_body_fat_pct": 18,
  "estimated_bmi": 25.5,
  "body_type": "mesomorph",
  "fitness_level": "intermediate",
  "suggested_goal": "recomp",
  "notes": "Good muscular base with some excess body fat around midsection. Would benefit from a recomposition approach."
}`;

    const analysisResult = await analyzeImage(image, analysisPrompt);
    const analysisCleaned = analysisResult.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(analysisCleaned);

    // Step 2: Generate initial workout program based on analysis
    const programPrompt = `Create a 4-week workout program for someone with these stats:
- Weight: ${analysis.estimated_weight_kg}kg
- Age range: ${analysis.age_range_low}-${analysis.age_range_high}
- Body fat: ${analysis.estimated_body_fat_pct}%
- Fitness level: ${analysis.fitness_level}
- Goal: ${analysis.suggested_goal}
- Body type: ${analysis.body_type}

Return ONLY valid JSON (no markdown, no explanation):
{
  "name": "Your Personalized Program",
  "philosophy": "Push/Pull/Legs",
  "days_per_week": 4,
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "name": "Push Day",
          "exercises": [
            { "name": "Bench Press", "sets": 4, "reps": "8-10", "rest_seconds": 120, "notes": "Focus on form" }
          ]
        }
      ]
    }
  ]
}

Create a complete 4-week periodized program with 4 training days per week. Include compound movements and progressive overload.`;

    const programResult = await chatCompletion([{ role: "user", content: programPrompt }]);
    const programCleaned = programResult.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const program = JSON.parse(programCleaned);

    // Step 3: Generate initial diet plan based on analysis
    // Calorie multipliers per kg body weight based on goal:
    // Cut: ~500 cal deficit for moderate fat loss
    // Bulk: ~500 cal surplus for lean muscle gain
    // Maintenance/recomp: TDEE estimate for active individuals
    const CALORIES_PER_KG_CUT = 24;
    const CALORIES_PER_KG_BULK = 32;
    const CALORIES_PER_KG_MAINTAIN = 28;

    const calorieTarget = analysis.suggested_goal === "cut"
      ? Math.round(analysis.estimated_weight_kg * CALORIES_PER_KG_CUT)
      : analysis.suggested_goal === "bulk"
        ? Math.round(analysis.estimated_weight_kg * CALORIES_PER_KG_BULK)
        : Math.round(analysis.estimated_weight_kg * CALORIES_PER_KG_MAINTAIN);

    const proteinTarget = Math.round(analysis.estimated_weight_kg * 2);
    const fatTarget = Math.round(analysis.estimated_weight_kg * 0.8);
    const carbTarget = Math.round((calorieTarget - proteinTarget * 4 - fatTarget * 9) / 4);

    const dietPrompt = `Create a 7-day meal plan for someone with these targets:
- Calories: ${calorieTarget} kcal/day
- Protein: ${proteinTarget}g, Carbs: ${carbTarget}g, Fat: ${fatTarget}g
- Goal: ${analysis.suggested_goal}

Return ONLY valid JSON (no markdown, no explanation):
{
  "name": "Personalized Meal Plan",
  "diet_type": "Balanced",
  "days": [
    {
      "day": "Monday",
      "meals": [
        { "name": "Breakfast", "foods": ["3 eggs scrambled", "2 slices whole grain toast", "1 banana"], "calories": 450, "protein_g": 28, "carbs_g": 52, "fat_g": 16 }
      ]
    }
  ]
}

Create practical, delicious meals for all 7 days with 4 meals each.`;

    const dietResult = await chatCompletion([{ role: "user", content: dietPrompt }]);
    const dietCleaned = dietResult.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const diet = JSON.parse(dietCleaned);

    return NextResponse.json({
      analysis: {
        estimated_weight_kg: analysis.estimated_weight_kg,
        age_range_low: analysis.age_range_low,
        age_range_high: analysis.age_range_high,
        estimated_gender: analysis.estimated_gender,
        estimated_body_fat_pct: analysis.estimated_body_fat_pct,
        estimated_bmi: analysis.estimated_bmi,
        body_type: analysis.body_type,
        fitness_level: analysis.fitness_level,
        suggested_goal: analysis.suggested_goal,
        notes: analysis.notes,
      },
      nutrition: {
        calorie_target: calorieTarget,
        protein_g: proteinTarget,
        carbs_g: carbTarget,
        fat_g: fatTarget,
      },
      program,
      diet,
    });
  } catch (error) {
    console.error("Onboarding analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze photo" }, { status: 500 });
  }
}
