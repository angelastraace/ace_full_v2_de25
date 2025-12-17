/**
 * scripts/removeLiquidity.js
 * Scaffold to remove liquidity using ethers v6 and env RPC selection
 */

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
const { JsonRpcProvider, Wallet } = require('ethers');

function getRpcUrl() {
  if (process.env.ETHEREUM_RPC_URL) return process.env.ETHEREUM_RPC_URL;
  if (process.env.TESTNET_RPC_URL) return process.env.TESTNET_RPC_URL;
  return 'http://localhost:8545';
}

async function main() {
  const RPC = getRpcUrl();
  const provider = new JsonRpcProvider(RPC);

  const ADMIN_PK = process.env.ADMIN_WALLET_PRIVATE_KEY;
  if (!ADMIN_PK) {
    console.error('ADMIN_WALLET_PRIVATE_KEY required');
    process.exit(1);
  }
  const wallet = new Wallet(ADMIN_PK, provider);

  console.log('Using RPC:', RPC);
  console.log('Admin wallet:', wallet.address);
  console.log('This is a scaffold - implement remove liquidity logic here.');
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}

module.exports = main;
