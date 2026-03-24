import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: streaks } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user.id);

  return NextResponse.json(streaks || []);
}

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
  const { streak_type } = body;
  if (!streak_type || !["workout", "meal", "login"].includes(streak_type)) {
    return NextResponse.json({ error: "Invalid streak type" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Get current streak
  const { data: existing } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user.id)
    .eq("streak_type", streak_type)
    .single();

  if (existing) {
    // Check if already logged today
    if (existing.last_activity_date === today) {
      return NextResponse.json(existing);
    }

    // Check if streak continues (yesterday or today)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const isConsecutive = existing.last_activity_date === yesterdayStr;
    const newStreak = isConsecutive ? existing.current_streak + 1 : 1;
    const longestStreak = Math.max(newStreak, existing.longest_streak);

    const { data: updated } = await supabase
      .from("streaks")
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    // Award XP for streaks
    let xpBonus = 10;
    if (newStreak >= 7) xpBonus = 25;
    if (newStreak >= 30) xpBonus = 50;

    const { data: profile } = await supabase
      .from("profiles")
      .select("xp")
      .eq("id", user.id)
      .single();

    if (profile) {
      await supabase.from("profiles").update({
        xp: (profile.xp || 0) + xpBonus,
      }).eq("id", user.id);
    }

    // Check for streak achievements
    const milestones = [
      { days: 3, type: "streak_3", title: "Getting Started", desc: "3-day streak!", icon: "🔥" },
      { days: 7, type: "streak_7", title: "Week Warrior", desc: "7-day streak!", icon: "⚡" },
      { days: 14, type: "streak_14", title: "Consistent", desc: "14-day streak!", icon: "💪" },
      { days: 30, type: "streak_30", title: "Unstoppable", desc: "30-day streak!", icon: "🏆" },
      { days: 100, type: "streak_100", title: "Legend", desc: "100-day streak!", icon: "👑" },
    ];

    for (const milestone of milestones) {
      if (newStreak === milestone.days) {
        await supabase.from("achievements").insert({
          user_id: user.id,
          achievement_type: `${streak_type}_${milestone.type}`,
          title: milestone.title,
          description: `${milestone.desc} Keep up the ${streak_type} logging!`,
          icon: milestone.icon,
        });
      }
    }

    return NextResponse.json({ ...updated, xp_earned: xpBonus });
  }

  // Create new streak
  const { data: newStreak } = await supabase
    .from("streaks")
    .insert({
      user_id: user.id,
      streak_type,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    })
    .select()
    .single();

  return NextResponse.json(newStreak);
}
