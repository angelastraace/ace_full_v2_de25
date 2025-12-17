// client_test_cjs.js (CommonJS - anon client test)
// Run: SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/client_test_cjs.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing env: SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabaseClient = createClient(SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

(async function run() {
  try {
    console.log('--- Client (anon) test START ---');

    // 1) Read quests (public)
    const { data: quests, error: questsErr } = await supabaseClient.from('quests').select('*');
    console.log('quests.select => data length:', Array.isArray(quests) ? quests.length : quests, 'error:', questsErr);

    // 2) Attempt to read server-created profile (should be blocked unless auth.uid matches)
    const { data: profileRead, error: profileReadErr } = await supabaseClient.from('profiles').select('*').eq('id', '00000000-0000-0000-0000-000000000abc');
    console.log('profiles.select (other user) => data:', profileRead, 'error:', profileReadErr);

    // 3) Attempt to insert xp (should be blocked)
    const { data: xpInsert, error: xpInsertErr } = await supabaseClient.from('xp').insert([{ user_id: '00000000-0000-0000-0000-000000000abc', amount: 999 }]);
    console.log('xp.insert => data:', xpInsert, 'error:', xpInsertErr);

    // 4) Attempt to update wallet (should be blocked)
    const { data: walletUpd, error: walletUpdErr } = await supabaseClient.from('wallets').update({ balance: 9999 }).eq('id', '11111111-1111-1111-1111-111111111aaa');
    console.log('wallets.update => data:', walletUpd, 'error:', walletUpdErr);

    console.log('--- Client test COMPLETE ---');
  } catch (err) {
    console.error('Client test crashed:', err);
  } finally {
    process.exit(0);
  }
})();
