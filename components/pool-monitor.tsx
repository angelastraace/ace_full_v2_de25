"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCw, AlertCircle, Save, Check } from "lucide-react"

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
]

export default function PoolMonitor() {
  const [rpcUrl, setRpcUrl] = useState("https://eth-mainnet.g.alchemy.com/v2/your-api-key")
  const [privateKey, setPrivateKey] = useState("")
  const [poolAddress, setPoolAddress] = useState("")
  const [poolData, setPoolData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load saved connection settings on component mount
  useEffect(() => {
    const loadSavedSettings = () => {
      try {
        const savedSettings = localStorage.getItem("liquidityPoolSettings")
        if (savedSettings) {
          const {
            rpcUrl: savedRpcUrl,
            poolAddress: savedPoolAddress,
            privateKey: savedPrivateKey,
          } = JSON.parse(savedSettings)
          setRpcUrl(savedRpcUrl || "")
          setPoolAddress(savedPoolAddress || "")
          setPrivateKey(savedPrivateKey || "")

          // Auto-fetch if we have both RPC URL and pool address
          if (savedRpcUrl && savedPoolAddress) {
            fetchPoolData(savedRpcUrl, savedPoolAddress)
          }
        }
      } catch (error) {
        console.error("Error loading saved settings:", error)
      }
    }

    loadSavedSettings()
  }, [])

  const fetchPoolData = async (url = rpcUrl, address = poolAddress) => {
    if (!url || !address) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create provider
      const provider = new ethers.JsonRpcProvider(url)

      // Create pool contract instance
      const pool = new ethers.Contract(address, UNISWAP_V2_PAIR_ABI, provider)

      // Get reserves, token addresses, and total supply in parallel
      const [reserves, token0Address, token1Address, totalSupply] = await Promise.all([
        pool.getReserves(),
        pool.token0(),
        pool.token1(),
        pool.totalSupply(),
      ])

      // Create token contract instances
      const token0 = new ethers.Contract(token0Address, ERC20_ABI, provider)
      const token1 = new ethers.Contract(token1Address, ERC20_ABI, provider)

      // Get token info in parallel
      const [token0Symbol, token0Decimals, token1Symbol, token1Decimals] = await Promise.all([
        token0.symbol(),
        token0.decimals(),
        token1.symbol(),
        token1.decimals(),
      ])

      // Format reserves using proper decimals
      const formattedReserve0 = ethers.formatUnits(reserves[0], token0Decimals)
      const formattedReserve1 = ethers.formatUnits(reserves[1], token1Decimals)
      const formattedTotalSupply = ethers.formatUnits(totalSupply, 18) // LP tokens typically have 18 decimals

      // Set pool data
      setPoolData({
        token0: {
          address: token0Address,
          symbol: token0Symbol,
          reserve: formattedReserve0,
          decimals: token0Decimals,
        },
        token1: {
          address: token1Address,
          symbol: token1Symbol,
          reserve: formattedReserve1,
          decimals: token1Decimals,
        },
        totalSupply: formattedTotalSupply,
        lastUpdated: new Date().toLocaleTimeString(),
      })
    } catch (err: any) {
      console.error("Error fetching pool data:", err)
      setError(`Failed to fetch pool data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Save connection settings to localStorage
  const saveConnectionSettings = () => {
    setIsSaving(true)

    try {
      const settings = {
        rpcUrl,
        privateKey,
        poolAddress,
      }

      localStorage.setItem("liquidityPoolSettings", JSON.stringify(settings))

      // Show success indicator
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Format number with commas
  const formatNumber = (num: string) => {
    return Number.parseFloat(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })
  }

  return (
    <Card className="w-full bg-zinc-900 text-white border-zinc-800">
      <CardHeader>
        <CardTitle>Liquidity Pool Monitor</CardTitle>
        <CardDescription className="text-zinc-400">
          Monitor liquidity pool reserves and token information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <p className="text-xs text-zinc-500">Use an RPC provider like Alchemy, Infura, or your own node</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="private-key" className="text-zinc-400">
            Private Key (Optional)
          </Label>
          <Input
            id="private-key"
            type="password"
            placeholder="0x..."
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <p className="text-xs text-zinc-500">Only required for write operations. Leave blank for read-only access.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pool-address" className="text-zinc-400">
            Pool Address
          </Label>
          <Input
            id="pool-address"
            placeholder="0x..."
            value={poolAddress}
            onChange={(e) => setPoolAddress(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <p className="text-xs text-zinc-500">
            Example: 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640 (WETH/USDC Uniswap V2)
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => fetchPoolData()}
            disabled={loading || !rpcUrl || !poolAddress}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Data...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Fetch Pool Data
              </>
            )}
          </Button>

          <Button
            onClick={saveConnectionSettings}
            disabled={isSaving || (!rpcUrl && !poolAddress && !privateKey)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            title="Save connection settings"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-md bg-red-900/50 border border-red-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {poolData && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-md bg-zinc-800">
                <div className="text-sm text-zinc-400 mb-1">{poolData.token0.symbol}</div>
                <div className="text-xl font-bold">{formatNumber(poolData.token0.reserve)}</div>
                <div className="text-xs text-zinc-500 mt-1 truncate">{poolData.token0.address}</div>
              </div>

              <div className="p-4 rounded-md bg-zinc-800">
                <div className="text-sm text-zinc-400 mb-1">{poolData.token1.symbol}</div>
                <div className="text-xl font-bold">{formatNumber(poolData.token1.reserve)}</div>
                <div className="text-xs text-zinc-500 mt-1 truncate">{poolData.token1.address}</div>
              </div>
            </div>

            <div className="p-4 rounded-md bg-zinc-800">
              <div className="text-sm text-zinc-400 mb-1">Total LP Tokens</div>
              <div className="text-xl font-bold">{formatNumber(poolData.totalSupply)}</div>
            </div>

            <div className="text-xs text-zinc-500 text-right">Last updated: {poolData.lastUpdated}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}