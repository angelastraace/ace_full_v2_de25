"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, ExternalLink, Info } from "lucide-react"
import { sendAdminReward } from "@/app/actions/blockchain-actions"
import { transferTokenFromPool } from "@/app/actions/token-transfer-actions"
import { fundAdminWithUSDC } from "@/app/actions/fund-admin-usdc"

const SUPPORTED_TOKENS = [
  {
    id: "ETH",
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    address: null,
  },
  {
    id: "USDC",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  {
    id: "DAI",
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  {
    id: "USDT",
    name: "Tether",
    symbol: "USDT",
    decimals: 6,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
]

const normalizeNumberInput = (value: string): string => {
  return value.replace(/,/g, ".")
}

interface SimpleFundAdminProps {
  adminWalletAddress: string
}

export default function SimpleFundAdmin({ adminWalletAddress }: SimpleFundAdminProps) {
  const [amount, setAmount] = useState("")
  const [crypto, setCrypto] = useState("ETH")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    txHash?: string
    explorerUrl?: string
    method?: string
  } | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleFundClick = async () => {
    if (
      !amount ||
      isNaN(Number(normalizeNumberInput(amount))) ||
      Number.parseFloat(normalizeNumberInput(amount)) <= 0
    ) {
      setResult({
        success: false,
        message: "Please enter a valid amount.",
      })
      return
    }

    setLoading(true)
    setResult(null)
    setApiError(null)

    try {
      let response
      const selectedToken = SUPPORTED_TOKENS.find((token) => token.id === crypto)

      if (!selectedToken) {
        throw new Error(`Unsupported token: ${crypto}`)
      }

      setResult({
        success: true,
        message: `Processing transfer of ${amount} ${crypto} to admin wallet...`,
      })

      const normalizedAmount = normalizeNumberInput(amount)

      if (crypto === "ETH") {
        response = await sendAdminReward(normalizedAmount)
      } else if (crypto === "USDC") {
        response = await fundAdminWithUSDC(normalizedAmount)
      } else {
        response = await transferTokenFromPool(crypto, normalizedAmount)
      }

      console.log(`${crypto} transfer response:`, response)

      if (!response) {
        throw new Error("No response received from the server. Please check your network connection.")
      }

      if (response.success) {
        const explorerUrl = response.explorerUrl || `https://etherscan.io/tx/${response.txHash}`

        let successMessage = `Successfully sent ${amount} ${crypto} to admin wallet.`
        if (response.method) {
          successMessage += ` (using ${response.method} method)`
        }

        setResult({
          success: true,
          message: successMessage,
          txHash: response.txHash,
          explorerUrl,
          method: response.method,
        })
        setAmount("")
      } else {
        throw new Error(response.error || "Unknown error occurred during transfer")
      }
    } catch (error) {
      console.error("Error funding admin wallet:", error)
      setApiError(error.message)
      setResult({
        success: false,
        message: `Failed to fund admin wallet: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
      <h2 className="text-lg font-medium text-white">Fund Admin Wallet</h2>

      <div className="space-y-2">
        <Label htmlFor="crypto-select" className="text-zinc-400">
          Cryptocurrency
        </Label>
        <select
          id="crypto-select"
          value={crypto}
          onChange={(e) => setCrypto(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md p-2"
        >
          {SUPPORTED_TOKENS.map((token) => (
            <option key={token.id} value={token.id}>
              {token.name} ({token.symbol})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount-input" className="text-zinc-400">
          Amount
        </Label>
        <Input
          id="amount-input"
          type="text"
          placeholder="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white"
        />
        <p className="text-xs text-zinc-500">Enter the amount of {crypto} to send to the admin wallet</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-address" className="text-zinc-400">
          Admin Wallet Address
        </Label>
        <Input
          id="admin-address"
          type="text"
          value={adminWalletAddress}
          readOnly
          className="bg-zinc-800 border-zinc-700 text-white font-mono text-xs"
        />
      </div>

      {crypto !== "ETH" && (
        <div className="p-3 rounded-md bg-blue-900/30 border border-blue-800 text-blue-300 text-sm flex items-start gap-2">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p>Using specialized token transfer method to fund admin wallet from the liquidity pool.</p>
            <p className="text-xs mt-1">Make sure your liquidity pool has sufficient {crypto} balance.</p>
          </div>
        </div>
      )}

      <Button
        onClick={handleFundClick}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Fund Admin Wallet with ${crypto}`
        )}
      </Button>

      {result && (
        <div
          className={`p-3 rounded-md ${
            result.success
              ? "bg-emerald-900/50 border border-emerald-800 text-emerald-300"
              : "bg-red-900/50 border border-red-800 text-red-300"
          } text-sm flex items-start gap-2`}
        >
          {result.success ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p>{result.message}</p>
            {result.txHash && <p className="text-xs mt-1 font-mono break-all">Transaction: {result.txHash}</p>}
            {result.explorerUrl && (
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs mt-2 flex items-center text-blue-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on blockchain explorer
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}