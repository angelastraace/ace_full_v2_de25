import { supabase } from "@/lib/supabase";

export async function applyReward(
  userId: string,
  reward: { kind: string; value: any }
) {
  switch (reward.kind) {
    case "xp_boost":
      await supabase
        .from("player_state_cache")
        .update({
          flags: supabase.rpc("array_append", {
            arr: "flags",
            val: `xp_boost_${reward.value}`,
          }),
        })
        .eq("user_id", userId);
      break;

    case "token":
      // credit internal balance or enqueue on-chain transfer
      break;

    case "fee_rebate":
      // increment rebate balance
      break;

    case "nft":
      // enqueue mint job
      break;
  }
}
