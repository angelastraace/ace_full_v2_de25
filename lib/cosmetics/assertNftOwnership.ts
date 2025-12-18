import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(
  process.env.ETH_RPC_URL
);

const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)"
];

export async function ownsNft(
  wallet: string,
  contract: string
) {
  const nft = new ethers.Contract(contract, ERC721_ABI, provider);
  const balance = await nft.balanceOf(wallet);
  return balance > 0n;
}
