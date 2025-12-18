import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Join rewards ledger with on-chain settlement queue
  const { data, error } = await supabase
    .from("season_rewards_ledger")
    .select(`
      id,
      season_id,
      reward_kind,
      reward_value,
      delivered,
      created_at,
      onchain_settlement_queue (
        status,
        tx_hash,
        confirmations
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    rewards: data ?? [],
  });
}
