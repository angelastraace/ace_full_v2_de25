import { supabase } from "@/lib/supabase";
import { sendOnchain } from "./sendOnchain";
import { assertNotPaused } from "@/lib/system/assertNotPaused";

// before processing batch
await assertNotPaused("settlement");

export async function processSettlementBatch(limit = 25) {
  const { data: jobs } = await supabase
    .from("onchain_settlement_queue")
    .select("*")
    .eq("status", "queued")
    .limit(limit);

  for (const job of jobs ?? []) {
    try {
      const txHash = await sendOnchain(job);

      await supabase
        .from("onchain_settlement_queue")
        .update({
          status: "sent",
          tx_hash: txHash,
        })
        .eq("id", job.id);
    } catch (err: any) {
      await supabase
        .from("onchain_settlement_queue")
        .update({
          status: "failed",
        })
        .eq("id", job.id);
    }
  }
}
