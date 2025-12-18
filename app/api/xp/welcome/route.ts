import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { updatePlayerState } from "@/lib/player/updatePlayerState";

const WELCOME_XP = 50;

export async function POST() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 1️⃣ Check if welcome XP already granted
  const { data: existing } = await supabase
    .from("xp_events")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_type", "welcome")
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ granted: false });
  }

  // 2️⃣ Insert XP event
  await supabase.from("xp_events").insert({
    user_id: user.id,
    amount: WELCOME_XP,
    event_type: "welcome",
    metadata: { reason: "Account created" },
  });

  // 3️⃣ Update cached player state
  await updatePlayerState(user.id, WELCOME_XP);

  return NextResponse.json({
    granted: true,
    xp: WELCOME_XP,
  });
}
