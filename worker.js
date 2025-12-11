// worker.js (Node)
import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// On new tx to watch:
async function recordTx(txHash) {
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  await supabase.from('onchain_transactions').insert({
    tx_hash: tx.hash,
    from_address: tx.from,
    to_address: tx.to,
    raw: tx,
    confirmed: !!receipt,
    block_number: receipt?.blockNumber ?? null
  });
}

// Periodically reconcile pending txs:
setInterval(async () => {
  const { data } = await supabase
    .from('onchain_transactions')
    .select('*')
    .eq('confirmed', false)
    .limit(100);

  for (const t of data) {
    const receipt = await provider.getTransactionReceipt(t.tx_hash);
    if (receipt && receipt.confirmations > 0) {
      await supabase.from('onchain_transactions').update({
        confirmed: true,
        block_number: receipt.blockNumber
      }).eq('tx_hash', t.tx_hash);
      // apply business logic: credit wallets, mark funding_request succeeded, etc.
    }
  }
}, 30_000);
