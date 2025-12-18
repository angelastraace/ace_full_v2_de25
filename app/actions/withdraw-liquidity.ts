"use server"

import { ethers } from "ethers"
import { supabase } from "@/app/lib/supabaseClient"

// Uniswap V3 NonfungiblePositionManager address
const NONFUNGIBLE_POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"

// ABI for position manager
const ABI = [
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "function decreaseLiquidity((uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external returns (uint256 amount0, uint256 amount1)",
  "function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external returns (uint256 amount0, uint256 amount1)",
]

// MaxUint128 value for ethers v6
const MaxUint128 = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")

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
 * Withdraw liquidity from a Uniswap V3 position and collect tokens to admin wallet
 */
export async function withdrawLiquidity({
  tokenId,
  recipient,
  liquidityAmount = "0", // If 0, withdraw all liquidity
}: {
  tokenId: string
  recipient: string
  liquidityAmount?: string
}) {
  console.log(`Withdrawing liquidity for token ID: ${tokenId}, recipient: ${recipient}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    // Use admin wallet if no recipient is provided
    if (!recipient) {
      recipient = process.env.ADMIN_WALLET || process.env.NEXT_PUBLIC_ADMIN_WALLET || ""
      if (!recipient) {
        throw new Error("No recipient provided and ADMIN_WALLET not configured")
      }
      console.log(`No recipient specified, using admin wallet: ${recipient}`)
    }

    // Get private key securely on the server
    const privateKey = getFormattedPrivateKey()

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(privateKey, provider)
    console.log(`Using wallet address: ${signer.address} for withdrawing liquidity`)

    // Create position manager contract instance
    const positionManager = new ethers.Contract(NONFUNGIBLE_POSITION_MANAGER, ABI, signer)

    // Get position information to check liquidity
    const position = await positionManager.positions(tokenId)
    const currentLiquidity = position.liquidity

    if (currentLiquidity === 0n) {
      throw new Error("No liquidity in this position")
    }

    console.log(`Current liquidity: ${currentLiquidity.toString()}`)

    // Determine how much liquidity to withdraw
    let liquidityToWithdraw = currentLiquidity
    if (liquidityAmount !== "0") {
      liquidityToWithdraw = BigInt(liquidityAmount)
      if (liquidityToWithdraw > currentLiquidity) {
        throw new Error(
          `Requested liquidity (${liquidityToWithdraw}) exceeds available liquidity (${currentLiquidity})`,
        )
      }
    }

    console.log(`Withdrawing ${liquidityToWithdraw.toString()} liquidity`)

    // Set deadline to 10 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10

    // Step 1: Decrease liquidity
    console.log("Decreasing liquidity...")
    const tx1 = await positionManager.decreaseLiquidity(
      {
        tokenId,
        liquidity: liquidityToWithdraw,
        amount0Min: 0, // In production, calculate slippage protection
        amount1Min: 0, // In production, calculate slippage protection
        deadline,
      },
      {
        gasLimit: 500000, // Add gas limit to prevent unexpected failures
      },
    )

    console.log(`Decrease liquidity transaction sent: ${tx1.hash}`)

    // Wait for transaction to be mined
    const receipt1 = await tx1.wait()
    console.log(`Decrease liquidity confirmed in block ${receipt1?.blockNumber}`)

    // Step 2: Collect the tokens
    console.log(`Collecting tokens to ${recipient}...`)
    const tx2 = await positionManager.collect(
      {
        tokenId,
        recipient,
        amount0Max: MaxUint128,
        amount1Max: MaxUint128,
      },
      {
        gasLimit: 500000, // Add gas limit to prevent unexpected failures
      },
    )

    console.log(`Collect tokens transaction sent: ${tx2.hash}`)

    // Wait for transaction to be mined
    const receipt2 = await tx2.wait()
    console.log(`Collect tokens confirmed in block ${receipt2?.blockNumber}`)

    // Log to Supabase
    try {
      await supabase.from("liquidity_logs").insert([
        {
          type: "withdraw_liquidity",
          token_id: tokenId,
          liquidity: liquidityToWithdraw.toString(),
          recipient,
          tx_hash_decrease: tx1.hash,
          tx_hash_collect: tx2.hash,
        },
      ])
      console.log("Withdrawal logged to Supabase")
    } catch (supabaseError) {
      console.warn("Failed to log to Supabase:", supabaseError)
      // Continue execution even if logging fails
    }

    return {
      success: true,
      tx1: tx1.hash,
      tx2: tx2.hash,
      explorerUrl1: `https://etherscan.io/tx/${tx1.hash}`,
      explorerUrl2: `https://etherscan.io/tx/${tx2.hash}`,
    }
  } catch (error: any) {
    console.error("Error withdrawing liquidity:", error)
    return { success: false, error: error.message }
  }
}