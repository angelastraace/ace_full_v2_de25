// scripts/addEthUsdcLiquidity.js
// Requires: node 18+, ethers v6 installed
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
const { JsonRpcProvider, Wallet, Contract, parseEther, parseUnits, formatEther } = require('ethers');

const UNISWAP_V2_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // UniswapV2 Router02 (mainnet)
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC mainnet
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
const ROUTER_ABI = [
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)"
];

function getRpcUrl() {
  if (process.env.ETHEREUM_RPC_URL) return process.env.ETHEREUM_RPC_URL;
  return 'http://localhost:8545';
}

async function main() {
  const provider = new JsonRpcProvider(getRpcUrl());

  const ADMIN_PK = process.env.ADMIN_WALLET_PRIVATE_KEY;
  if (!ADMIN_PK) {
    console.error('ADMIN_WALLET_PRIVATE_KEY required in env.');
    process.exit(1);
  }
  const wallet = new Wallet(ADMIN_PK, provider);
  console.log('Admin ETH address:', wallet.address);

  // parse amounts
  const usdcDecimalAmount = process.env.USDC_AMOUNT ?? '100';
  const ethDecimalAmount = process.env.ETH_AMOUNT ?? '0.05';
  const slippageBP = parseInt(process.env.SLIPPAGE_BP ?? '200', 10); // basis points

  // contracts
  const token = new Contract(USDC_ADDRESS, ERC20_ABI, wallet);
  const router = new Contract(UNISWAP_V2_ROUTER, ROUTER_ABI, wallet);

  // read balances
  const ethBalance = await provider.getBalance(wallet.address);
  const usdcDecimals = await (async () => {
    try { return await token.decimals(); } catch { return 6; }
  })();
  const usdcBalance = await token.balanceOf(wallet.address);

  console.log('Admin ETH balance:', formatEther(ethBalance));
  console.log(`Admin USDC balance: ${Number(usdcBalance) / (10 ** usdcDecimals)} (decimals: ${usdcDecimals})`);

  // compute required amounts (in units)
  const desiredEth = parseEther(ethDecimalAmount); // BigInt
  const desiredUsdc = parseUnits(usdcDecimalAmount, usdcDecimals);

  if (ethBalance < desiredEth) {
    console.error('Insufficient ETH for desired ETH_AMOUNT. Fund wallet first.');
    process.exit(1);
  }
  if (usdcBalance < desiredUsdc) {
    console.error('Insufficient USDC for desired USDC_AMOUNT. Fund wallet first.');
    process.exit(1);
  }

  // approval step: check allowance and approve router if needed
  const allowance = await token.allowance(wallet.address, UNISWAP_V2_ROUTER);
  if (allowance < desiredUsdc) {
    console.log('Approving USDC to router...');
    const approveTx = await token.approve(UNISWAP_V2_ROUTER, desiredUsdc);
    console.log('approve tx hash:', approveTx.hash);
    await approveTx.wait();
    console.log('Approval confirmed.');
  } else {
    console.log('Sufficient allowance exists, skipping approve.');
  }

  // Minimums with slippage tolerance
  // amountMin = desired * (1 - slippage)
  const amountTokenMin = BigInt(desiredUsdc) * BigInt(10000 - slippageBP) / BigInt(10000);
  const amountETHMin = BigInt(desiredEth) * BigInt(10000 - slippageBP) / BigInt(10000);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 min
  console.log('Calling addLiquidityETH with:');
  console.log(' desiredUSDC:', usdcDecimalAmount, 'desiredETH:', ethDecimalAmount);
  console.log(' amountTokenMin:', amountTokenMin.toString(), 'amountETHMin:', amountETHMin.toString());

  const tx = await router.addLiquidityETH(
    USDC_ADDRESS,
    desiredUsdc,
    amountTokenMin,
    amountETHMin,
    wallet.address,
    deadline,
    { value: desiredEth, gasLimit: 1_500_000 } // gasLimit large for safety; provider will estimate but we set a cap
  );
  console.log('addLiquidity tx hash:', tx.hash);
  const receipt = await tx.wait();
  console.log('addLiquidity confirmed in block', receipt.blockNumber);
  console.log('tx receipt', receipt.transactionHash);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
}

module.exports = main;
