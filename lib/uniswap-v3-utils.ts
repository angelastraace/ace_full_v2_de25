import { ethers } from "ethers"

// Uniswap V3 Factory address
export const UNISWAP_V3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"

// Uniswap V3 Factory ABI
export const FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
  "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
]

// Uniswap V3 Pool ABI
export const POOL_ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function initialize(uint160 sqrtPriceX96) external",
]

// NonfungiblePositionManager address
export const POSITION_MANAGER_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"

/**
 * Checks if a pool exists for the given token pair and fee
 */
export async function checkPoolExists(
  token0Address: string,
  token1Address: string,
  fee: number,
  provider: ethers.Provider,
): Promise<string | null> {
  try {
    const factory = new ethers.Contract(UNISWAP_V3_FACTORY, FACTORY_ABI, provider)
    const poolAddress = await factory.getPool(token0Address, token1Address, fee)

    // If the pool address is zero, the pool doesn't exist
    if (poolAddress === "0x0000000000000000000000000000000000000000") {
      return null
    }

    return poolAddress
  } catch (error) {
    console.error("Error checking if pool exists:", error)
    return null
  }
}

/**
 * Creates a new Uniswap V3 pool for the given token pair and fee
 */
export async function createPool(
  token0Address: string,
  token1Address: string,
  fee: number,
  initialPrice: bigint,
  signer: ethers.Signer,
): Promise<string> {
  try {
    // Create factory contract
    const factory = new ethers.Contract(UNISWAP_V3_FACTORY, FACTORY_ABI, signer)

    // Create the pool
    console.log(`Creating pool for ${token0Address}/${token1Address} with fee ${fee}...`)
    const tx1 = await factory.createPool(token0Address, token1Address, fee)
    const receipt1 = await tx1.wait()

    // Get the pool address
    const poolAddress = await factory.getPool(token0Address, token1Address, fee)
    console.log(`Pool created at ${poolAddress}`)

    // Initialize the pool with the initial price
    const pool = new ethers.Contract(poolAddress, POOL_ABI, signer)
    console.log(`Initializing pool with price ${initialPrice}...`)
    const tx2 = await pool.initialize(initialPrice)
    const receipt2 = await tx2.wait()

    console.log(`Pool initialized successfully`)
    return poolAddress
  } catch (error) {
    console.error("Error creating pool:", error)
    throw error
  }
}

/**
 * Calculates the square root price for the given price
 * @param price The price of token1 in terms of token0
 * @param token0Decimals The decimals of token0
 * @param token1Decimals The decimals of token1
 * @returns The square root price as a Q64.96 value
 */
export function encodeSqrtRatioX96(price: number, token0Decimals: number, token1Decimals: number): bigint {
  // Adjust for decimal differences
  const decimalAdjustment = 10 ** (token0Decimals - token1Decimals)
  const adjustedPrice = price * decimalAdjustment

  // Calculate sqrt(price) * 2^96
  const sqrtPrice = Math.sqrt(adjustedPrice)
  const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice * 2 ** 96))

  return sqrtPriceX96
}

/**
 * Calculates tick from price
 */
export function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001))
}

/**
 * Calculates price from tick
 */
export function tickToPrice(tick: number): number {
  return 1.0001 ** tick
}