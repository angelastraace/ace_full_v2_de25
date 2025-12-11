"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react"
import AdminActions from "@/components/admin-actions"
import BlockchainStatus from "@/components/blockchain-status"
import dynamic from "next/dynamic"

// Dynamically import Chart.js components with SSR disabled
const AdminCharts = dynamic(() => import("@/components/admin-charts"), {
  ssr: false,
  loading: () => (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Loading Charts...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-zinc-800 rounded animate-pulse"></div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Loading Charts...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-zinc-800 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    </section>
  ),
})

// Minimal ABI for Uniswap V2 Pair
const UNISWAP_V2_PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function totalSupply() external view returns (uint256)",
]

// Minimal ABI for ERC20 tokens
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
]

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalLiquidity: 0,
    token0Reserve: 0,
    token1Reserve: 0,
    lpTokenSupply: 0,
    token0Symbol: "",
    token1Symbol: "",
  })

  const [historicalData, setHistoricalData] = useState({
    timestamps: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
    liquidityValues: [0, 0, 0, 0, 0, 0, 0],
    volumeValues: [0, 0, 0, 0, 0, 0, 0],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBrowser, setIsBrowser] = useState(false)

  useEffect(() => {
    // Set browser flag after component mounts (client-side only)
    setIsBrowser(true)

    // Load saved connection settings
    const savedSettings = localStorage.getItem("liquidityPoolSettings")
    if (savedSettings) {
      const { rpcUrl, poolAddress } = JSON.parse(savedSettings)
      if (rpcUrl && poolAddress) {
        fetchPoolStats(rpcUrl, poolAddress)
      } else {
        setLoading(false)
        setError("No saved pool connection. Please configure a pool in the Pools section.")
      }
    } else {
      setLoading(false)
      setError("No saved pool connection. Please configure a pool in the Pools section.")
    }

    // Generate mock historical data
    generateMockHistoricalData()
  }, [])

  async function fetchPoolStats(rpcUrl, poolAddress) {
    setLoading(true)
    setError(null)

    try {
      // Create provider
      const provider = new ethers.JsonRpcProvider(rpcUrl)

      // Create pool contract instance
      const pool = new ethers.Contract(poolAddress, UNISWAP_V2_PAIR_ABI, provider)

      // Get reserves, token addresses, and total supply in parallel
      const [reserves, token0Address, token1Address, totalSupply] = await Promise.all([
        pool.getReserves().catch(() => [0, 0, 0]),
        pool.token0().catch(() => "0x0000000000000000000000000000000000000000"),
        pool.token1().catch(() => "0x0000000000000000000000000000000000000000"),
        pool.totalSupply().catch(() => 0),
      ])

      // Create token contract instances
      const token0 = new ethers.Contract(token0Address, ERC20_ABI, provider)
      const token1 = new ethers.Contract(token1Address, ERC20_ABI, provider)

      // Get token info in parallel with fallbacks
      const [token0Symbol, token0Decimals, token1Symbol, token1Decimals] = await Promise.all([
        token0.symbol().catch(() => "TKN0"),
        token0.decimals().catch(() => 18),
        token1.symbol().catch(() => "TKN1"),
        token1.decimals().catch(() => 18),
      ])

      // Format reserves using proper decimals
      const formattedReserve0 = Number.parseFloat(ethers.formatUnits(reserves[0] || 0, token0Decimals))
      const formattedReserve1 = Number.parseFloat(ethers.formatUnits(reserves[1] || 0, token1Decimals))
      const formattedTotalSupply = Number.parseFloat(ethers.formatUnits(totalSupply || 0, 18)) // LP tokens typically have 18 decimals

      // Calculate total liquidity (simplified - in a real app you'd use price feeds)
      let totalLiquidity = 0
      if (token0Symbol === "WETH" || token0Symbol === "ETH") {
        totalLiquidity = formattedReserve0 * 3000 * 2 // Assuming ETH price of $3000 and doubling for both sides
      } else if (token1Symbol === "WETH" || token1Symbol === "ETH") {
        totalLiquidity = formattedReserve1 * 3000 * 2
      } else if (token0Symbol === "USDC" || token0Symbol === "USDT" || token0Symbol === "DAI") {
        totalLiquidity = formattedReserve0 * 2 // Stablecoins at $1
      } else if (token1Symbol === "USDC" || token1Symbol === "USDT" || token1Symbol === "DAI") {
        totalLiquidity = formattedReserve1 * 2
      } else {
        totalLiquidity = (formattedReserve0 + formattedReserve1) * 10 // Fallback estimation
      }

      setMetrics({
        totalLiquidity,
        token0Reserve: formattedReserve0,
        token1Reserve: formattedReserve1,
        lpTokenSupply: formattedTotalSupply,
        token0Symbol,
        token1Symbol,
      })

      // Update the first value in historical data with the current liquidity
      setHistoricalData((prev) => {
        const newLiquidityValues = [...prev.liquidityValues]
        newLiquidityValues[newLiquidityValues.length - 1] = totalLiquidity
        return {
          ...prev,
          liquidityValues: newLiquidityValues,
        }
      })
    } catch (error) {
      console.error("Error fetching pool stats:", error)
      setError(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function generateMockHistoricalData() {
    // Generate random historical data for demonstration
    const baseValue = Math.random() * 1000000 + 500000 // Random base between 500K and 1.5M
    const timestamps = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]

    const liquidityValues = timestamps.map((_, index) => {
      // Create an upward trend with some randomness
      return baseValue * (1 + index * 0.05) * (0.95 + Math.random() * 0.1)
    })

    const volumeValues = timestamps.map(() => {
      // Random daily volume between 10% and 30% of liquidity
      return baseValue * (0.1 + Math.random() * 0.2)
    })

    setHistoricalData({
      timestamps,
      liquidityValues,
      volumeValues,
    })
  }

  const refreshDashboard = () => {
    const savedSettings = localStorage.getItem("liquidityPoolSettings")
    if (savedSettings) {
      const { rpcUrl, poolAddress } = JSON.parse(savedSettings)
      if (rpcUrl && poolAddress) {
        fetchPoolStats(rpcUrl, poolAddress)
      } else {
        setError("No saved pool connection. Please configure a pool in the Pools section.")
      }
    } else {
      setError("No saved pool connection. Please configure a pool in the Pools section.")
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <main className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Liquidity Pool Admin Dashboard</h1>

      {/* Blockchain Network Status */}
      <BlockchainStatus />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-sm text-zinc-400 mb-1">Total Liquidity</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalLiquidity)}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-sm text-zinc-400 mb-1">{metrics.token0Symbol || "Token 0"} Reserve</div>
            <div className="text-2xl font-bold text-white">{formatNumber(metrics.token0Reserve)}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-sm text-zinc-400 mb-1">{metrics.token1Symbol || "Token 1"} Reserve</div>
            <div className="text-2xl font-bold text-white">{formatNumber(metrics.token1Reserve)}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-sm text-zinc-400 mb-1">LP Token Supply</div>
            <div className="text-2xl font-bold text-white">{formatNumber(metrics.lpTokenSupply)}</div>
          </CardContent>
        </Card>
      </section>

      {isBrowser && (
        <AdminCharts
          historicalData={historicalData}
          doughnutData={{
            labels: [metrics.token0Symbol || "Token 0", metrics.token1Symbol || "Token 1"],
            values: [metrics.token0Reserve || 1, metrics.token1Reserve || 1],
          }}
        />
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminActions />

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Refresh Pool Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Button
                onClick={refreshDashboard}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Dashboard
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 rounded-md bg-red-900/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}