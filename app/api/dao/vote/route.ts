// app/api/dao/vote/route.ts
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { proposalId, choice } = await req.json();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // simple tier-based weight
  const { data: state } = await supabase
    .from("player_state_cache")
    .select("tier")
    .eq("user_id", user.id)
    .single();

  const weightMap: any = { Bronze: 1, Silver: 2, Gold: 4, Diamond: 8, ACE: 16 };
  const weight = weightMap[state?.tier ?? "Bronze"];

  await supabase.from("dao_votes").upsert({
    proposal_id: proposalId,
    user_id: user.id,
    choice,
    weight,
  });

  return NextResponse.json({ success: true });
}
