import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const { data: scheduled } = await supabase
    .from("scheduled_workouts")
    .select("*")
    .eq("user_id", user.id)
    .eq("scheduled_date", date);

  return NextResponse.json(scheduled || []);
}

// Mark a scheduled workout as completed/skipped
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { id, status, workout_id } = body;
  if (!id) return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });
  const validStatuses = ["pending", "completed", "skipped", "partial"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: updated } = await supabase
    .from("scheduled_workouts")
    .update({
      status: status || "completed",
      workout_id: workout_id || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  return NextResponse.json(updated);
}
