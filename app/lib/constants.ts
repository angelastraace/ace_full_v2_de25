// Uniswap V3 Router address
export const ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564"

// Uniswap V3 NonfungiblePositionManager address
export const POSITION_MANAGER_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"

// Uniswap V3 Factory address
export const FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984"

// Common token addresses
export const TOKEN_ADDRESSES = {
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
}

// Token decimals
export const TOKEN_DECIMALS = {
  WETH: 18,
  USDC: 6,
  DAI: 18,
  USDT: 6,
  WBTC: 8,
  UNI: 18,
}

// Fee tiers
export const FEE_TIERS = {
  LOWEST: 100, // 0.01%
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
}

// Tick spacings by fee tier
export const TICK_SPACINGS = {
  100: 1, // 0.01%
  500: 10, // 0.05%
  3000: 60, // 0.3%
  10000: 200, // 1%
}

// Max uint256 value
export const MAX_UINT256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"