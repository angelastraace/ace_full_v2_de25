/**
 * scripts/admin_fund_cli.js
 * CLI to trigger admin funding by calling your Next.js API route /api/admin_fund
 *
 * Usage:
 *   node scripts/admin_fund_cli.js 0xRecipientAddress 0.01
 */

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

async function main(toArg, amountArg) {
  const recipient = toArg || process.argv[2];
  const amountVal = amountArg || process.argv[3];

  if (!recipient || !amountVal) {
    console.error('Usage: node scripts/admin_fund_cli.js <recipient> <amount>');
    process.exit(1);
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Use global fetch if available, otherwise attempt to load node-fetch
  let fetchFn = globalThis.fetch;
  if (!fetchFn) {
    try {
      // node-fetch v3 exports fetch as default; require returns the module
      // Use dynamic require to avoid ESM interop problems in older node
      // eslint-disable-next-line import/no-extraneous-dependencies
      fetchFn = require('node-fetch');
      if (fetchFn && fetchFn.default) fetchFn = fetchFn.default;
    } catch (e) {
      console.error('fetch is not available; install node-fetch or use Node 18+');
      process.exit(1);
    }
  }

  const res = await fetchFn(`${base}/api/admin_fund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: recipient,
      amount: amountVal,
      admin: 'cli-admin',
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = raw; }
    console.error('API error:', res.status, (parsed && typeof parsed === 'object') ? JSON.stringify(parsed, null, 2) : parsed);
    process.exit(1);
  }

  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch (e) { data = raw; }
  console.log('Response:', data);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = main;
