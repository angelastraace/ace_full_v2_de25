"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { ethers } from "ethers"
import { getTokenInfo, getTokenBalance, getNativeBalance } from "@/utils/token-sync"

// Define types
interface Asset {
  address: string
  name: string
  symbol: string
  decimals: number
  balance: string
  price: number
  valueUsd: number
  performance: number
  allocation: number
}

interface AssetContextType {
  assets: Asset[]
  totalValue: number
  walletAddress: string
  setWalletAddress: (address: string) => void
  rpcUrl: string
  setRpcUrl: (url: string) => void
  fetchAssets: () => Promise<void>
  addAsset: (address: string) => Promise<void>
  removeAsset: (address: string) => void
  isLoading: boolean
  error: string | null
}

// Create context
const AssetContext = createContext<AssetContextType | undefined>(undefined)

// ERC20 Token ABI for token operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

// Mock price data for demo purposes
const MOCK_PRICES: Record<string, number> = {
  ETH: 3000,
  WETH: 3000,
  USDC: 1,
  USDT: 1,
  DAI: 1,
  WBTC: 40000,
  UNI: 8.5,
  LINK: 15.2,
  AAVE: 95.0,
  COMP: 60.5,
  SNX: 3.2,
  MKR: 1800,
  YFI: 12000,
}

// Provider component
export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [walletAddress, setWalletAddress] = useState("")
  const [rpcUrl, setRpcUrl] = useState(process.env.NEXT_PUBLIC_RPC_URL || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("assetManagementSettings")
    if (savedSettings) {
      try {
        const { walletAddress: savedWalletAddress, rpcUrl: savedRpcUrl } = JSON.parse(savedSettings)
        if (savedWalletAddress) setWalletAddress(savedWalletAddress)
        if (savedRpcUrl) setRpcUrl(savedRpcUrl)
      } catch (e) {
        console.error("Error loading saved settings:", e)
      }
    }

    // Load saved assets
    const savedAssets = localStorage.getItem("assetManagementAssets")
    if (savedAssets) {
      try {
        const parsedAssets = JSON.parse(savedAssets)
        setAssets(parsedAssets)
        setTotalValue(parsedAssets.reduce((sum: number, asset: Asset) => sum + asset.valueUsd, 0))
      } catch (e) {
        console.error("Error loading saved assets:", e)
      }
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [])

  // Save settings when they change
  useEffect(() => {
    if (walletAddress || rpcUrl) {
      localStorage.setItem("assetManagementSettings", JSON.stringify({ walletAddress, rpcUrl }))
    }
  }, [walletAddress, rpcUrl])

  // Save assets when they change
  useEffect(() => {
    if (assets.length > 0) {
      localStorage.setItem("assetManagementAssets", JSON.stringify(assets))
    }
  }, [assets])

  // Start auto-refresh when wallet address and RPC URL are set
  useEffect(() => {
    if (walletAddress && rpcUrl) {
      // Clear existing interval
      if (refreshInterval) clearInterval(refreshInterval)

      // Fetch assets immediately
      fetchAssets()

      // Set up new interval
      const interval = setInterval(() => {
        fetchAssets()
      }, 30000) // 30 seconds

      setRefreshInterval(interval)

      return () => clearInterval(interval)
    }
  }, [walletAddress, rpcUrl])

  // Fetch assets
  const fetchAssets = async () => {
    if (!walletAddress || !rpcUrl) {
      setError("Please enter wallet address and RPC URL")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create a new array to store updated assets
      const updatedAssets: Asset[] = []

      // Create provider
      const provider = new ethers.JsonRpcProvider(rpcUrl)

      // Test the connection
      await provider.getBlockNumber()

      // Get native ETH balance
      const { formatted: ethBalance } = await getNativeBalance(walletAddress, provider)

      // Add ETH to assets if balance > 0
      if (Number.parseFloat(ethBalance) > 0) {
        updatedAssets.push({
          address: "native",
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
          balance: ethBalance,
          price: MOCK_PRICES.ETH,
          valueUsd: Number.parseFloat(ethBalance) * MOCK_PRICES.ETH,
          performance: 0, // Will be updated later
          allocation: 0, // Will be calculated after all assets are fetched
        })
      }

      // Fetch existing token assets
      for (const asset of assets) {
        if (asset.address !== "native") {
          try {
            // Get token info and balance
            const { decimals } = await getTokenInfo(asset.address, provider)
            const { formatted: balance } = await getTokenBalance(asset.address, walletAddress, provider)

            // Only add if balance > 0
            if (Number.parseFloat(balance) > 0) {
              updatedAssets.push({
                ...asset,
                balance,
                valueUsd: Number.parseFloat(balance) * asset.price,
              })
            }
          } catch (error) {
            console.warn(`Error fetching ${asset.symbol} balance:`, error)
          }
        }
      }

      // Calculate total value and allocations
      const newTotalValue = updatedAssets.reduce((sum, asset) => sum + asset.valueUsd, 0)

      // Update allocations
      const assetsWithAllocations = updatedAssets.map((asset) => ({
        ...asset,
        allocation: Math.round((asset.valueUsd / newTotalValue) * 100),
      }))

      setAssets(assetsWithAllocations)
      setTotalValue(newTotalValue)

      // Broadcast balance update to other components
      const balances: Record<string, string> = {}
      assetsWithAllocations.forEach((asset) => {
        balances[asset.symbol] = asset.balance
      })

      window.dispatchEvent(
        new CustomEvent("wallet-balances-updated", {
          detail: { balances },
        }),
      )
    } catch (error: any) {
      console.error("Error fetching assets:", error)
      setError(`Failed to fetch assets: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Add asset
  const addAsset = async (address: string) => {
    if (!ethers.isAddress(address)) {
      setError("Please enter a valid token address")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Check if asset already exists
      const existingAsset = assets.find((asset) => asset.address.toLowerCase() === address.toLowerCase())

      if (existingAsset) {
        throw new Error(`Asset ${existingAsset.symbol} already exists in your portfolio`)
      }

      // Create provider
      const provider = new ethers.JsonRpcProvider(rpcUrl)

      // Get token info
      const { name, symbol, decimals } = await getTokenInfo(address, provider)

      // Get token balance
      const { formatted: balance } = await getTokenBalance(address, walletAddress, provider)

      // Use mock price or generate random price
      const price = MOCK_PRICES[symbol] || Math.random() * 99.9 + 0.1
      const valueUsd = Number.parseFloat(balance) * price

      // Only add if balance > 0
      if (Number.parseFloat(balance) > 0) {
        // Create new asset
        const newAsset: Asset = {
          address,
          name,
          symbol,
          decimals,
          balance,
          price,
          valueUsd,
          performance: Math.random() * 30 - 15, // Random performance between -15% and +15%
          allocation: 0, // Will be calculated below
        }

        // Add the new asset and recalculate allocations
        const updatedAssets = [...assets, newAsset]
        const newTotalValue = updatedAssets.reduce((sum, asset) => sum + asset.valueUsd, 0)

        // Update allocations for all assets
        const assetsWithUpdatedAllocations = updatedAssets.map((asset) => ({
          ...asset,
          allocation: Math.round((asset.valueUsd / newTotalValue) * 100),
        }))

        setAssets(assetsWithUpdatedAllocations)
        setTotalValue(newTotalValue)
      } else {
        throw new Error(`No ${symbol} balance found for this wallet`)
      }
    } catch (error: any) {
      console.error("Error adding asset:", error)
      setError(`Failed to add asset: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Remove asset
  const removeAsset = (address: string) => {
    const updatedAssets = assets.filter((asset) => asset.address !== address)

    // Recalculate allocations
    const newTotalValue = updatedAssets.reduce((sum, asset) => sum + asset.valueUsd, 0)
    const assetsWithUpdatedAllocations = updatedAssets.map((asset) => ({
      ...asset,
      allocation: newTotalValue > 0 ? Math.round((asset.valueUsd / newTotalValue) * 100) : 0,
    }))

    setAssets(assetsWithUpdatedAllocations)
    setTotalValue(newTotalValue)
  }

  return (
    <AssetContext.Provider
      value={{
        assets,
        totalValue,
        walletAddress,
        setWalletAddress,
        rpcUrl,
        setRpcUrl,
        fetchAssets,
        addAsset,
        removeAsset,
        isLoading,
        error,
      }}
    >
      {children}
    </AssetContext.Provider>
  )
}

// Hook to use the asset context
export const useAssets = () => {
  const context = useContext(AssetContext)
  if (context === undefined) {
    throw new Error("useAssets must be used within an AssetProvider")
  }
  return context
}