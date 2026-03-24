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
  const { image, exercise } = body;
  if (!image || typeof image !== "string") return NextResponse.json({ error: "Image required" }, { status: 400 });
  if (image.length > 10_000_000) return NextResponse.json({ error: "Image too large (max 7.5MB)" }, { status: 400 });

  try {
    const prompt = `Analyze this ${exercise || "exercise"} form from the image. Evaluate the lifting technique.
Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "exercise_detected": "Squat",
  "form_score": 7.5,
  "good_points": ["Depth is adequate", "Back is straight"],
  "issues": ["Knees caving slightly", "Could go deeper"],
  "cues": ["Push knees out over toes", "Brace your core harder"],
  "overall_assessment": "Good form with minor adjustments needed"
}`;

    const result = await analyzeImage(image, prompt);
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Form analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze form" }, { status: 500 });
  }
}
