"use server"

import { ethers } from "ethers"

// Uniswap V3 NonfungiblePositionManager address
const NONFUNGIBLE_POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"

// ABI for getting position information
const ABI = [
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "function ownerOf(uint256 tokenId) view returns (address)",
]

// ERC20 ABI for token information
const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
]

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
    const positionManager = new ethers.Contract(NONFUNGIBLE_POSITION_MANAGER, ABI, provider)

    // Get position information
    const position = await positionManager.positions(tokenId)
    console.log("Raw position data:", position)

    // Try to get the owner of the position
    let owner = "Unknown"
    try {
      owner = await positionManager.ownerOf(tokenId)
    } catch (error) {
      console.warn("Could not determine position owner:", error)
    }

    // Get token symbols and names
    const token0Contract = new ethers.Contract(position.token0, ERC20_ABI, provider)
    const token1Contract = new ethers.Contract(position.token1, ERC20_ABI, provider)

    const [token0Symbol, token1Symbol, token0Name, token1Name, token0Decimals, token1Decimals] = await Promise.all([
      token0Contract.symbol().catch(() => "Unknown"),
      token1Contract.symbol().catch(() => "Unknown"),
      token0Contract.name().catch(() => "Unknown"),
      token1Contract.name().catch(() => "Unknown"),
      token0Contract.decimals().catch(() => 18),
      token1Contract.decimals().catch(() => 18),
    ])

    // Format tokens owed
    const formattedTokensOwed0 = ethers.formatUnits(position.tokensOwed0, token0Decimals)
    const formattedTokensOwed1 = ethers.formatUnits(position.tokensOwed1, token1Decimals)

    // Create formatted position object
    const formattedPosition = {
      tokenId,
      owner,
      token0: {
        address: position.token0,
        symbol: token0Symbol,
        name: token0Name,
        decimals: token0Decimals,
      },
      token1: {
        address: position.token1,
        symbol: token1Symbol,
        name: token1Name,
        decimals: token1Decimals,
      },
      fee: position.fee.toString(),
      tickLower: position.tickLower.toString(),
      tickUpper: position.tickUpper.toString(),
      liquidity: position.liquidity.toString(),
      tokensOwed0: formattedTokensOwed0,
      tokensOwed1: formattedTokensOwed1,
    }

    console.log("Formatted position:", formattedPosition)

    return {
      success: true,
      data: formattedPosition,
    }
  } catch (error: any) {
    console.error("Error fetching position info:", error)
    return { success: false, error: error.message }
  }
}