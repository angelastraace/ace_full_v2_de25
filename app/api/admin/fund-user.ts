// pages/api/admin/fund-user.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import ERC20_ABI from '../../lib/abis/ERC20.json'; // minimal ABI: transfer

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const adminWallet = new ethers.Wallet(process.env.ADMIN_WALLET_PRIVATE_KEY!, provider);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // authentication: verify admin
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const { targetUserId, tokenAddress, amount, poolId } = req.body;
  if (!targetUserId || !tokenAddress || !amount) return res.status(400).json({ error: 'missing fields' });

  // create funding request row
  const { data: fr, error: frErr } = await supabase
    .from('onchain_funding_requests')
    .insert({
      requestor_id: null, target_user_id: targetUserId, pool_id: poolId,
      token: tokenAddress, amount, status: 'processing'
    })
    .select()
    .single();

  try {
    // send token from admin wallet to user's wallet
    const { data: userRow } = await supabase.from('users').select('wallet_address').eq('id', targetUserId).single();
    if (!userRow) throw new Error('user not found');

    const token = new ethers.Contract(tokenAddress, ERC20_ABI, adminWallet);
    // amount in token decimals; in production compute BigNumber with decimals
    const decimals = await token.decimals();
    const value = ethers.utils.parseUnits(String(amount), decimals);

    const tx = await token.transfer(userRow.wallet_address, value);
    await supabase.from('onchain_transactions').insert({
      tx_hash: tx.hash,
      from_address: adminWallet.address,
      to_address: userRow.wallet_address,
      token: tokenAddress,
      amount,
      chain: process.env.CHAIN_ID
    });
    // update funding request with tx_hash
    await supabase.from('onchain_funding_requests').update({
      tx_hash: tx.hash, status: 'pending', updated_at: new Date().toISOString()
    }).eq('id', fr.id);

    // return tx hash immediately; worker will confirm & credit wallet
    res.json({ txHash: tx.hash });
  } catch (err: any) {
    await supabase.from('onchain_funding_requests').update({
      status: 'failed', error: String(err.message)
    }).eq('id', fr.id);
    res.status(500).json({ error: err.message });
  }
}
