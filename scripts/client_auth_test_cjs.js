// scripts/server_test_cjs_fixed.js (robust, CommonJS)
// Run:
// SUPABASE_URL="https://<project>.supabase.co" SUPABASE_SERVICE_ROLE_KEY="<service_role_key>" node scripts/server_test_cjs_fixed.js

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

// Ensure fetch is available (Node may not have global fetch in some envs)
let nodeFetch;
try {
  nodeFetch = require('node-fetch');
  if (nodeFetch && !globalThis.fetch) globalThis.fetch = nodeFetch;
} catch (e) {
  // node-fetch not installed; if Node has fetch, that's fine, otherwise REST fallback will fail
  if (!globalThis.fetch) {
    console.warn('node-fetch not installed and global fetch missing — REST fallback may fail.');
  }
}

async function findUserByEmail(email) {
  // 1) Try SDK admin.listUsers if available
  try {
    if (supabaseAdmin && supabaseAdmin.auth && supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.listUsers === 'function') {
      console.log('Trying supabaseAdmin.auth.admin.listUsers()...');
      const res = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
      // SDK may return { data: { users: [...] } } or { data: [...] } depending on version
      if (res && res.data) {
        const possibleUsers = Array.isArray(res.data) ? res.data : (res.data.users || res.data);
        if (Array.isArray(possibleUsers)) {
          const found = possibleUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
          if (found) return found;
        } else {
          console.warn('listUsers returned data in unexpected shape:', Object.keys(res.data));
        }
      } else {
        console.warn('listUsers returned no data:', res);
      }
    } else {
      console.warn('supabaseAdmin.auth.admin.listUsers not available in this SDK build.');
    }
  } catch (e) {
    console.warn('listUsers attempt failed:', e?.message ?? e);
  }

  // 2) REST fallback: /auth/v1/admin/users
  try {
    if (!globalThis.fetch) throw new Error('global fetch not available');
    console.log('Falling back to REST: GET /auth/v1/admin/users');
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users`;
    const r = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apiKey: SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      }
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '<no body>');
      throw new Error(`admin/users fetch failed: ${r.status} ${r.statusText} ${text}`);
    }
    const users = await r.json();
    if (Array.isArray(users)) {
      const found = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (found) return found;
    } else {
      console.warn('admin/users returned non-array response (unexpected):', typeof users);
    }
  } catch (e) {
    console.warn('REST admin users lookup failed:', e?.message ?? e);
  }

  return null;
}

(async function run() {
  try {
    console.log('--- Server (service role) test (robust) START ---');

    const testEmail = 'server_test+ace@example.com';
    const testPassword = `Pwd${Date.now()}!`;

    // 1) Try create user
    let userId = null;
    try {
      console.log('Attempting createUser via supabaseAdmin.auth.admin.createUser...');
      const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        email_confirm: true,
        password: testPassword
      });
      if (createErr) {
        console.warn('createUser returned error (likely exists):', createErr.message || createErr);
      } else if (createData && (createData.user || createData?.id)) {
        // different SDK versions may return user under createData.user or createData
        userId = (createData.user && createData.user.id) || createData.id || null;
        console.log('Created user id:', userId);
      } else {
        console.warn('createUser returned an unexpected shape:', createData);
      }
    } catch (e) {
      console.warn('createUser threw error (continuing to lookup):', e?.message ?? e);
    }

    // 2) If not created, find user by email
    if (!userId) {
      const found = await findUserByEmail(testEmail);
      if (found) {
        userId = found.id || (found.user && found.user.id);
        console.log('Found existing user id via admin lookup:', userId);
      } else {
        console.error('Failed to create or find auth user. Aborting test. Please ensure service role key is correct and has admin rights.');
        process.exit(1);
      }
    }

    // 3) Upsert profile (handle legacy wallet_address nullable)
    const profilePayload = { id: userId, username: 'test-server', display_name: 'Server Test' };

    // detect if wallet_address column exists & NOT NULL
    try {
      const { data: cols, error: colsErr } = await supabaseAdmin
        .from('information_schema.columns')
        .select('is_nullable,column_name')
        .eq('table_name', 'profiles')
        .eq('column_name', 'wallet_address')
        .limit(1)
        .single();
      if (!colsErr && cols && cols.is_nullable === 'NO') {
        profilePayload.wallet_address = '';
      }
    } catch (e) {
      // ignore
    }

    console.log('Upserting profile for user id:', userId);
    const { data: profileData, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: ['id'] })
      .select()
      .limit(1)
      .single();

    if (profileErr) {
      console.error('profiles upsert error:', profileErr);
    } else {
      console.log('profiles upsert success:', profileData);
    }

    // 4) Insert xp row if xp table exists
    try {
      const { data: xpData, error: xpErr } = await supabaseAdmin
        .from('xp')
        .insert([{ user_id: userId, amount: 500 }])
        .select()
        .limit(1)
        .single();
      if (xpErr) console.warn('xp.insert error (table might be missing):', xpErr);
      else console.log('xp.insert success:', xpData);
    } catch (e) {
      console.warn('xp insert error:', e?.message ?? e);
    }

    // 5) Upsert wallet (assumes FK now points to profiles)
    const walletPayload = {
      id: '11111111-1111-1111-1111-111111111aaa',
      user_id: userId,
      address: '0x000000000000000000000000000000000000dEaD',
      token: 'ETH',
      balance: 1.23
    };

    const { data: walletData, error: walletErr } = await supabaseAdmin
      .from('wallets')
      .upsert(walletPayload, { onConflict: ['id'] })
      .select()
      .limit(1)
      .single();

    if (walletErr) {
      console.error('wallets.upsert error:', walletErr);
    } else {
      console.log('wallets.upsert success:', walletData);
    }

    // 6) Read wallets for user
    const { data: walletsRead, error: walletsReadErr } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId);

    console.log('wallets.select => data:', walletsRead, 'error:', walletsReadErr);

    console.log('--- Server test COMPLETE ---');
  } catch (err) {
    console.error('Server test crashed:', err);
  } finally {
    process.exit(0);
  }
})();
