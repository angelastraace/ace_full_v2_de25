import { supabase } from "@/lib/supabase";
import { ethers } from "ethers";
import { CONFIRM_RULES } from "./confirmRules";

const provider = new ethers.JsonRpcProvider(
  process.env.ETH_RPC_URL
);

export async function confirmOnchainSettlements() {
  const { data: jobs } = await supabase
    .from("onchain_settlement_queue")
    .select("*")
    .eq("status", "sent")
    .limit(CONFIRM_RULES.CHECK_BATCH_SIZE);

  if (!jobs || jobs.length === 0) return;

  const currentBlock = await provider.getBlockNumber();

  for (const job of jobs) {
    if (!job.tx_hash) continue;

    try {
      const receipt = await provider.getTransactionReceipt(
        job.tx_hash
      );

      if (!receipt) continue;

      // Failed tx
      if (receipt.status === 0) {
        await supabase
          .from("onchain_settlement_queue")
          .update({
            status: "failed",
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        continue;
      }

      const confirmations =
        currentBlock - receipt.blockNumber;

      if (confirmations >= CONFIRM_RULES.DEFAULT_CONFIRMATIONS) {
        // ✅ Mark settlement confirmed
        await supabase
          .from("onchain_settlement_queue")
          .update({
            status: "confirmed",
            confirmations,
            confirmed_at: new Date().toISOString(),
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        // ✅ If this was a reward, mark reward delivered
        if (job.kind === "reward" && job.source_id) {
          await supabase
            .from("season_rewards_ledger")
            .update({ delivered: true })
            .eq("id", job.source_id);
        }
      } else {
        await supabase
          .from("onchain_settlement_queue")
          .update({
            confirmations,
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      }
    } catch {
      await supabase
        .from("onchain_settlement_queue")
        .update({
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }
  }
}
