"use server"

import { ethers } from "ethers"
import { supabase } from "@/lib/supabaseClient"
import { POSITION_MANAGER_ADDRESS, TICK_SPACINGS } from "@/app/lib/constants"
import { POSITION_MANAGER_ABI } from "@/app/lib/abis"
import { getFormattedPrivateKey } from "@/app/lib/utils"

/**
 * Calculates the tick range based on the price range
 */
export async function calculateTickRange({
  token0Address,
  token1Address,
  fee,
  priceRange,
}: {
  token0Address: string
  token1Address: string
  fee: number
  priceRange: number
}) {
  console.log(`Calculating tick range for ${token0Address}/${token1Address} with fee ${fee}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Get tick spacing for the given fee tier
    const tickSpacing = TICK_SPACINGS[fee]
    if (!tickSpacing) {
      throw new Error(`Invalid fee tier: ${fee}`)
    }

    // Get pool contract
    const poolContract = new ethers.Contract(
      "0x8ad599c3A0ff1FC0cAe9cD62c1979040659Fe963", // Uniswap V3 Pool
      ["function tickSpacing() external view returns (int24)"],
      provider,
    )

    // Calculate current price
    const currentPrice = 1 // In a real app, you would fetch the current price

    // Calculate lower and upper prices
    const lowerPrice = currentPrice / (1 + priceRange / 100)
    const upperPrice = currentPrice * (1 + priceRange / 100)

    // Calculate lower and upper ticks
    const tickLower = Math.floor(Math.log(lowerPrice) / Math.log(1.0001) / tickSpacing) * tickSpacing
    const tickUpper = Math.ceil(Math.log(upperPrice) / Math.log(1.0001) / tickSpacing) * tickSpacing

    console.log(`Calculated tick range: ${tickLower} to ${tickUpper}`)

    return {
      success: true,
      tickLower,
      tickUpper,
    }
  } catch (error: any) {
    console.error("Error calculating tick range:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Add liquidity to a Uniswap V3 pool
 */
export async function addLiquidityToPool({
  token0Address,
  token1Address,
  fee,
  amount0,
  amount1,
  tickLower,
  tickUpper,
  recipient,
  slippageTolerance,
}: {
  token0Address: string
  token1Address: string
  fee: number
  amount0: string
  amount1: string
  tickLower: number
  tickUpper: number
  recipient: string
  slippageTolerance: number
}) {
  console.log(`Adding liquidity to pool for ${token0Address}/${token1Address}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    // Get private key securely on the server
    const privateKey = getFormattedPrivateKey()

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(privateKey, provider)

    // Create position manager contract instance
    const positionManager = new ethers.Contract(POSITION_MANAGER_ADDRESS, POSITION_MANAGER_ABI, signer)

    // Parse amounts
    const parsedAmount0 = ethers.parseUnits(amount0, 18) // Assuming 18 decimals for both tokens
    const parsedAmount1 = ethers.parseUnits(amount1, 18)

    // Set deadline to 10 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10

    // Prepare parameters for mint
    const params = {
      token0: token0Address,
      token1: token1Address,
      fee: fee,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: parsedAmount0,
      amount1Desired: parsedAmount1,
      amount0Min: 0, // In production, calculate slippage protection
      amount1Min: 0, // In production, calculate slippage protection
      recipient: recipient,
      deadline: deadline,
    }

    console.log("Mint parameters:", params)

    // Call mint
    const tx = await positionManager.mint(params, {
      gasLimit: 1000000, // Add gas limit to prevent unexpected failures
    })

    console.log(`Mint transaction sent: ${tx.hash}`)

    // Wait for transaction to be mined
    const receipt = await tx.wait()
    console.log(`Mint confirmed in block ${receipt?.blockNumber}`)

    // Get the token ID from the event logs
    let tokenId = null
    if (receipt && receipt.logs) {
      for (const log of receipt.logs) {
        if (log.address === POSITION_MANAGER_ADDRESS) {
          // Check if this is the Transfer event
          if (log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba778895dca41992c089deb1769f6") {
            // The tokenId is the third topic in the Transfer event
            tokenId = log.topics[3]
            console.log(`Minted token ID: ${tokenId}`)
            break
          }
        }
      }
    }

    // Log to Supabase
    try {
      await supabase.from("liquidity_logs").insert([
        {
          type: "uniswap_add_liquidity",
          token0: token0Address,
          token1: token1Address,
          amount0: amount0,
          amount1: amount1,
          tick_lower: tickLower,
          tick_upper: tickUpper,
          recipient: recipient,
          tx_hash: tx.hash,
          token_id: tokenId,
        },
      ])
      console.log("Add liquidity logged to Supabase")
    } catch (supabaseError) {
      console.warn("Failed to log to Supabase:", supabaseError)
      // Continue execution even if logging fails
    }

    return {
      success: true,
      txHash: tx.hash,
      tokenId: tokenId,
      explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
    }
  } catch (error: any) {
    console.error("Error adding liquidity:", error)
    return { success: false, error: error.message }
  }
}