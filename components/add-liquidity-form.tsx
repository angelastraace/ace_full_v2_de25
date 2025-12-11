"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addLiquidityToPool, calculateTickRange } from "@/app/actions/add-liquidity-actions"
import { ethers } from "ethers"

// Common tokens with checksummed addresses
const TOKENS = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Special address for ETH
    decimals: 18,
    isNative: true,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ethereum",
    address: ethers.getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"), // Checksummed
    decimals: 18,
    isNative: false,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: ethers.getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"), // Checksummed
    decimals: 6,
    isNative: false,
  },
  {
    symbol: "USDT",
    name: "Tether",
    address: ethers.getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"), // Checksummed
    decimals: 6,
    isNative: false,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: ethers.getAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F"), // Checksummed
    decimals: 18,
    isNative: false,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: ethers.getAddress("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"), // Checksummed
    decimals: 8,
    isNative: false,
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    address: ethers.getAddress("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"), // Checksummed
    decimals: 18,
    isNative: false,
  },
]

// Fee tiers
const FEE_TIERS = [
  { value: "100", label: "0.01%" },
  { value: "500", label: "0.05%" },
  { value: "3000", label: "0.3%" },
  { value: "10000", label: "1%" },
]

// Popular pools with high liquidity
const POPULAR_POOLS = [
  {
    name: "USDC/WETH 0.05%",
    token0: "USDC",
    token1: "WETH",
    fee: "500",
    tickLower: -887220,
    tickUpper: 887220,
  },
  {
    name: "USDC/WETH 0.3%",
    token0: "USDC",
    token1: "WETH",
    fee: "3000",
    tickLower: -887220,
    tickUpper: 887220,
  },
  {
    name: "USDC/USDT 0.01%",
    token0: "USDC",
    token1: "USDT",
    fee: "100",
    tickLower: -20,
    tickUpper: 20,
  },
  {
    name: "WBTC/WETH 0.3%",
    token0: "WBTC",
    token1: "WETH",
    fee: "3000",
    tickLower: -887220,
    tickUpper: 887220,
  },
  {
    name: "DAI/USDC 0.05%",
    token0: "DAI",
    token1: "USDC",
    fee: "500",
    tickLower: -20,
    tickUpper: 20,
  },
]

// Helper function to normalize number input (replace comma with period for decimal separator)
const normalizeNumberInput = (value: string): string => {
  // Replace comma with period for decimal separator
  return value.replace(/,/g, ".")
}

export default function AddLiquidityForm() {
  // State for form
  const [token0, setToken0] = useState("USDC")
  const [token1, setToken1] = useState("WETH")
  const [feeTier, setFeeTier] = useState("500") // Default to 0.05%
  const [amount0, setAmount0] = useState("")
  const [amount1, setAmount1] = useState("")
  const [slippage, setSlippage] = useState("0.5") // Default 0.5% slippage
  const [priceRange, setPriceRange] = useState("10") // Default 10% price range
  const [recipient, setRecipient] = useState(process.env.NEXT_PUBLIC_ADMIN_WALLET || "")
  const [tickLower, setTickLower] = useState<number | null>(-887220) // Default for USDC/WETH
  const [tickUpper, setTickUpper] = useState<number | null>(887220) // Default for USDC/WETH
  const [loading, setLoading] = useState(false)
  const [calculatingTicks, setCalculatingTicks] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("add")
  const [selectedPool, setSelectedPool] = useState("USDC/WETH 0.05%")
  const [detailedError, setDetailedError] = useState<string | null>(null)

  // Handle selecting a popular pool
  const handleSelectPool = (poolName: string) => {
    const pool = POPULAR_POOLS.find((p) => p.name === poolName)
    if (pool) {
      setSelectedPool(poolName)
      setToken0(pool.token0)
      setToken1(pool.token1)
      setFeeTier(pool.fee)
      setTickLower(pool.tickLower)
      setTickUpper(pool.tickUpper)

      // Log for debugging
      console.log(`Selected pool: ${poolName}, token0: ${pool.token0}, token1: ${pool.token1}`)
    }
  }

  // Handle calculating tick range
  const handleCalculateTickRange = async () => {
    if (!token0 || !token1) {
      setError("Please select both tokens")
      return
    }

    setCalculatingTicks(true)
    setError(null)
    setDetailedError(null)

    try {
      const token0Obj = TOKENS.find((t) => t.symbol === token0)
      const token1Obj = TOKENS.find((t) => t.symbol === token1)

      if (!token0Obj || !token1Obj) {
        throw new Error("Invalid token selection")
      }

      // For ETH, use WETH address
      const token0Address = token0Obj.isNative ? TOKENS.find((t) => t.symbol === "WETH")?.address : token0Obj.address
      const token1Address = token1Obj.isNative ? TOKENS.find((t) => t.symbol === "WETH")?.address : token1Obj.address

      if (!token0Address || !token1Address) {
        throw new Error("Token addresses not found")
      }

      const result = await calculateTickRange({
        token0Address,
        token1Address,
        fee: Number.parseInt(feeTier),
        priceRange: Number.parseFloat(normalizeNumberInput(priceRange)),
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to calculate tick range")
      }

      setTickLower(result.tickLower)
      setTickUpper(result.tickUpper)
    } catch (error: any) {
      console.error("Error calculating tick range:", error)
      setError(`Failed to calculate tick range: ${error.message}`)
      setDetailedError(error.stack || "No stack trace available")
    } finally {
      setCalculatingTicks(false)
    }
  }

  // Handle adding liquidity
  const handleAddLiquidity = async () => {
    if (!token0 || !token1 || !amount0 || !amount1 || !recipient) {
      setError("Please fill in all required fields")
      return
    }

    if (tickLower === null || tickUpper === null) {
      setError("Please calculate tick range first")
      return
    }

    setLoading(true)
    setError(null)
    setDetailedError(null)
    setSuccess(null)
    setTxHash(null)
    setTokenId(null)

    try {
      const token0Obj = TOKENS.find((t) => t.symbol === token0)
      const token1Obj = TOKENS.find((t) => t.symbol === token1)

      if (!token0Obj || !token1Obj) {
        throw new Error("Invalid token selection")
      }

      // For ETH, use WETH address
      const token0Address = token0Obj.isNative ? TOKENS.find((t) => t.symbol === "WETH")?.address : token0Obj.address
      const token1Address = token1Obj.isNative ? TOKENS.find((t) => t.symbol === "WETH")?.address : token1Obj.address

      if (!token0Address || !token1Address) {
        throw new Error("Token addresses not found")
      }

      // Ensure addresses are checksummed
      const checksummedToken0 = ethers.getAddress(token0Address)
      const checksummedToken1 = ethers.getAddress(token1Address)

      // Log the addresses for debugging
      console.log("Token0 Address:", checksummedToken0)
      console.log("Token1 Address:", checksummedToken1)

      // Normalize all number inputs
      const normalizedAmount0 = normalizeNumberInput(amount0)
      const normalizedAmount1 = normalizeNumberInput(amount1)
      const normalizedSlippage = normalizeNumberInput(slippage)

      // Log the parameters for debugging
      console.log("Add Liquidity Parameters:", {
        token0Address: checksummedToken0,
        token1Address: checksummedToken1,
        fee: Number.parseInt(feeTier),
        amount0: normalizedAmount0,
        amount1: normalizedAmount1,
        tickLower,
        tickUpper,
        recipient,
        slippageTolerance: Number.parseFloat(normalizedSlippage),
      })

      const result = await addLiquidityToPool({
        token0Address: checksummedToken0,
        token1Address: checksummedToken1,
        fee: Number.parseInt(feeTier),
        amount0: normalizedAmount0,
        amount1: normalizedAmount1,
        tickLower,
        tickUpper,
        recipient,
        slippageTolerance: Number.parseFloat(normalizedSlippage),
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to add liquidity")
      }

      setSuccess(`Successfully added liquidity to ${token0}/${token1} pool.`)
      setTxHash(result.txHash)
      setTokenId(result.tokenId)

      // Clear form on success
      setAmount0("")
      setAmount1("")
    } catch (error: any) {
      console.error("Error adding liquidity:", error)
      setError(`Failed to add liquidity: ${error.message}`)
      setDetailedError(error.stack || "No stack trace available")
    } finally {
      setLoading(false)
    }
  }

  // Set default recipient if empty
  useEffect(() => {
    if (!recipient && process.env.NEXT_PUBLIC_ADMIN_WALLET) {
      setRecipient(process.env.NEXT_PUBLIC_ADMIN_WALLET)
    }
  }, [recipient])

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Add Liquidity to Uniswap V3</CardTitle>
        <CardDescription className="text-zinc-400">
          Add liquidity to a Uniswap V3 pool and receive an NFT position
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 bg-zinc-800">
            <TabsTrigger value="add">Add Liquidity</TabsTrigger>
            <TabsTrigger value="info">Position Info</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Select Popular Pool</Label>
              <select
                value={selectedPool}
                onChange={(e) => handleSelectPool(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white p-2 rounded"
              >
                {POPULAR_POOLS.map((pool) => (
                  <option key={pool.name} value={pool.name}>
                    {pool.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500">Choose from popular pools with high liquidity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="token0" className="text-zinc-400">
                  Token 0
                </Label>
                <select
                  id="token0"
                  value={token0}
                  onChange={(e) => setToken0(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white p-2 rounded"
                >
                  {TOKENS.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="token1" className="text-zinc-400">
                  Token 1
                </Label>
                <select
                  id="token1"
                  value={token1}
                  onChange={(e) => setToken1(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white p-2 rounded"
                >
                  {TOKENS.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee-tier" className="text-zinc-400">
                Fee Tier
              </Label>
              <select
                id="fee-tier"
                value={feeTier}
                onChange={(e) => setFeeTier(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white p-2 rounded"
              >
                {FEE_TIERS.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500">
                Select the fee tier that matches the liquidity pool you want to use
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount0" className="text-zinc-400">
                  Amount of {token0}
                </Label>
                <Input
                  id="amount0"
                  type="text"
                  placeholder="0.0"
                  value={amount0}
                  onChange={(e) => setAmount0(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount1" className="text-zinc-400">
                  Amount of {token1}
                </Label>
                <Input
                  id="amount1"
                  type="text"
                  placeholder="0.0"
                  value={amount1}
                  onChange={(e) => setAmount1(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slippage" className="text-zinc-400">
                  Slippage Tolerance (%)
                </Label>
                <Input
                  id="slippage"
                  type="text"
                  placeholder="0.5"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-500">Maximum price difference you're willing to accept</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price-range" className="text-zinc-400">
                  Price Range (%)
                </Label>
                <Input
                  id="price-range"
                  type="text"
                  placeholder="10"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-500">
                  Price range around the current price (e.g., 10% = current price ±10%)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-zinc-400">
                Recipient Address
              </Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-zinc-500">
                Address that will receive the position NFT (default: admin wallet)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-zinc-400">Tick Range</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCalculateTickRange}
                  disabled={calculatingTicks}
                  className="bg-zinc-800 border-zinc-700 text-zinc-300"
                >
                  {calculatingTicks ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-1" />
                  )}
                  Calculate
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-md bg-zinc-800 border border-zinc-700">
                  <div className="text-xs text-zinc-400 mb-1">Lower Tick</div>
                  <div className="font-mono text-sm">{tickLower !== null ? tickLower : "Not calculated"}</div>
                </div>
                <div className="p-3 rounded-md bg-zinc-800 border border-zinc-700">
                  <div className="text-xs text-zinc-400 mb-1">Upper Tick</div>
                  <div className="font-mono text-sm">{tickUpper !== null ? tickUpper : "Not calculated"}</div>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Tick range determines the price range in which your liquidity will be active
              </p>
            </div>

            <Button
              onClick={handleAddLiquidity}
              disabled={
                loading ||
                !token0 ||
                !token1 ||
                !amount0 ||
                !amount1 ||
                !recipient ||
                tickLower === null ||
                tickUpper === null
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Liquidity...
                </>
              ) : (
                <>
                  Add Liquidity
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 rounded-md bg-red-900/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span>{error}</span>
                  {detailedError && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs">Show technical details</summary>
                      <pre className="mt-2 p-2 bg-red-950/50 rounded-md overflow-auto text-xs whitespace-pre-wrap">
                        {detailedError}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-md bg-emerald-900/50 border border-emerald-800 text-emerald-300 text-sm flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p>{success}</p>
                  {txHash && <p className="text-xs mt-1 font-mono break-all">Transaction: {txHash}</p>}
                  {tokenId && <p className="text-xs mt-1">Position NFT ID: {tokenId}</p>}
                  {txHash && (
                    <a
                      href={`https://etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs mt-2 flex items-center text-blue-400 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on Etherscan
                    </a>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="p-4 rounded-md bg-zinc-800">
              <h3 className="text-lg font-medium mb-2">About Uniswap V3 Liquidity</h3>
              <p className="text-sm text-zinc-400 mb-2">
                Uniswap V3 introduces concentrated liquidity, allowing you to provide liquidity within a specific price
                range.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Position Manager:</span>
                  <span className="text-sm font-mono">0xC36442b4a4522E871399CD717aBDD847Ab11FE88</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Documentation:</span>
                  <a
                    href="https://docs.uniswap.org/contracts/v3/reference/periphery/NonfungiblePositionManager"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    Uniswap Docs
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-md bg-zinc-800">
              <h3 className="text-lg font-medium mb-2">Popular Pools with High Liquidity</h3>
              <div className="space-y-3">
                {POPULAR_POOLS.map((pool) => (
                  <div key={pool.name} className="p-3 rounded-md bg-zinc-900 border border-zinc-800">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{pool.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectPool(pool.name)}
                        className="text-xs h-7 px-2 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                      >
                        Select
                      </Button>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {pool.token0}/{pool.token1} • Fee: {Number.parseInt(pool.fee) / 10000}% • Tick Range: [
                      {pool.tickLower}, {pool.tickUpper}]
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-md bg-amber-900/30 border border-amber-800 text-amber-300 text-sm flex items-start gap-2">
              <ExternalLink className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Important Notes</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Concentrated liquidity positions are represented as NFTs</li>
                  <li>You earn fees only when the price is within your specified range</li>
                  <li>Narrower price ranges can earn higher fees but may go out of range more often</li>
                  <li>Make sure you have approved both tokens before adding liquidity</li>
                  <li>The wallet used for adding liquidity must have sufficient token balances</li>
                  <li>The wallet must also have ETH for gas fees</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}