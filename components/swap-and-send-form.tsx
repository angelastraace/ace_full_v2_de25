"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, Info, Plus } from "lucide-react"
import { swapAndSendToAdmin } from "@/app/actions/swap-and-send-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Common tokens
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
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8,
    isNative: false,
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
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

const POPULAR_POOLS = [
  {
    name: "USDC/WETH 0.05%",
    tokenIn: "USDC",
    tokenOut: "WETH",
    fee: "500",
  },
  {
    name: "USDC/WETH 0.3%",
    tokenIn: "USDC",
    tokenOut: "WETH",
    fee: "3000",
  },
  {
    name: "USDC/USDT 0.01%",
    tokenIn: "USDC",
    tokenOut: "USDT",
    fee: "100",
  },
  {
    name: "WBTC/WETH 0.3%",
    tokenIn: "WBTC",
    tokenOut: "WETH",
    fee: "3000",
  },
  {
    name: "DAI/USDC 0.05%",
    tokenIn: "DAI",
    tokenOut: "USDC",
    fee: "500",
  },
]

const normalizeNumberInput = (value: string): string => {
  return value.replace(/,/g, ".")
}

export default function SwapAndSendForm() {
  const [tokenIn, setTokenIn] = useState("USDC")
  const [tokenOut, setTokenOut] = useState("ETH")
  const [feeTier, setFeeTier] = useState("500")
  const [amount, setAmount] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [selectedPool, setSelectedPool] = useState("USDC/WETH 0.05%")
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [customTokenSymbol, setCustomTokenSymbol] = useState("")
  const [customTokenDecimals, setCustomTokenDecimals] = useState("18")
  const [isAddingCustomToken, setIsAddingCustomToken] = useState(false)
  const [customTokens, setCustomTokens] = useState<typeof TOKENS>([])

  const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET || ""

  const handleSelectPool = (poolName: string) => {
    const pool = POPULAR_POOLS.find((p) => p.name === poolName)
    if (pool) {
      setSelectedPool(poolName)
      setTokenIn(pool.tokenIn)
      setTokenOut(pool.tokenOut)
      setFeeTier(pool.fee)
      console.log(`Selected pool: ${poolName}, tokenIn: ${pool.tokenIn}, tokenOut: ${pool.tokenOut}`)
    }
  }

  const handleAddCustomToken = () => {
    if (!customTokenAddress || !customTokenSymbol || !customTokenDecimals) {
      setError("Please fill in all custom token fields")
      return
    }

    const newToken = {
      symbol: customTokenSymbol,
      name: `Custom ${customTokenSymbol}`,
      address: customTokenAddress,
      decimals: Number.parseInt(customTokenDecimals),
      isNative: false,
    }

    setCustomTokens([...customTokens, newToken])
    setCustomTokenAddress("")
    setCustomTokenSymbol("")
    setCustomTokenDecimals("18")
    setIsAddingCustomToken(false)
  }

  const handleSwapAndSend = async () => {
    if (!tokenIn || !tokenOut || !amount) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setTxHash(null)

    try {
      const allTokens = [...TOKENS, ...customTokens]
      const tokenInObj = allTokens.find((t) => t.symbol === tokenIn)
      const tokenOutObj = allTokens.find((t) => t.symbol === tokenOut)

      if (!tokenInObj || !tokenOutObj) {
        throw new Error("Invalid token selection")
      }

      const tokenInAddress = tokenInObj.isNative
        ? allTokens.find((t) => t.symbol === "WETH")?.address
        : tokenInObj.address
      const tokenOutAddress = tokenOutObj.isNative
        ? allTokens.find((t) => t.symbol === "WETH")?.address
        : tokenOutObj.address

      if (!tokenInAddress || !tokenOutAddress) {
        throw new Error("Token addresses not found")
      }

      const normalizedAmount = normalizeNumberInput(amount)

      const result = await swapAndSendToAdmin({
        tokenInAddress,
        tokenOutAddress,
        fee: Number.parseInt(feeTier),
        amount: normalizedAmount,
        decimalsIn: tokenInObj.decimals,
        decimalsOut: tokenOutObj.decimals,
        slippageTolerance: Number.parseFloat(normalizeNumberInput(slippage)),
        isNativeIn: tokenInObj.isNative,
        isNativeOut: tokenOutObj.isNative,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to swap and send")
      }

      setSuccess(`Successfully swapped ${amount} ${tokenIn} to ${tokenOut} and sent to admin wallet.`)
      setTxHash(result.txHash)
      setAmount("")
    } catch (error: any) {
      console.error("Error swapping and sending:", error)
      setError(`Failed to swap and send: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Swap and Send to Admin</CardTitle>
        <CardDescription className="text-zinc-400">
          Swap tokens from liquidity pool and send to admin wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-zinc-400">Select Popular Pool</Label>
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
                  {pool.tokenIn}/{pool.tokenOut} • Fee: {Number.parseInt(pool.fee) / 10000}%
                </div>
              </div>
            ))}
          </div>
        </div>

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
              {[...TOKENS, ...customTokens].map((token) => (
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
              {[...TOKENS, ...customTokens].map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Dialog open={isAddingCustomToken} onOpenChange={setIsAddingCustomToken}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-zinc-800 border-zinc-700 text-zinc-300"
              onClick={() => setIsAddingCustomToken(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Token
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 text-white border-zinc-700">
            <DialogHeader>
              <DialogTitle>Add Custom Token</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Enter the details of the custom token you want to add
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
                  value={customTokenAddress}
                  onChange={(e) => setCustomTokenAddress(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token-symbol" className="text-zinc-300">
                  Token Symbol
                </Label>
                <Input
                  id="token-symbol"
                  placeholder="TOKEN"
                  value={customTokenSymbol}
                  onChange={(e) => setCustomTokenSymbol(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token-decimals" className="text-zinc-300">
                  Token Decimals
                </Label>
                <Input
                  id="token-decimals"
                  placeholder="18"
                  value={customTokenDecimals}
                  onChange={(e) => setCustomTokenDecimals(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddingCustomToken(false)}
                className="border-zinc-700 text-zinc-300"
              >
                Cancel
              </Button>
              <Button onClick={handleAddCustomToken} className="bg-emerald-600 hover:bg-emerald-700">
                Add Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
          <p className="text-xs text-zinc-500">Select the fee tier that matches the liquidity pool you want to use</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-zinc-400">
            Amount to Swap
          </Label>
          <Input
            id="amount"
            type="text"
            placeholder="0.1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
          <Label htmlFor="admin-wallet" className="text-zinc-400">
            Admin Wallet Address
          </Label>
          <Input
            id="admin-wallet"
            value={adminWallet}
            readOnly
            className="bg-zinc-800 border-zinc-700 text-white font-mono text-xs"
          />
          <p className="text-xs text-zinc-500">The swapped tokens will be sent to this admin wallet address</p>
        </div>

        <div className="p-3 rounded-md bg-blue-900/30 border border-blue-800 text-blue-300 text-sm flex items-start gap-2">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p>This operation will:</p>
            <ol className="list-decimal pl-5 mt-1 space-y-1">
              <li>
                Swap {tokenIn} to {tokenOut} using Uniswap V3
              </li>
              <li>Send the resulting {tokenOut} to the admin wallet</li>
              <li>All in a single transaction for maximum efficiency</li>
            </ol>
          </div>
        </div>

        <Button
          onClick={handleSwapAndSend}
          disabled={loading || !tokenIn || !tokenOut || !amount}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Swap {tokenIn} to {tokenOut} and Send to Admin
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

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
              <p>{success}</p>
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
      </CardContent>
    </Card>
  )
}