await assertNotPaused("rewards");
for (const reward of rewards) {
  // 1️⃣ Insert reward ledger (idempotency already checked earlier)
  const { data: rewardRow, error: rewardError } = await supabase
    .from("season_rewards_ledger")
    .insert({
      season_id: seasonId,
      user_id: p.user_id,
      reward_kind: reward.kind,
      reward_value: String(reward.value),
    })
    .select("id")
    .single();

  if (rewardError || !rewardRow) {
    throw new Error("Failed to insert season reward ledger");
  }

  const rewardLedgerId = rewardRow.id;

  // 2️⃣ Enqueue on-chain settlement (token rewards only)
  if (reward.kind === "token") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("user_id", p.user_id)
      .single();

    const userWallet = profile?.wallet_address;

    if (!userWallet) continue;

    await supabase.from("onchain_settlement_queue").insert({
      kind: "reward",
      source_id: rewardLedgerId,
      user_id: p.user_id,
      asset: "ACE",
      amount: Number(reward.value),
      destination: "user",
      wallet_address: userWallet,
      status: "queued",
    });
  }
}
