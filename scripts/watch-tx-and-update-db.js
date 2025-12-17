/**
 * scripts/watch-tx-and-update-db.js
 *
 * Usage:
 *   SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." ETHEREUM_RPC_URL="..." node scripts/watch-tx-and-update-db.js <txHash> <confirmations (default 3)>
 *
 * What it does:
 *  - Polls the chain for the tx receipt until it has `confirmations` confirmations or is failed.
 *  - Updates the `transactions` table row with status = 'confirmed'|'failed', block_number, confirmations, receipt (meta).
 *
 * Notes:
 *  - Requires SUPABASE_SERVICE_ROLE_KEY (server-only) and ETHEREUM_RPC_URL
 *  - Uses simple exponential backoff polling
 */

const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');

if (process.argv.length < 3) {
  console.error('Usage: node scripts/watch-tx-and-update-db.js <txHash> [confirmations]');
  process.exit(1);
}

require('dotenv').config();

const TX_HASH = process.argv[2];
const REQUIRED_CONFIRMATIONS = Number(process.argv[3] || 3);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ETHEREUM_RPC_URL) {
  console.error('Missing required env vars. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ETHEREUM_RPC_URL.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function updateTransactionStatus(txHash, payload) {
  try {
    // Find transaction row by meta->txHash or tx_hash stored in meta or tx_hash column
    // We will try to update rows with meta->>'txHash' = txHash OR meta->'txHash' equals OR transactions.tx_hash = txHash
    const updates = {
      status: payload.status,
      meta: payload.meta || {},
      block_number: payload.blockNumber ?? null,
      confirmations: payload.confirmations ?? null,
      updated_at: new Date().toISOString()
    };

    // try matching by tx_hash column first
    let { data, error } = await supabaseAdmin
      .from('transactions')
      .update(updates)
      .eq('tx_hash', txHash);

    if (error) {
      console.warn('update by tx_hash error (will try meta match):', error.message || error);
    } else if (data && data.length > 0) {
      return data;
    }

    // fallback: match by meta->txHash
    ({ data, error } = await supabaseAdmin
      .from('transactions')
      .update(updates)
      .filter("meta->>txHash", "eq", txHash));

    if (error) {
      console.error('Failed to update transactions row:', error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('updateTransactionStatus error', e);
    return null;
  }
}

async function watchTx(txHash, confirmations = 3) {
  console.log(`Watching tx ${txHash} for ${confirmations} confirmations...`);
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      const currentBlock = await provider.getBlockNumber();

      if (!receipt) {
        console.log(`[${attempt}] tx not yet mined — retrying in ${Math.min(5000 * attempt, 30000)}ms`);
        await sleep(Math.min(5000 * attempt, 30000));
        continue;
      }

      const confirmationsSoFar = receipt.blockNumber ? (currentBlock - receipt.blockNumber + 1) : 0;
      const isSuccess = receipt.status === 1;

      console.log(`Tx mined in block ${receipt.blockNumber}. confirmations: ${confirmationsSoFar}. status: ${isSuccess ? 'success' : 'failed'}`);

      // Update DB with current receipt status
      await updateTransactionStatus(txHash, {
        status: confirmationsSoFar >= confirmations ? (isSuccess ? 'confirmed' : 'failed') : 'pending',
        meta: { receipt: receipt },
        blockNumber: receipt.blockNumber,
        confirmations: confirmationsSoFar
      });

      if (confirmationsSoFar >= confirmations) {
        console.log(`Tx ${txHash} reached ${confirmationsSoFar} confirmations — final status: ${isSuccess ? 'confirmed' : 'failed'}`);
        return { receipt, confirmations: confirmationsSoFar, success: isSuccess };
      } else {
        // wait and poll again
        await sleep(10000); // 10s between confirmations checks
      }
    } catch (err) {
      console.error('watchTx error', err);
      await sleep(5000);
    }
  }
}

// run
(async () => {
  try {
    const res = await watchTx(TX_HASH, REQUIRED_CONFIRMATIONS);
    console.log('watch result', res);
    process.exit(0);
  } catch (e) {
    console.error('fatal', e);
    process.exit(2);
  }
})();
