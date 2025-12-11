"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { executeUniswapSwap, approveTokenForRouter } from "@/app/actions/uniswap-actions"

const ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564"

const TOKENS = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    isNative: true,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ethereum",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
    isNative: false,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    isNative: false,
  },
  {
    symbol: "USDT",
    name: "Tether",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    isNative: false,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    isNative: false,
  },
]

const FEE_TIERS = [
  { value: "100", label: "0.01%" },
  { value: "500", label: "0.05%" },
  { value: "3000", label: "0.3%" },
  { value: "10000", label: "1%" },
]

const normalizeNumberInput = (value: string): string => {
  return value.replace(/,/g, ".")
}

export default function UniswapOperations() {
  const [tokenIn, setTokenIn] = useState("ETH")
  const [tokenOut, setTokenOut] = useState("USDC")
  const [feeTier, setFeeTier] = useState("500")
  const [amountIn, setAmountIn] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [recipient, setRecipient] = useState(process.env.ADMIN_WALLET || "")
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("swap")
  const [txHash, setTxHash] = useState<string | null>(null)

  const handleApproveToken = async () => {
    if (
      !amountIn ||
      isNaN(Number(normalizeNumberInput(amountIn))) ||
      Number.parseFloat(normalizeNumberInput(amountIn)) <= 0
    ) {
      setError("Please enter a valid amount")
      return
    }

    setApproving(true)
    setError(null)
    setSuccess(null)
    setTxHash(null)

    try {
      const tokenInObj = TOKENS.find((t) => t.symbol === tokenIn)
      if (!tokenInObj) {
        throw new Error(`Token ${tokenIn} not found`)
      }

      if (tokenInObj.isNative) {
        setSuccess("No approval needed for ETH")
        setApproving(false)
        return
      }

      const normalizedAmountIn = normalizeNumberInput(amountIn)

      const result = await approveTokenForRouter({
        tokenAddress: tokenInObj.address,
        amount: normalizedAmountIn,
        decimals: tokenInObj.decimals,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to approve token")
      }

      setSuccess(`Successfully approved ${tokenIn} for Uniswap Router.`)
      setTxHash(result.txHash)
    } catch (error: any) {
      console.error("Error approving token:", error)
      setError(`Failed to approve token: ${error.message}`)
    } finally {
      setApproving(false)
    }
  }

  const handleSwap = async () => {
    if (
      !amountIn ||
      isNaN(Number(normalizeNumberInput(amountIn))) ||
      Number.parseFloat(normalizeNumberInput(amountIn)) <= 0
    ) {
      setError("Please enter a valid amount")
      return
    }

    if (!recipient) {
      setError("Please enter a recipient address")
      return
    }

    const adminWallet = process.env.ADMIN_WALLET || ""
    if (recipient.toLowerCase() === adminWallet.toLowerCase()) {
      setError(
        "The admin wallet cannot be both the sender and receiver of the transaction. Please use a different wallet for one of these roles.",
      )
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setTxHash(null)

    try {
      const tokenInObj = TOKENS.find((t) => t.symbol === tokenIn)
      const tokenOutObj = TOKENS.find((t) => t.symbol === tokenOut)

      if (!tokenInObj || !tokenOutObj) {
        throw new Error("Invalid token selection")
      }

      const normalizedAmountIn = normalizeNumberInput(amountIn)
      const normalizedSlippage = normalizeNumberInput(slippage)

      const slippagePercent = Number.parseFloat(normalizedSlippage) / 100
      const amountOutMinimum = "0"

      console.log("Executing swap with parameters:", {
        tokenIn: tokenInObj.address,
        tokenOut: tokenOutObj.address,
        fee: Number.parseInt(feeTier),
        recipient,
        amountIn: normalizedAmountIn,
        decimalsIn: tokenInObj.decimals,
        decimalsOut: tokenOutObj.decimals,
        amountOutMinimum,
        isNativeIn: tokenInObj.isNative,
      })

      const result = await executeUniswapSwap({
        tokenIn: tokenInObj.address,
        tokenOut: tokenOutObj.address,
        fee: Number.parseInt(feeTier),
        recipient,
        amountIn: normalizedAmountIn,
        decimalsIn: tokenInObj.decimals,
        decimalsOut: tokenOutObj.decimals,
        amountOutMinimum,
        isNativeIn: tokenInObj.isNative,
      })

      if (!result.success) {
        throw new Error(result.error || "Swap failed")
      }

      setSuccess(
        `Successfully swapped ${amountIn} ${tokenIn} to ${tokenOut}. The tokens were sent to ${recipient}. Transaction hash: ${result.txHash}`,
      )
      setTxHash(result.txHash)
    } catch (error: any) {
      console.error("Error executing swap:", error)
      setError(`Swap failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Uniswap V3 Operations</CardTitle>
        <CardDescription className="text-zinc-400">
          Swap tokens or transfer funds using Uniswap V3 Router
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 bg-zinc-800">
            <TabsTrigger value="swap">Swap Tokens</TabsTrigger>
            <TabsTrigger value="info">Router Info</TabsTrigger>
          </TabsList>

          <TabsContent value="swap" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="token-in" className="text-zinc-400">
                    From Token
                  </Label>
                  <select
                    id="token-in"
                    value={tokenIn}
                    onChange={(e) => setTokenIn(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md p-2"
                  >
                    {TOKENS.map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token-out" className="text-zinc-400">
                    To Token
                  </Label>
                  <select
                    id="token-out"
                    value={tokenOut}
                    onChange={(e) => setTokenOut(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md p-2"
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
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md p-2"
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

              <div className="space-y-2">
                <Label htmlFor="amount-in" className="text-zinc-400">
                  Amount to Swap
                </Label>
                <Input
                  id="amount-in"
                  type="text"
                  placeholder="0.1"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-500">Enter the amount of {tokenIn} you want to swap</p>
              </div>

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
                  Address that will receive the swapped tokens (default: admin wallet)
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleApproveToken}
                  disabled={approving || tokenIn === "ETH"}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {approving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>{tokenIn === "ETH" ? "No Approval Needed" : `Approve ${tokenIn}`}</>
                  )}
                </Button>

                <Button
                  onClick={handleSwap}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Swapping...
                    </>
                  ) : (
                    <>
                      Swap {tokenIn} to {tokenOut}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-900/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-md bg-emerald-900/50 border border-emerald-800 text-emerald-300 text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span>{success}</span>
                    {txHash && <p className="text-xs mt-1 font-mono break-all">Transaction: {txHash}</p>}
                    {txHash && (
                      <a
                        href={`https://etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs mt-2 flex items-center text-blue-400 hover:underline"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        View on Etherscan
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="p-4 rounded-md bg-zinc-800">
              <h3 className="text-lg font-medium mb-2">Uniswap V3 Router</h3>
              <p className="text-sm text-zinc-400 mb-2">
                The Uniswap V3 Router is the recommended way to interact with Uniswap pools for token swaps and
                transfers.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Router Address:</span>
                  <span className="text-sm font-mono">{ROUTER_ADDRESS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Interface:</span>
                  <span className="text-sm">ISwapRouter</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Documentation:</span>
                  <a
                    href="https://docs.uniswap.org/contracts/v3/reference/periphery/interfaces/ISwapRouter"
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
              <h3 className="text-lg font-medium mb-2">Important Notes</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">⚠️</span>
                  <span>Always approve tokens before swapping (except for ETH)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">⚠️</span>
                  <span>Set a reasonable slippage tolerance to avoid price impact</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">⚠️</span>
                  <span>Choose the correct fee tier that matches the liquidity pool</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">⚠️</span>
                  <span>For direct token transfers without swaps, use ERC20 transfer instead</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}