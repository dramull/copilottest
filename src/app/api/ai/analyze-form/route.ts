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
  const { frames, exercise } = body;
  if (!frames || !Array.isArray(frames) || frames.length === 0) {
    return NextResponse.json({ error: "Video frames required" }, { status: 400 });
  }

  // Validate frames
  for (const frame of frames) {
    if (typeof frame !== "string") return NextResponse.json({ error: "Invalid frame data" }, { status: 400 });
    if (frame.length > 10_000_000) return NextResponse.json({ error: "Frame too large" }, { status: 400 });
  }

  try {
    // Analyze each frame and combine results
    const prompt = `You are an expert strength coach analyzing ${exercise || "exercise"} form from a video frame.
    
Evaluate the lifting technique in detail. Consider:
- Joint angles and alignment
- Bar path (if applicable)
- Spine position and bracing
- Foot placement and pressure distribution
- Tempo and control
- Common injury risk factors

Return ONLY valid JSON (no markdown, no explanation):
{
  "exercise_detected": "Barbell Back Squat",
  "form_score": 7.5,
  "phase_detected": "descent",
  "good_points": [
    "Good depth - breaking parallel",
    "Upper back stays tight",
    "Controlled tempo on the eccentric"
  ],
  "issues": [
    "Slight knee valgus at the bottom",
    "Forward lean increasing as fatigue sets in",
    "Heels lifting slightly at the bottom"
  ],
  "cues": [
    "Push your knees out over your pinky toes",
    "Drive your elbows under the bar to stay upright",
    "Try spreading the floor with your feet",
    "Take a bigger breath and brace before each rep"
  ],
  "injury_risk": "low",
  "rep_quality": "good",
  "overall_assessment": "Solid squat form with minor corrections needed. The knee valgus should be addressed to prevent long-term issues. Consider adding pause squats to improve bottom position stability."
}`;

    // Use the first/best frame for analysis
    const result = await analyzeImage(frames[0], prompt);
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const data = JSON.parse(cleaned);

    // Save analysis to database
    await supabase.from("form_analyses").insert({
      user_id: user.id,
      exercise_name: data.exercise_detected || exercise || "Unknown",
      form_score: data.form_score || 0,
      good_points: data.good_points || [],
      issues: data.issues || [],
      cues: data.cues || [],
      overall_assessment: data.overall_assessment || "",
    });

    // Award XP for form check
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp")
      .eq("id", user.id)
      .single();

    if (profile) {
      await supabase.from("profiles").update({
        xp: (profile.xp || 0) + 15,
      }).eq("id", user.id);
    }

    return NextResponse.json({ ...data, xp_earned: 15 });
  } catch (error) {
    console.error("Form analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze form" }, { status: 500 });
  }
}
