import { analyzeImage } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { image } = await request.json();
  if (!image) return NextResponse.json({ error: "Image required" }, { status: 400 });

  try {
    const prompt = `Analyze this meal photo. Identify all foods visible and estimate nutritional content.
Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "name": "Brief meal name",
  "description": "Short description of foods",
  "foods": ["food1", "food2"],
  "calories": 500,
  "protein_g": 30,
  "carbs_g": 50,
  "fat_g": 20
}`;

    const result = await analyzeImage(image, prompt);
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Meal analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze meal" }, { status: 500 });
  }
}
