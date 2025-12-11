import { ethers } from "ethers"

/**
 * Get formatted reserves and token information from a liquidity pool
 * @param {ethers.Contract} pool - The ethers.js Contract instance for the pool
 * @param {ethers.Provider} provider - The ethers.js Provider instance
 * @param {Map} [tokenCache] - Optional cache for token information
 * @returns {Promise<Object>} Formatted reserves and token information
 */
export async function getEnhancedPoolInfo(pool, provider, tokenCache = new Map()) {
  try {
    // Run initial queries in parallel for better performance
    const [reserves, token0Address, token1Address, totalSupply] = await Promise.all([
      pool.getReserves().catch((e) => {
        console.warn("getReserves failed:", e)
        return [ethers.parseUnits("0", 18), ethers.parseUnits("0", 18), 0]
      }),
      pool.token0().catch((e) => {
        console.warn("token0 failed:", e)
        return "0x0000000000000000000000000000000000000000"
      }),
      pool.token1().catch((e) => {
        console.warn("token1 failed:", e)
        return "0x0000000000000000000000000000000000000000"
      }),
      pool.totalSupply().catch((e) => {
        console.warn("totalSupply failed:", e)
        return ethers.parseUnits("0", 18)
      }),
    ])

    // Get token information (with caching)
    const token0Info = await getTokenInfo(token0Address, provider, tokenCache)
    const token1Info = await getTokenInfo(token1Address, provider, tokenCache)

    // Format reserves with proper decimals
    const formattedReserve0 = ethers.formatUnits(reserves[0], token0Info.decimals)
    const formattedReserve1 = ethers.formatUnits(reserves[1], token1Info.decimals)
    const formattedTotalSupply = ethers.formatUnits(totalSupply, 18) // LP tokens typically have 18 decimals

    // Calculate USD value if price feeds are available
    const usdValue0 = await getTokenUsdValue(token0Address, formattedReserve0)
    const usdValue1 = await getTokenUsdValue(token1Address, formattedReserve1)

    return {
      poolAddress: pool.target,
      blockTimestamp: reserves[2] ? reserves[2].toString() : "0",
      lastUpdated: new Date().toISOString(),
      tokens: {
        token0: {
          address: token0Address,
          ...token0Info,
          reserves: {
            raw: reserves[0].toString(),
            formatted: formattedReserve0,
            usdValue: usdValue0,
          },
        },
        token1: {
          address: token1Address,
          ...token1Info,
          reserves: {
            raw: reserves[1].toString(),
            formatted: formattedReserve1,
            usdValue: usdValue1,
          },
        },
      },
      // Calculate additional metrics
      metrics: {
        totalLiquidityUsd: usdValue0 + usdValue1,
        ratio: Number(formattedReserve0) / Number(formattedReserve1) || 0,
        totalSupply: formattedTotalSupply,
      },
    }
  } catch (error) {
    console.error("Error in getEnhancedPoolInfo:", error)
    throw new Error(`Failed to get pool info: ${error.message}`)
  }
}

/**
 * Get token information with caching
 * @param {string} tokenAddress - The token contract address
 * @param {ethers.Provider} provider - The ethers.js Provider instance
 * @param {Map} tokenCache - Cache for token information
 * @returns {Promise<Object>} Token information
 */
export async function getTokenInfo(tokenAddress, provider, tokenCache) {
  // Check cache first to avoid redundant calls
  if (tokenCache.has(tokenAddress)) {
    return tokenCache.get(tokenAddress)
  }

  // Minimal ERC20 ABI for token information
  const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
  ]

  try {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

    // Run queries in parallel with fallbacks
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      token.name().catch(() => `Token ${tokenAddress.substring(0, 6)}...`),
      token.symbol().catch(() => "TKN"),
      token
        .decimals()
        .catch(() => 18), // Default to 18 if not available
      token.totalSupply().catch(() => "0"),
    ])

    const tokenInfo = {
      name,
      symbol,
      decimals,
      totalSupply: totalSupply.toString(),
    }

    // Cache the result
    tokenCache.set(tokenAddress, tokenInfo)
    return tokenInfo
  } catch (error) {
    console.warn(`Error fetching token info for ${tokenAddress}:`, error)

    // Return fallback information
    const fallbackInfo = {
      name: `Token ${tokenAddress.substring(0, 6)}...`,
      symbol: "TKN",
      decimals: 18,
      totalSupply: "0",
    }

    tokenCache.set(tokenAddress, fallbackInfo)
    return fallbackInfo
  }
}

/**
 * Get USD value of token amount using CoinGecko API
 * @param {string} tokenAddress - The token contract address
 * @param {string} amount - The formatted token amount
 * @returns {Promise<number>} USD value
 */
export async function getTokenUsdValue(tokenAddress, amount) {
  // Common token addresses mapped to CoinGecko IDs
  const tokenIdMap = {
    "0x6b175474e89094c44da98b954eedeac495271d0f": "dai", // DAI
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "ethereum", // WETH
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "bitcoin", // WBTC
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "usd-coin", // USDC
    "0xdac17f958d2ee523a2206206994597c13d831ec7": "tether", // USDT
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "uniswap", // UNI
    "0x514910771af9ca656af840dff83e8264ecf986ca": "chainlink", // LINK
    "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "aave", // AAVE
  }

  try {
    const tokenId = tokenIdMap[tokenAddress.toLowerCase()]

    if (!tokenId) {
      // For tokens not in our map, use a default value
      return Number(amount) * 1.0
    }

    // In a production environment, you would uncomment this code to use the CoinGecko API
    /*
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const price = data[tokenId]?.usd || 0;
    */

    // For demo purposes, use hardcoded prices
    const mockPrices = {
      dai: 1.0,
      ethereum: 3000,
      bitcoin: 40000,
      "usd-coin": 1.0,
      tether: 1.0,
      uniswap: 8.5,
      chainlink: 15.2,
      aave: 95.0,
    }

    const price = mockPrices[tokenId] || 1.0

    return Number(amount) * price
  } catch (error) {
    console.warn(`Error fetching price for ${tokenAddress}:`, error)
    return 0
  }
}

/**
 * Create a persistent token cache with expiration
 * @returns {Object} Token cache with methods
 */
export function createTokenCache() {
  const cache = new Map()
  const expirations = new Map()
  const DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 hours

  return {
    get(key) {
      const expiration = expirations.get(key)
      if (expiration && Date.now() > expiration) {
        // Expired
        cache.delete(key)
        expirations.delete(key)
        return undefined
      }
      return cache.get(key)
    },

    set(key, value, ttl = DEFAULT_TTL) {
      cache.set(key, value)
      expirations.set(key, Date.now() + ttl)
    },

    has(key) {
      if (!cache.has(key)) return false

      const expiration = expirations.get(key)
      if (expiration && Date.now() > expiration) {
        // Expired
        cache.delete(key)
        expirations.delete(key)
        return false
      }
      return true
    },

    delete(key) {
      cache.delete(key)
      expirations.delete(key)
    },

    clear() {
      cache.clear()
      expirations.clear()
    },
  }
}