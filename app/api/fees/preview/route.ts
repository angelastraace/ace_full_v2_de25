import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateFee } from "@/lib/fees/calculateFee";
import { BASE_FEES } from "@/lib/fees/feeRules";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type");
  const amountParam = searchParams.get("amount");

  if (!type || !amountParam) {
    return NextResponse.json(
      { error: "Missing type or amount" },
      { status: 400 }
    );
  }

  const amount = Number(amountParam);

  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Invalid amount" },
      { status: 400 }
    );
  }

  // ⚠️ Using mock or real Supabase depending on env
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: state } = await supabase
    .from("player_state_cache")
    .select("tier, trust_score")
    .eq("user_id", user.id)
    .single();

  if (!state) {
    return NextResponse.json(
      { error: "Player state not found" },
      { status: 404 }
    );
  }

  const { fee, rate } = calculateFee({
    amount,
    type: type as keyof typeof BASE_FEES,
    tier: state.tier,
    trustScore: state.trust_score,
  });

  return NextResponse.json({
    tier: state.tier,
    base_fee: BASE_FEES[type as keyof typeof BASE_FEES],
    final_rate: rate,
    fee,
    amount,
    net: amount - fee,
  });
}
