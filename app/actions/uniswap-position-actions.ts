"use server"

import { ethers } from "ethers"
import { supabase } from "@/lib/supabaseClient"

// Uniswap V3 NonfungiblePositionManager address
const POSITION_MANAGER_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"

// NonfungiblePositionManager ABI (simplified for our needs)
const POSITION_MANAGER_ABI = [
  "function positions(uint256) external view returns (uint96,address,address,address,uint24,int24,int24,uint128,uint256,uint256,uint128,uint128)",
  "function decreaseLiquidity((uint256,uint128,uint256,uint256,uint256)) external returns (uint256,uint256)",
  "function collect((uint256,address,uint128,uint128)) external returns (uint256,uint256)",
]

// ERC20 ABI for token operations
const ERC20_ABI = ["function symbol() view returns (string)", "function decimals() view returns (uint8)"]

/**
 * Gets the formatted private key with 0x prefix
 * @returns The formatted private key or throws an error if not configured
 */
function getFormattedPrivateKey(): string {
  const privateKey = process.env.PRIVATE_KEY

  if (!privateKey) {
    throw new Error("Private key not configured in environment variables")
  }

  // Ensure the private key has the 0x prefix
  return privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
}

/**
 * Get information about a Uniswap V3 position
 */
export async function getPositionInfo(tokenId: string) {
  console.log(`Fetching position info for token ID: ${tokenId}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Create position manager contract instance
    const positionManager = new ethers.Contract(POSITION_MANAGER_ADDRESS, POSITION_MANAGER_ABI, provider)

    // Get position information
    const positionData = await positionManager.positions(tokenId)
    console.log("Raw position data:", positionData)

    // Extract position data
    // The positions function returns a tuple with the following elements:
    // [nonce, operator, token0, token1, fee, tickLower, tickUpper, liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128, tokensOwed0, tokensOwed1]
    const [
      nonce,
      operator,
      token0,
      token1,
      fee,
      tickLower,
      tickUpper,
      liquidity,
      feeGrowthInside0LastX128,
      feeGrowthInside1LastX128,
      tokensOwed0,
      tokensOwed1,
    ] = positionData

    // Get token symbols
    const token0Contract = new ethers.Contract(token0, ERC20_ABI, provider)
    const token1Contract = new ethers.Contract(token1, ERC20_ABI, provider)

    const [token0Symbol, token1Symbol, token0Decimals, token1Decimals] = await Promise.all([
      token0Contract.symbol().catch(() => "Unknown"),
      token1Contract.symbol().catch(() => "Unknown"),
      token0Contract.decimals().catch(() => 18),
      token1Contract.decimals().catch(() => 18),
    ])

    // Format tokens owed
    const formattedTokensOwed0 = ethers.formatUnits(tokensOwed0, token0Decimals)
    const formattedTokensOwed1 = ethers.formatUnits(tokensOwed1, token1Decimals)

    // Create formatted position object
    const position = {
      tokenId,
      nonce: nonce.toString(),
      operator,
      token0,
      token1,
      token0Symbol,
      token1Symbol,
      token0Decimals,
      token1Decimals,
      fee: fee.toString(),
      tickLower: tickLower.toString(),
      tickUpper: tickUpper.toString(),
      liquidity: liquidity.toString(),
      tokensOwed0: formattedTokensOwed0,
      tokensOwed1: formattedTokensOwed1,
    }

    console.log("Formatted position:", position)

    return {
      success: true,
      position,
    }
  } catch (error: any) {
    console.error("Error fetching position info:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Decrease liquidity in a Uniswap V3 position
 */
export async function decreaseUniswapLiquidity({
  tokenId,
  liquidity,
  amount0Min = "0",
  amount1Min = "0",
}: {
  tokenId: string
  liquidity: string
  amount0Min?: string
  amount1Min?: string
}) {
  console.log(`Decreasing liquidity for token ID: ${tokenId}, liquidity: ${liquidity}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    // Get private key securely on the server
    const privateKey = getFormattedPrivateKey()

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(privateKey, provider)
    console.log(`Using wallet address: ${signer.address} for decreasing liquidity`)

    // Create position manager contract instance
    const positionManager = new ethers.Contract(POSITION_MANAGER_ADDRESS, POSITION_MANAGER_ABI, signer)

    // Set deadline to 10 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10

    // Prepare parameters for decreaseLiquidity as an array
    const params = [tokenId, liquidity, amount0Min, amount1Min, deadline]

    console.log("Decrease liquidity params:", {
      tokenId,
      liquidity,
      amount0Min,
      amount1Min,
      deadline,
    })

    // Call decreaseLiquidity
    const tx = await positionManager.decreaseLiquidity(params, {
      gasLimit: 500000, // Add gas limit to prevent unexpected failures
    })

    console.log(`Decrease liquidity transaction sent: ${tx.hash}`)

    // Wait for transaction to be mined
    const receipt = await tx.wait()
    console.log(`Decrease liquidity confirmed in block ${receipt?.blockNumber}`)

    // Log to Supabase
    try {
      await supabase.from("liquidity_logs").insert([
        {
          type: "uniswap_decrease_liquidity",
          token_id: tokenId,
          liquidity: liquidity,
          tx_hash: tx.hash,
        },
      ])
      console.log("Decrease liquidity logged to Supabase")
    } catch (supabaseError) {
      console.warn("Failed to log to Supabase:", supabaseError)
      // Continue execution even if logging fails
    }

    return {
      success: true,
      txHash: tx.hash,
      explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
    }
  } catch (error: any) {
    console.error("Error decreasing liquidity:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Collect tokens from a Uniswap V3 position
 */
export async function collectUniswapTokens({
  tokenId,
  recipient,
  amount0Max = "340282366920938463463374607431768211455", // MaxUint128 as string
  amount1Max = "340282366920938463463374607431768211455", // MaxUint128 as string
}: {
  tokenId: string
  recipient: string
  amount0Max?: string
  amount1Max?: string
}) {
  console.log(`Collecting tokens for token ID: ${tokenId}, recipient: ${recipient}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    // Get private key securely on the server
    const privateKey = getFormattedPrivateKey()

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(privateKey, provider)
    console.log(`Using wallet address: ${signer.address} for collecting tokens`)

    // Create position manager contract instance
    const positionManager = new ethers.Contract(POSITION_MANAGER_ADDRESS, POSITION_MANAGER_ABI, signer)

    // Prepare parameters for collect as an array
    const params = [tokenId, recipient, amount0Max, amount1Max]

    console.log("Collect tokens params:", {
      tokenId,
      recipient,
      amount0Max,
      amount1Max,
    })

    // Call collect
    const tx = await positionManager.collect(params, {
      gasLimit: 500000, // Add gas limit to prevent unexpected failures
    })

    console.log(`Collect tokens transaction sent: ${tx.hash}`)

    // Wait for transaction to be mined
    const receipt = await tx.wait()
    console.log(`Collect tokens confirmed in block ${receipt?.blockNumber}`)

    // Log to Supabase
    try {
      await supabase.from("liquidity_logs").insert([
        {
          type: "uniswap_collect_tokens",
          token_id: tokenId,
          recipient: recipient,
          tx_hash: tx.hash,
        },
      ])
      console.log("Collect tokens logged to Supabase")
    } catch (supabaseError) {
      console.warn("Failed to log to Supabase:", supabaseError)
      // Continue execution even if logging fails
    }

    return {
      success: true,
      txHash: tx.hash,
      explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
    }
  } catch (error: any) {
    console.error("Error collecting tokens:", error)
    return { success: false, error: error.message }
  }
}