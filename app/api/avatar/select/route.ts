import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { tierGte } from "@/lib/tier/tierRank";

export async function POST(req: Request) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { avatar_id } = await req.json();

  const { data: state } = await supabase
    .from("player_state_cache")
    .select("tier")
    .eq("user_id", user.id)
    .single();

  const { data: avatar } = await supabase
    .from("ace_kat_avatars")
    .select("*")
    .eq("id", avatar_id)
    .single();

  if (!avatar || !tierGte(state?.tier ?? "Bronze", avatar.min_tier)) {
    return NextResponse.json({ error: "Avatar locked" }, { status: 403 });
  }

  await supabase.from("user_avatar").upsert({
    user_id: user.id,
    avatar_id,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
