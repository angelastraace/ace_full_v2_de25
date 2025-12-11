"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, Info } from "lucide-react"
import { fundAdminWallet } from "@/app/actions/fund-admin-actions"

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

export default function FundAdminWallet() {
  const [token, setToken] = useState("ETH")
  const [amount, setAmount] = useState("")
  const [sourceAddress, setSourceAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET || ""

  const handleFundAdmin = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (!sourceAddress) {
      setError("Please enter a source address")
      return
    }

    if (sourceAddress.toLowerCase() === adminWallet.toLowerCase()) {
      setError("Source address cannot be the same as admin wallet")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const tokenObj = TOKENS.find((t) => t.symbol === token)
      if (!tokenObj) {
        throw new Error(`Token ${token} not found`)
      }

      const result = await fundAdminWallet({
        tokenSymbol: token,
        amount,
        sourceAddress,
        tokenAddress: tokenObj.address,
        decimals: tokenObj.decimals,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to fund admin wallet")
      }

      setSuccess(`Successfully funded admin wallet with ${amount} ${token}. Transaction hash: ${result.txHash}`)
      setAmount("")
      setSourceAddress("")
    } catch (error: any) {
      console.error("Error funding admin wallet:", error)
      setError(`Failed to fund admin wallet: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Fund Admin Wallet</CardTitle>
        <CardDescription className="text-zinc-400">
          Send funds to the admin wallet from a different source
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-md bg-blue-900/30 border border-blue-800 text-blue-300 text-sm flex items-start gap-2">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p>Admin Wallet Address:</p>
            <p className="font-mono text-xs mt-1">{adminWallet}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="token" className="text-zinc-400">
            Token
          </Label>
          <select
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
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
          <Label htmlFor="amount" className="text-zinc-400">
            Amount
          </Label>
          <Input
            id="amount"
            type="text"
            placeholder="0.1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <p className="text-xs text-zinc-500">Enter the amount of {token} to send to the admin wallet</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source-address" className="text-zinc-400">
            Source Address
          </Label>
          <Input
            id="source-address"
            placeholder="0x..."
            value={sourceAddress}
            onChange={(e) => setSourceAddress(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <p className="text-xs text-zinc-500">
            Address that will send the funds (must be different from admin wallet)
          </p>
        </div>

        <div className="p-3 rounded-md bg-amber-900/30 border border-amber-800 text-amber-300 text-sm flex items-start gap-2">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p>Important Note</p>
            <p className="text-xs mt-1">
              The source address must have sufficient balance and the private key must be configured in the server
              environment variables to sign the transaction.
            </p>
          </div>
        </div>

        <Button
          onClick={handleFundAdmin}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Fund Admin Wallet
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
            <span>{success}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}