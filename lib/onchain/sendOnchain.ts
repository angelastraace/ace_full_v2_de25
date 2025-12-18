import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(
  process.env.ETH_RPC_URL
);

const wallet = new ethers.Wallet(
  process.env.SETTLEMENT_PRIVATE_KEY!,
  provider
);

export async function sendOnchain(job: any) {
  if (job.asset === "ETH") {
    const tx = await wallet.sendTransaction({
      to: resolveDestination(job),
      value: ethers.parseEther(job.amount.toString()),
    });
    await tx.wait();
    return tx.hash;
  }

  // ERC20 / NFT hooks here
  throw new Error("Asset not supported yet");
}

function resolveDestination(job: any) {
  if (job.destination === "treasury") return process.env.TREASURY_WALLET!;
  if (job.destination === "dao") return process.env.DAO_WALLET!;
  if (job.destination === "burn") return process.env.BURN_WALLET!;
  if (job.destination === "user") return job.wallet_address;
  throw new Error("Unknown destination");
}
