"use client"

import { ethers } from "ethers"

// Token cache with expiration
interface TokenCacheItem {
  data: any
  expiry: number
}

// Create a singleton token cache
class TokenCache {
  private static instance: TokenCache
  private cache: Map<string, TokenCacheItem> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  public static getInstance(): TokenCache {
    if (!TokenCache.instance) {
      TokenCache.instance = new TokenCache()
    }
    return TokenCache.instance
  }

  public get(key: string): any | undefined {
    const item = this.cache.get(key)
    if (!item) return undefined

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return undefined
    }

    return item.data
  }

  public set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    const expiry = Date.now() + ttl
    this.cache.set(key, { data, expiry })
  }

  public has(key: string): boolean {
    return this.get(key) !== undefined
  }

  public delete(key: string): void {
    this.cache.delete(key)
  }

  public clear(): void {
    this.cache.clear()
  }
}

// ERC20 Token ABI for token operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

// Get token information with caching
export async function getTokenInfo(
  tokenAddress: string,
  provider: ethers.JsonRpcProvider,
): Promise<{
  name: string
  symbol: string
  decimals: number
}> {
  const cache = TokenCache.getInstance()
  const cacheKey = `token-info-${tokenAddress}`

  // Check cache first
  const cachedInfo = cache.get(cacheKey)
  if (cachedInfo) {
    return cachedInfo
  }

  try {
    // Create token contract
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

    // Get token info
    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name().catch(() => "Unknown Token"),
      tokenContract.symbol().catch(() => "TOKEN"),
      tokenContract.decimals().catch(() => 18),
    ])

    const tokenInfo = { name, symbol, decimals }

    // Cache the result
    cache.set(cacheKey, tokenInfo)

    return tokenInfo
  } catch (error) {
    console.error(`Error fetching token info for ${tokenAddress}:`, error)
    return {
      name: "Unknown Token",
      symbol: "TOKEN",
      decimals: 18,
    }
  }
}

// Get token balance
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  provider: ethers.JsonRpcProvider,
): Promise<{
  raw: bigint
  formatted: string
  decimals: number
}> {
  try {
    // Get token info first (uses cache)
    const { decimals } = await getTokenInfo(tokenAddress, provider)

    // Create token contract instance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

    // Get balance with timeout and error handling
    try {
      const balance = await tokenContract.balanceOf(walletAddress, {
        // Add a gas limit to prevent hanging on malicious contracts
        gasLimit: 100000,
      })

      return {
        raw: balance,
        formatted: ethers.formatUnits(balance, decimals),
        decimals,
      }
    } catch (error) {
      console.error(`Error in balanceOf call for ${tokenAddress}:`, error)
      throw new Error(`Failed to get token balance: ${error.message}`)
    }
  } catch (error) {
    console.error(`Error fetching token balance for ${tokenAddress}:`, error)
    return {
      raw: 0n,
      formatted: "0",
      decimals: 18,
    }
  }
}

// Get native token balance (ETH, BNB, etc.)
export async function getNativeBalance(
  walletAddress: string,
  provider: ethers.JsonRpcProvider,
): Promise<{
  raw: bigint
  formatted: string
}> {
  try {
    // Add timeout and error handling
    try {
      const balance = await provider.getBalance(walletAddress)

      return {
        raw: balance,
        formatted: ethers.formatEther(balance),
      }
    } catch (error) {
      console.error(`Error in getBalance call for ${walletAddress}:`, error)
      throw new Error(`Failed to get native balance: ${error.message}`)
    }
  } catch (error) {
    console.error(`Error fetching native balance for ${walletAddress}:`, error)
    return {
      raw: 0n,
      formatted: "0",
    }
  }
}

// Synchronize token balances across components
export function syncTokenBalances(
  walletAddress: string,
  rpcUrl: string,
  callback: (balances: Record<string, string>) => void,
): () => void {
  // Create provider
  const provider = new ethers.JsonRpcProvider(rpcUrl)

  // Function to fetch all balances
  const fetchBalances = async () => {
    try {
      // Get native balance
      const { formatted: ethBalance } = await getNativeBalance(walletAddress, provider)

      // Start with ETH balance
      const balances: Record<string, string> = {
        ETH: ethBalance,
      }

      // Add other token balances here if needed
      // This would typically come from a list of tokens the user is tracking

      // Call the callback with the updated balances
      callback(balances)
    } catch (error) {
      console.error("Error syncing token balances:", error)
    }
  }

  // Fetch balances immediately
  fetchBalances()

  // Set up interval to refresh balances
  const intervalId = setInterval(fetchBalances, 30000) // 30 seconds

  // Return cleanup function
  return () => clearInterval(intervalId)
}