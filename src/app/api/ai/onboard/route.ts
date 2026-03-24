import { analyzeImage } from "@/lib/openrouter";
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
    const prompt = `Analyze this selfie/body photo to help create a fitness profile.
Estimate the following as best you can from the image.

Return ONLY valid JSON (no markdown, no explanation):
{
  "estimated_age": 28,
  "estimated_gender": "male",
  "estimated_bmi": 24.5,
  "body_type": "mesomorph",
  "estimated_body_fat_pct": 18,
  "suggested_goal": "recomp",
  "suggested_calorie_target": 2400,
  "suggested_protein_g": 180,
  "suggested_carbs_g": 260,
  "suggested_fat_g": 75,
  "suggested_training_days": 4,
  "suggested_philosophy": "Push/Pull/Legs",
  "notes": "Good base of muscle, could benefit from a slight recomposition phase"
}`;

    const result = await analyzeImage(image, prompt);
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Onboarding analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze photo" }, { status: 500 });
  }
}
