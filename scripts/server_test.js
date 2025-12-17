// server_test.js
// Run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node server_test.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function run() {
  try {
    console.log('--- Server (service role) test: create profile, add xp, update wallet ---');

    // 1) Create a fake user id (normally you'd use auth.users.id)
    const { data: userRow } = await supabaseAdmin
      .from('profiles')
      .insert([{ id: '00000000-0000-0000-0000-000000000abc', username: 'test-server', display_name: 'Server Test' }])
      .select()
      .single();

    console.log('Inserted profile (service_role):', userRow?.id);

    // 2) Insert xp row server-side
    const { data: xpRow } = await supabaseAdmin
      .from('xp')
      .insert([{ user_id: '00000000-0000-0000-0000-000000000abc', amount: 500 }])
      .select()
      .single();

    console.log('Inserted XP (service_role):', xpRow);

    // 3) Upsert a wallet (balance update) server-side
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .upsert(
        {
          id: '11111111-1111-1111-1111-111111111aaa',
          user_id: '00000000-0000-0000-0000-000000000abc',
          address: '0x000000000000000000000000000000000000dEaD',
          token: 'ETH',
          balance: 1.2345
        },
        { onConflict: ['id'] }
      )
      .select()
      .single();

    console.log('Upserted wallet (service_role):', wallet);

    // 4) Show we can read protected rows server-side
    const { data: wallets } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', '00000000-0000-0000-0000-000000000abc');

    console.log('Server can read wallets for user:', wallets);

    console.log('--- Server test complete ---');
  } catch (err) {
    console.error('Server test error', err);
  } finally {
    process.exit(0);
  }
}

run();
