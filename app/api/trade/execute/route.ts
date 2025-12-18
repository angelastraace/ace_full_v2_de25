import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateFee } from "@/lib/fees/calculateFee";
import { routeFee } from "@/lib/fees/routeFee";
import { assertNotPaused } from "@/lib/system/assertNotPaused";

// at top of POST()
await assertNotPaused("trade");

export async function POST(req: Request) {
  try {
    // 1️⃣ Parse input
    const body = await req.json();
    const amount = Number(body.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // 2️⃣ Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 3️⃣ Fetch player tier + trust score
    const { data: state, error: stateError } = await supabase
      .from("player_state_cache")
      .select("tier, trust_score")
      .eq("user_id", user.id)
      .single();

    if (stateError || !state) {
      return NextResponse.json(
        { error: "Player state not found" },
        { status: 404 }
      );
    }

    // 4️⃣ Calculate fee (tier + trust aware)
    const { fee, rate } = calculateFee({
      amount,
      type: "trade",
      tier: state.tier,
      trustScore: state.trust_score,
    });

    const netAmount = Number((amount - fee).toFixed(8));

    if (netAmount <= 0) {
      return NextResponse.json(
        { error: "Net amount too small after fees" },
        { status: 400 }
      );
    }

    // 5️⃣ Route fee (treasury / dao / burn)
    const { destination, routedAmount } = routeFee(
      "trade",
      fee
    );

    // 6️⃣ Insert fee ledger row (RETURN ID)
    const { data: feeRow, error: feeError } = await supabase
      .from("fee_ledger")
      .insert({
        user_id: user.id,
        fee_type: "trade",
        amount: routedAmount,
        destination,
      })
      .select("id")
      .single();

    if (feeError || !feeRow) {
      throw new Error("Failed to insert fee ledger entry");
    }

    // 7️⃣ Enqueue on-chain settlement (NO TX HERE)
    await supabase.from("onchain_settlement_queue").insert({
      kind: "fee",
      source_id: feeRow.id,
      user_id: user.id,
      asset: "USDC",            // change if needed
      amount: routedAmount,
      destination,              // treasury | dao | burn
      status: "queued",
    });

    // 8️⃣ Execute trade logic (placeholder)
    // ⚠️ Replace this with your real matching / swap logic
    // executeTrade(user.id, netAmount)

    // 9️⃣ Respond
    return NextResponse.json({
      success: true,
      trade: {
        gross_amount: amount,
        fee,
        fee_rate: rate,
        net_amount: netAmount,
        fee_destination: destination,
      },
    });
  } catch (err: any) {
    console.error("Trade execution error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
