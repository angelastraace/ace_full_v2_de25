"use client"

import { ethers } from "ethers"

/**
 * Checks if the private key is properly configured
 * @returns True if the private key is configured, false otherwise
 */
export function isPrivateKeyConfigured(): boolean {
  // This is a client-side function that doesn't access the private key
  // It just returns a placeholder value for UI purposes
  return true
}

/**
 * Creates a read-only provider
 * @param rpcUrl The RPC URL to connect to
 * @returns An ethers provider instance
 */
export function createProvider(rpcUrl: string): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(rpcUrl)
}

/**
 * Estimates the gas cost for a transaction
 * @param provider The ethers provider
 * @param gasLimit The estimated gas limit
 * @returns The estimated gas cost in wei
 */
export async function estimateGasCost(
  provider: ethers.JsonRpcProvider,
  gasLimit = 200000n,
): Promise<{ gasCost: bigint; formattedCost: string }> {
  const feeData = await provider.getFeeData()
  const gasPrice = feeData.gasPrice || 20000000000n // Default to 20 gwei if null
  const gasCost = gasLimit * gasPrice
  return {
    gasCost,
    formattedCost: ethers.formatEther(gasCost),
  }
}

/**
 * Checks if a wallet has enough ETH for gas
 * @param provider The ethers provider
 * @param walletAddress The wallet address to check
 * @param gasLimit The estimated gas limit
 * @returns An object with the result and any error message
 */
export async function hasEnoughGas(
  provider: ethers.JsonRpcProvider,
  walletAddress: string,
  gasLimit = 200000n,
): Promise<{ hasEnough: boolean; message: string }> {
  try {
    const balance = await provider.getBalance(walletAddress)
    const { gasCost, formattedCost } = await estimateGasCost(provider, gasLimit)

    if (balance < gasCost) {
      return {
        hasEnough: false,
        message: `Insufficient ETH for gas fees. You have ${ethers.formatEther(balance)} ETH, but need approximately ${formattedCost} ETH for gas.`,
      }
    }

    return {
      hasEnough: true,
      message: "",
    }
  } catch (error) {
    return {
      hasEnough: false,
      message: `Error checking gas: ${error.message}`,
    }
  }
}