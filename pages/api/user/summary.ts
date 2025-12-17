// pages/api/user/summary.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: 'wallet required' });

  // find user
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .ilike('wallet_address', wallet as string)
    .limit(1);

  const user = users?.[0] ?? null;

  // get wallets
  const { data: wallets } = await supabase
    .from('wallets')
    .select('token,balance')
    .eq('user_id', user?.id ?? '');

  res.json({
    user,
    wallets: wallets ?? []
  });
}
