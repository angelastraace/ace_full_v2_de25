// server_test_cjs.js (CommonJS)
// Run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/server_test_cjs.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

(async function run() {
  try {
    console.log('--- Server (service role) test START ---');

    // 1) Insert profile (use a deterministic test id)
    const profilePayload = { id: '00000000-0000-0000-0000-000000000abc', username: 'test-server', display_name: 'Server Test' };
    const { data: profileData, error: profileError } = await supabaseAdmin.from('profiles').insert([profilePayload]).select().limit(1).single();
    console.log('profiles.insert => data:', profileData, 'error:', profileError);

    // 2) Insert xp
    const xpPayload = { user_id: profilePayload.id, amount: 500 };
    const { data: xpData, error: xpError } = await supabaseAdmin.from('xp').insert([xpPayload]).select().limit(1).single();
    console.log('xp.insert => data:', xpData, 'error:', xpError);

    // 3) Upsert wallet
    const walletPayload = {
      id: '11111111-1111-1111-1111-111111111aaa',
      user_id: profilePayload.id,
      address: '0x000000000000000000000000000000000000dEaD',
      token: 'ETH',
      balance: 1.2345
    };
    const { data: walletData, error: walletError } = await supabaseAdmin.from('wallets').upsert(walletPayload, { onConflict: ['id'] }).select().limit(1).single();
    console.log('wallets.upsert => data:', walletData, 'error:', walletError);

    // 4) Read wallets for user
    const { data: walletsRead, error: walletsReadErr } = await supabaseAdmin.from('wallets').select('*').eq('user_id', profilePayload.id);
    console.log('wallets.select => data:', walletsRead, 'error:', walletsReadErr);

    console.log('--- Server test COMPLETE ---');
  } catch (err) {
    console.error('Server test crashed:', err);
  } finally {
    process.exit(0);
  }
})();
