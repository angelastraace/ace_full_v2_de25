"use server"

import { ethers } from "ethers"
import { supabase } from "@/app/lib/supabaseClient"

// Uniswap V3 NonfungiblePositionManager address
const POSITION_MANAGER_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"

// NonfungiblePositionManager ABI (simplified for our needs)
const POSITION_MANAGER_ABI = [
  "function positions(uint256) external view returns (uint96,address,address,address,uint24,int24,int24,uint128,uint256,uint256,uint128,uint128)",
  "function decreaseLiquidity((uint256,uint128,uint256,uint256,uint256)) external returns (uint256,uint256)",
  "function collect((uint256,address,uint128,uint128)) external returns (uint256,uint256)",
  "function ownerOf(uint256) external view returns (address)",
]

// ERC20 ABI for token operations
const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
]

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
export async function getLpPosition(tokenId: string) {
  console.log(`Fetching position info for token ID: ${tokenId}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL
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

    // Get token symbols and names
    const token0Contract = new ethers.Contract(token0, ERC20_ABI, provider)
    const token1Contract = new ethers.Contract(token1, ERC20_ABI, provider)

    const [token0Symbol, token1Symbol, token0Name, token1Name, token0Decimals, token1Decimals, owner] =
      await Promise.all([
        token0Contract.symbol().catch(() => "Unknown"),
        token1Contract.symbol().catch(() => "Unknown"),
        token0Contract.name().catch(() => "Unknown Token"),
        token1Contract.name().catch(() => "Unknown Token"),
        token0Contract.decimals().catch(() => 18),
        token1Contract.decimals().catch(() => 18),
        positionManager.ownerOf(tokenId).catch(() => "Unknown"),
      ])

    // Format tokens owed
    const formattedTokensOwed0 = ethers.formatUnits(tokensOwed0, token0Decimals)
    const formattedTokensOwed1 = ethers.formatUnits(tokensOwed1, token1Decimals)

    // Create formatted position object
    const position = {
      tokenId,
      nonce: nonce.toString(),
      operator,
      token0: {
        address: token0,
        symbol: token0Symbol,
        name: token0Name,
        decimals: token0Decimals,
      },
      token1: {
        address: token1,
        symbol: token1Symbol,
        name: token1Name,
        decimals: token1Decimals,
      },
      fee: fee.toString(),
      tickLower: tickLower.toString(),
      tickUpper: tickUpper.toString(),
      liquidity: liquidity.toString(),
      tokensOwed0: formattedTokensOwed0,
      tokensOwed1: formattedTokensOwed1,
      owner,
    }

    console.log("Formatted position:", position)

    return {
      success: true,
      data: position,
    }
  } catch (error: any) {
    console.error("Error fetching position info:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Withdraw liquidity from a Uniswap V3 position and collect tokens
 */
export async function withdrawLiquidity({
  tokenId,
  recipient,
  liquidityAmount = "0",
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

    // Get private key securely on the server
    const privateKey = getFormattedPrivateKey()

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(privateKey, provider)
    console.log(`Using wallet address: ${signer.address} for withdrawing liquidity`)

    // Create position manager contract instance
    const positionManager = new ethers.Contract(POSITION_MANAGER_ADDRESS, POSITION_MANAGER_ABI, signer)

    // Get position information to determine liquidity
    const positionData = await positionManager.positions(tokenId)
    const currentLiquidity = positionData[7] // liquidity is at index 7

    // Determine how much liquidity to withdraw
    let liquidityToWithdraw
    if (liquidityAmount && liquidityAmount !== "0") {
      liquidityToWithdraw = ethers.parseUnits(liquidityAmount, 0) // Parse as integer
      if (liquidityToWithdraw > currentLiquidity) {
        liquidityToWithdraw = currentLiquidity
      }
    } else {
      liquidityToWithdraw = currentLiquidity
    }

    console.log(`Current liquidity: ${currentLiquidity.toString()}`)
    console.log(`Liquidity to withdraw: ${liquidityToWithdraw.toString()}`)

    if (liquidityToWithdraw.toString() === "0") {
      throw new Error("No liquidity to withdraw")
    }

    // Set deadline to 10 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10

    // Step 1: Decrease liquidity
    console.log("Step 1: Decreasing liquidity...")
    const decreaseParams = [
      tokenId,
      liquidityToWithdraw.toString(),
      0, // amount0Min
      0, // amount1Min
      deadline,
    ]

    console.log("Decrease liquidity params:", decreaseParams)

    const tx1 = await positionManager.decreaseLiquidity(decreaseParams, {
      gasLimit: 500000, // Add gas limit to prevent unexpected failures
    })

    console.log(`Decrease liquidity transaction sent: ${tx1.hash}`)

    // Wait for transaction to be mined
    const receipt1 = await tx1.wait()
    console.log(`Decrease liquidity confirmed in block ${receipt1?.blockNumber}`)

    // Step 2: Collect tokens
    console.log("Step 2: Collecting tokens...")
    const collectParams = [
      tokenId,
      recipient,
      ethers.MaxUint128, // amount0Max
      ethers.MaxUint128, // amount1Max
    ]

    console.log("Collect tokens params:", collectParams)

    const tx2 = await positionManager.collect(collectParams, {
      gasLimit: 500000, // Add gas limit to prevent unexpected failures
    })

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
          recipient: recipient,
          liquidity: liquidityToWithdraw.toString(),
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