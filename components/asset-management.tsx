"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

// Add global type for refresh interval
declare global {
  interface Window {
    assetRefreshInterval?: NodeJS.Timeout
  }
}

// Minimal ERC20 ABI for token information
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
]

// Mock price data for demo purposes
const MOCK_PRICES = {
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

// Mock performance data
const MOCK_PERFORMANCE = {
  ETH: 12.5,
  WETH: 12.5,
  USDC: 0.1,
  USDT: 0.1,
  DAI: 0.2,
  WBTC: 15.3,
  UNI: -5.2,
  LINK: 8.7,
  AAVE: -2.3,
  COMP: 4.1,
  SNX: -8.5,
  MKR: 7.2,
  YFI: 10.5,
}

// Mock transaction history
const MOCK_TRANSACTIONS = [
  { id: 1, type: "Buy", asset: "ETH", amount: "1.5", value: "$4,500", date: "2023-04-01", status: "Completed" },
  { id: 2, type: "Sell", asset: "UNI", amount: "100", value: "$850", date: "2023-03-28", status: "Completed" },
  { id: 3, type: "Buy", asset: "LINK", amount: "50", value: "$760", date: "2023-03-25", status: "Completed" },
  { id: 4, type: "Transfer", asset: "USDC", amount: "1000", value: "$1,000", date: "2023-03-20", status: "Completed" },
  { id: 5, type: "Buy", asset: "WBTC", amount: "0.05", value: "$2,000", date: "2023-03-15", status: "Completed" },
]

// Supported Cryptos
const SUPPORTED_CRYPTOS = [
  {
    id: "ETH",
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    network: "ethereum",
    contractAddress: null,
  },
  {
    id: "WETH",
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    network: "ethereum",
    contractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  {
    id: "USDC",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    network: "ethereum",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  {
    id: "WBTC",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
    network: "ethereum",
    contractAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  },
  {
    id: "UNI",
    name: "Uniswap",
    symbol: "UNI",
    decimals: 18,
    network: "ethereum",
    contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  },
  {
    id: "LINK",
    name: "Chainlink",
    symbol: "LINK",
    decimals: 18,
    network: "ethereum",
    contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  },
  {
    id: "BTC",
    name: "Bitcoin",
    symbol: "BTC",
    decimals: 8,
    network: "bitcoin",
    contractAddress: null,
  },
  {
    id: "SOL",
    name: "Solana",
    symbol: "SOL",
    decimals: 9,
    network: "solana",
    contractAddress: null,
  },
]

export default function AssetManagement() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newAssetAddress, setNewAssetAddress] = useState("")
  const [isAddingAsset, setIsAddingAsset] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [rpcUrl, setRpcUrl] = useState(process.env.NEXT_PUBLIC_RPC_URL || "")
  const [totalValue, setTotalValue] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const { toast } = useToast()

  // Load saved settings on component mount
  useEffect(() => {
    const loadSavedSettings = () => {
      try {
        const savedSettings = localStorage.getItem("assetManagementSettings")
        if (savedSettings) {
          const { walletAddress: savedWalletAddress, rpcUrl: savedRpcUrl } = JSON.parse(savedSettings)
          setWalletAddress(savedWalletAddress || "")
          setRpcUrl(savedRpcUrl || process.env.NEXT_PUBLIC_RPC_URL || "")
        }
      } catch (error) {
        console.error("Error loading saved settings:", error)
      }
    }

    loadSavedSettings()

    // Start auto-refresh after loading settings
    startAutoRefresh()

    // Load mock assets for demo
    // loadMockAssets()
  }, [])

  // Calculate total portfolio value whenever assets change
  useEffect(() => {
    const total = assets.reduce((sum, asset) => sum + asset.valueUsd, 0)
    setTotalValue(total)
  }, [assets])

  const loadMockAssets = () => {
    // For demo purposes, load some mock assets
    const mockAssets = [
      {
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        name: "Wrapped Ether",
        symbol: "WETH",
        decimals: 18,
        balance: "2.5",
        price: 3000,
        valueUsd: 7500,
        performance: 12.5,
        allocation: 35,
      },
      {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        balance: "5000",
        price: 1,
        valueUsd: 5000,
        performance: 0.1,
        allocation: 23,
      },
      {
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        decimals: 8,
        balance: "0.15",
        price: 40000,
        valueUsd: 6000,
        performance: 15.3,
        allocation: 28,
      },
      {
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        name: "Uniswap",
        symbol: "UNI",
        decimals: 18,
        balance: "200",
        price: 8.5,
        valueUsd: 1700,
        performance: -5.2,
        allocation: 8,
      },
      {
        address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        name: "Chainlink",
        symbol: "LINK",
        decimals: 18,
        balance: "100",
        price: 15.2,
        valueUsd: 1520,
        performance: 8.7,
        allocation: 7,
      },
    ]

    setAssets(mockAssets)
  }

  const fetchAssets = async () => {
    if (!walletAddress || !rpcUrl) {
      setError("Please enter wallet address and RPC URL")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create a new array to store updated assets
      const updatedAssets = []

      // Get environment variables
      const rpcUrlToUse = rpcUrl || process.env.NEXT_PUBLIC_RPC_URL || ""

      // Create provider
      const provider = new ethers.JsonRpcProvider(rpcUrlToUse)

      // Test the connection
      await provider.getBlockNumber()

      // Fetch balances for each supported crypto
      for (const crypto of SUPPORTED_CRYPTOS) {
        try {
          let balance = "0"
          let valueUsd = 0

          if (crypto.network === "ethereum" || crypto.network === "bsc" || crypto.network === "polygon") {
            if (crypto.contractAddress) {
              // For ERC20 tokens
              const tokenContract = new ethers.Contract(crypto.contractAddress, ERC20_ABI, provider)
              const rawBalance = await tokenContract.balanceOf(walletAddress)
              balance = ethers.formatUnits(rawBalance, crypto.decimals)
            } else {
              // For native tokens (ETH, BNB, MATIC)
              const rawBalance = await provider.getBalance(walletAddress)
              balance = ethers.formatEther(rawBalance)
            }
          } else if (crypto.network === "bitcoin") {
            // For demo purposes, we'll use mock data
            balance = (Math.random() * 0.1).toFixed(8)
          } else if (crypto.network === "solana") {
            // For demo purposes, we'll use mock data
            balance = (Math.random() * 10).toFixed(4)
          }

          // Calculate USD value
          valueUsd = Number(balance) * (MOCK_PRICES[crypto.id] || 0)

          // Only add assets with non-zero balances
          if (Number(balance) > 0) {
            updatedAssets.push({
              address: crypto.contractAddress || "native",
              name: crypto.name,
              symbol: crypto.id,
              decimals: crypto.decimals,
              balance,
              price: MOCK_PRICES[crypto.id] || 0,
              valueUsd,
              performance: MOCK_PERFORMANCE[crypto.id] || 0,
              allocation: 0, // Will be calculated after all assets are fetched
            })
          }
        } catch (error) {
          console.warn(`Error fetching ${crypto.id} balance:`, error)
        }
      }

      // Calculate total value and allocations
      const totalValue = updatedAssets.reduce((sum, asset) => sum + asset.valueUsd, 0)

      // Update allocations
      const assetsWithAllocations = updatedAssets.map((asset) => ({
        ...asset,
        allocation: Math.round((asset.valueUsd / totalValue) * 100),
      }))

      setAssets(assetsWithAllocations)
      setTotalValue(totalValue)

      // Save settings
      saveSettings()

      toast({
        title: "Assets Loaded",
        description: `Successfully fetched ${assetsWithAllocations.length} assets worth $${totalValue.toLocaleString()}`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error fetching assets:", error)
      setError("Failed to fetch assets. Please check your wallet address and RPC URL.")

      toast({
        title: "Error",
        description: "Failed to fetch assets. Please check your wallet address and RPC URL.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add this after the fetchAssets function
  const startAutoRefresh = () => {
    // Clear any existing interval
    if (window.assetRefreshInterval) {
      clearInterval(window.assetRefreshInterval)
    }

    // Set up a new interval to refresh every 30 seconds
    window.assetRefreshInterval = setInterval(() => {
      if (walletAddress && rpcUrl) {
        console.log("Auto-refreshing asset balances...")
        fetchAssets()
      }
    }, 30000) // 30 seconds
  }

  // Stop auto-refresh when component unmounts
  useEffect(() => {
    return () => {
      if (window.assetRefreshInterval) {
        clearInterval(window.assetRefreshInterval)
      }
    }
  }, [])

  const addAsset = async () => {
    if (!newAssetAddress || !ethers.isAddress(newAssetAddress)) {
      setError("Please enter a valid token address")
      return
    }

    setIsAddingAsset(true)
    setError(null)

    try {
      // Check if asset already exists
      const existingAsset = assets.find((asset) => asset.address.toLowerCase() === newAssetAddress.toLowerCase())

      if (existingAsset) {
        throw new Error(`Asset ${existingAsset.symbol} already exists in your portfolio`)
      }

      // In a real implementation, you would fetch the token info
      const provider = new ethers.JsonRpcProvider(rpcUrl || process.env.NEXT_PUBLIC_RPC_URL)

      // Create token contract
      const tokenContract = new ethers.Contract(newAssetAddress, ERC20_ABI, provider)

      // Get token info
      const [name, symbol, decimals, rawBalance] = await Promise.all([
        tokenContract.name().catch(() => "Unknown Token"),
        tokenContract.symbol().catch(() => "TOKEN"),
        tokenContract.decimals().catch(() => 18),
        tokenContract.balanceOf(walletAddress).catch(() => 0),
      ])

      // Format balance
      const balance = ethers.formatUnits(rawBalance, decimals)

      // Generate a random price between $0.1 and $100
      const price = Math.random() * 99.9 + 0.1
      const valueUsd = Number(balance) * price

      // Create new asset
      const newAsset = {
        address: newAssetAddress,
        name,
        symbol,
        decimals,
        balance,
        price,
        valueUsd,
        performance: Math.random() * 30 - 15, // Random performance between -15% and +15%
        allocation: Math.round((valueUsd / (totalValue + valueUsd)) * 100),
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
      setNewAssetAddress("")
      setIsDialogOpen(false)

      toast({
        title: "Asset Added",
        description: `Successfully added ${symbol} to your portfolio`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error adding asset:", error)
      setError(`Failed to add asset: ${error.message}`)

      toast({
        title: "Error",
        description: `Failed to add asset: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsAddingAsset(false)
    }
  }

  const removeAsset = (address: string) => {
    const assetToRemove = assets.find((asset) => asset.address === address)
    if (!assetToRemove) return

    const updatedAssets = assets.filter((asset) => asset.address !== address)

    // Recalculate allocations
    const newTotalValue = updatedAssets.reduce((sum, asset) => sum + asset.valueUsd, 0)
    const assetsWithUpdatedAllocations = updatedAssets.map((asset) => ({
      ...asset,
      allocation: newTotalValue > 0 ? Math.round((asset.valueUsd / newTotalValue) * 100) : 0,
    }))

    setAssets(assetsWithUpdatedAllocations)

    toast({
      title: "Asset Removed",
      description: `Successfully removed ${assetToRemove.symbol} from your portfolio`,
      variant: "success",
    })
  }

  const saveSettings = () => {
    try {
      const settings = {
        walletAddress,
        rpcUrl,
      }

      localStorage.setItem("assetManagementSettings", JSON.stringify(settings))
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: number | string, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(Number(value))
  }

  // Quick action handlers
  const handlePortfolioAnalytics = () => {
    setIsActionLoading("analytics")

    // Simulate API call
    setTimeout(() => {
      setIsActionLoading(null)
      toast({
        title: "Portfolio Analytics",
        description: "Analytics dashboard is being prepared",
        variant: "success",
      })
    }, 1000)
  }

  const handleRebalancePortfolio = () => {
    setIsActionLoading("rebalance")

    // Simulate API call
    setTimeout(() => {
      // Simulate rebalancing by slightly adjusting allocations
      const rebalancedAssets = assets.map((asset) => {
        const adjustmentFactor = 0.95 + Math.random() * 0.1 // Random adjustment between 0.95 and 1.05
        const newAllocation = Math.round(asset.allocation * adjustmentFactor)
        return {
          ...asset,
          allocation: newAllocation,
        }
      })

      setAssets(rebalancedAssets)
      setIsActionLoading(null)

      toast({
        title: "Portfolio Rebalanced",
        description: "Your portfolio has been successfully rebalanced",
        variant: "success",
      })
    }, 1500)
  }

  const handleTransactionHistory = () => {
    setIsActionLoading("transactions")

    // Simulate API call
    setTimeout(() => {
      setIsActionLoading(null)
      toast({
        title: "Transaction History",
        description: "Viewing complete transaction history",
        variant: "success",
      })
    }, 800)
  }

  const handleExportData = () => {
    setIsActionLoading("export")

    // Simulate API call
    setTimeout(() => {
      setIsActionLoading(null)

      // Create a mock CSV content
      const csvContent =
        "Asset,Balance,Value\n" +
        assets.map((asset) => `${asset.symbol},${asset.balance},${formatCurrency(asset.valueUsd)}`).join("\n")

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "portfolio_export.csv")
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Data Exported",
        description: "Portfolio data has been exported to CSV",
        variant: "success",
      })
    }, 1200)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Asset Management</CardTitle>
          <CardDescription className="text-zinc-400">Track and manage your crypto assets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-address" className="text-zinc-400">
                Wallet Address
              </Label>
              <Input
                id="wallet-address"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rpc-url" className="text-zinc-400">
                RPC URL
              </Label>
              <Input
                id="rpc-url"
                placeholder="https://eth-mainnet.g.alchemy.com/v2/your-api-key"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={fetchAssets}
              disabled={loading || !walletAddress || !rpcUrl}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Assets...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Fetch Assets
                </>
              )}
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 text-white border-zinc-700">
                <DialogHeader>
                  <DialogTitle>Add New Asset</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Enter the token contract address to add it to your portfolio.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="token-address" className="text-zinc-300">
                      Token Address
                    </Label>
                    <Input
                      id="token-address"
                      placeholder="0x..."
                      value={newAssetAddress}
                      onChange={(e) => setNewAssetAddress(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-zinc-700 text-zinc-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addAsset}
                    disabled={isAddingAsset || !newAssetAddress}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isAddingAsset ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Asset"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-900/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {assets.length > 0 && (
        <>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Portfolio Overview</CardTitle>
              <CardDescription className="text-zinc-400">Total Value: {formatCurrency(totalValue)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="assets">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="allocation">Allocation</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="assets" className="pt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="pb-3 text-zinc-400 font-medium">Asset</th>
                          <th className="pb-3 text-zinc-400 font-medium text-right">Balance</th>
                          <th className="pb-3 text-zinc-400 font-medium text-right">Price</th>
                          <th className="pb-3 text-zinc-400 font-medium text-right">Value</th>
                          <th className="pb-3 text-zinc-400 font-medium text-right">24h</th>
                          <th className="pb-3 text-zinc-400 font-medium text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.map((asset) => (
                          <tr key={asset.address} className="border-b border-zinc-800">
                            <td className="py-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center mr-2">
                                  {asset.symbol.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium">{asset.symbol}</div>
                                  <div className="text-xs text-zinc-400">{asset.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-right">{formatNumber(asset.balance)}</td>
                            <td className="py-3 text-right">{formatCurrency(asset.price)}</td>
                            <td className="py-3 text-right">{formatCurrency(asset.valueUsd)}</td>
                            <td className="py-3 text-right">
                              <span className={asset.performance >= 0 ? "text-emerald-500" : "text-red-500"}>
                                {asset.performance >= 0 ? "+" : ""}
                                {asset.performance}%
                              </span>
                            </td>
                            <td className="py-3 flex justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                title="View on Etherscan"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-zinc-800"
                                title="Remove Asset"
                                onClick={() => removeAsset(asset.address)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="allocation" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Asset Allocation</h3>
                      <div className="space-y-4">
                        {assets.map((asset) => (
                          <div key={asset.address} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{asset.symbol}</span>
                              <span>{asset.allocation}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2">
                              <div
                                className="bg-emerald-600 h-2 rounded-full"
                                style={{ width: `${asset.allocation}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <h3 className="text-lg font-medium mb-4">Performance</h3>
                      <div className="flex-1 bg-zinc-800 rounded-lg p-4 flex flex-col justify-center items-center">
                        <div className="text-center mb-4">
                          <div className="text-sm text-zinc-400">Portfolio Performance (24h)</div>
                          <div className="text-3xl font-bold mt-1">
                            {assets.length > 0 ? (
                              <span
                                className={
                                  assets.reduce((sum, asset) => sum + asset.performance, 0) / assets.length >= 0
                                    ? "text-emerald-500"
                                    : "text-red-500"
                                }
                              >
                                {assets.reduce((sum, asset) => sum + asset.performance, 0) / assets.length >= 0
                                  ? "+"
                                  : ""}
                                {(assets.reduce((sum, asset) => sum + asset.performance, 0) / assets.length).toFixed(2)}
                                %
                              </span>
                            ) : (
                              "0.00%"
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                          <div className="bg-zinc-900 p-3 rounded-lg">
                            <div className="flex items-center">
                              <TrendingUp className="h-5 w-5 text-emerald-500 mr-2" />
                              <div>
                                <div className="text-xs text-zinc-400">Best Performer</div>
                                <div className="font-medium">
                                  {assets.length > 0
                                    ? assets.reduce(
                                        (best, asset) => (asset.performance > best.performance ? asset : best),
                                        assets[0],
                                      ).symbol
                                    : "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-zinc-900 p-3 rounded-lg">
                            <div className="flex items-center">
                              <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                              <div>
                                <div className="text-xs text-zinc-400">Worst Performer</div>
                                <div className="font-medium">
                                  {assets.length > 0
                                    ? assets.reduce(
                                        (worst, asset) => (asset.performance < worst.performance ? asset : worst),
                                        assets[0],
                                      ).symbol
                                    : "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="pt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="pb-3 text-zinc-400 font-medium">Type</th>
                          <th className="pb-3 text-zinc-400 font-medium">Asset</th>
                          <th className="pb-3 text-zinc-400 font-medium text-right">Amount</th>
                          <th className="pb-3 text-zinc-400 font-medium text-right">Value</th>
                          <th className="pb-3 text-zinc-400 font-medium">Date</th>
                          <th className="pb-3 text-zinc-400 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_TRANSACTIONS.map((tx) => (
                          <tr key={tx.id} className="border-b border-zinc-800">
                            <td className="py-3">
                              <span
                                className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  tx.type === "Buy"
                                    ? "bg-emerald-900/50 text-emerald-300"
                                    : tx.type === "Sell"
                                      ? "bg-red-900/50 text-red-300"
                                      : "bg-blue-900/50 text-blue-300"
                                }`}
                              >
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-3">{tx.asset}</td>
                            <td className="py-3 text-right">{tx.amount}</td>
                            <td className="py-3 text-right">{tx.value}</td>
                            <td className="py-3">{tx.date}</td>
                            <td className="py-3">
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-emerald-900/50 text-emerald-300">
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-auto py-4 flex flex-col items-center"
                  onClick={handlePortfolioAnalytics}
                  disabled={isActionLoading === "analytics"}
                >
                  {isActionLoading === "analytics" ? (
                    <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-6 w-6 mb-2" />
                  )}
                  <span>Portfolio Analytics</span>
                </Button>

                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white h-auto py-4 flex flex-col items-center"
                  onClick={handleRebalancePortfolio}
                  disabled={isActionLoading === "rebalance"}
                >
                  {isActionLoading === "rebalance" ? (
                    <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-6 w-6 mb-2" />
                  )}
                  <span>Rebalance Portfolio</span>
                </Button>

                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white h-auto py-4 flex flex-col items-center"
                  onClick={handleTransactionHistory}
                  disabled={isActionLoading === "transactions"}
                >
                  {isActionLoading === "transactions" ? (
                    <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                  ) : (
                    <Clock className="h-6 w-6 mb-2" />
                  )}
                  <span>Transaction History</span>
                </Button>

                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white h-auto py-4 flex flex-col items-center"
                  onClick={handleExportData}
                  disabled={isActionLoading === "export"}
                >
                  {isActionLoading === "export" ? (
                    <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-6 w-6 mb-2" />
                  )}
                  <span>Export Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}