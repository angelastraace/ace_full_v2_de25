"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { getLpPosition } from "@/app/actions/get-lp-position"
import { withdrawLiquidity } from "@/app/actions/withdraw-liquidity"

const TOKEN_PAIRS = [{ label: "DAI / USDC", tokenId: "958204" }]

export default function FundingDashboard() {
  const [selectedPairId, setSelectedPairId] = useState(TOKEN_PAIRS[0].tokenId)
  const [selectedPair, setSelectedPair] = useState(TOKEN_PAIRS[0])
  const [positionData, setPositionData] = useState<any>(null)
  const [amountToWithdraw, setAmountToWithdraw] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingPosition, setFetchingPosition] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [txHashes, setTxHashes] = useState<{ tx1: string; tx2: string } | null>(null)

  const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET || ""

  useEffect(() => {
    const pair = TOKEN_PAIRS.find((p) => p.tokenId === selectedPairId)
    if (pair) {
      setSelectedPair(pair)
      fetchPosition(pair.tokenId)
    }
  }, [selectedPairId])

  const fetchPosition = async (tokenId: string) => {
    setFetchingPosition(true)
    setError(null)
    setPositionData(null)

    try {
      const result = await getLpPosition(tokenId)

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch position information")
      }

      setPositionData(result.data)
    } catch (error: any) {
      console.error("Error fetching position info:", error)
      setError(`Failed to fetch position info: ${error.message}`)
    } finally {
      setFetchingPosition(false)
    }
  }

  const handleWithdraw = async () => {
    if (!selectedPair.tokenId) {
      setError("Please select a token pair")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setTxHashes(null)

    try {
      const liquidityAmount = amountToWithdraw.trim() !== "" ? amountToWithdraw : "0"

      const result = await withdrawLiquidity({
        tokenId: selectedPair.tokenId,
        recipient: adminWallet,
        liquidityAmount,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to withdraw liquidity")
      }

      setSuccess(`Successfully withdrew liquidity and collected tokens to admin wallet.`)
      setTxHashes({ tx1: result.tx1, tx2: result.tx2 })

      await fetchPosition(selectedPair.tokenId)
    } catch (error: any) {
      console.error("Error withdrawing liquidity:", error)
      setError(`Failed to withdraw liquidity: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">LP Funding Dashboard</CardTitle>
        <CardDescription className="text-zinc-400">
          Withdraw liquidity from LP positions and fund the admin wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token-pair" className="text-zinc-400">
            Select Token Pair
          </Label>
          <select
            id="token-pair"
            value={selectedPairId}
            onChange={(e) => setSelectedPairId(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md p-2"
          >
            {TOKEN_PAIRS.map((pair) => (
              <option key={pair.tokenId} value={pair.tokenId}>
                {pair.label}
              </option>
            ))}
          </select>
        </div>

        {fetchingPosition ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : positionData ? (
          <div className="p-4 rounded-md bg-zinc-800 space-y-3">
            <h3 className="text-lg font-medium">Position Information</h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-zinc-400">Token 0</p>
                <p className="text-sm font-medium">
                  {positionData.token0.symbol} ({positionData.token0.name})
                </p>
                <p className="text-xs text-zinc-500 truncate">{positionData.token0.address}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Token 1</p>
                <p className="text-sm font-medium">
                  {positionData.token1.symbol} ({positionData.token1.name})
                </p>
                <p className="text-xs text-zinc-500 truncate">{positionData.token1.address}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-zinc-400">Liquidity</p>
              <p className="text-sm font-medium">{positionData.liquidity}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-zinc-400">Token 0 Owed</p>
                <p className="text-sm font-medium">
                  {positionData.tokensOwed0} {positionData.token0.symbol}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Token 1 Owed</p>
                <p className="text-sm font-medium">
                  {positionData.tokensOwed1} {positionData.token1.symbol}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-zinc-400">Owner</p>
              <p className="text-sm font-medium truncate">{positionData.owner}</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-3 rounded-md bg-red-900/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="amount-to-withdraw" className="text-zinc-400">
            Amount to Withdraw (Optional)
          </Label>
          <Input
            id="amount-to-withdraw"
            placeholder="Leave empty to withdraw all liquidity"
            value={amountToWithdraw}
            onChange={(e) => setAmountToWithdraw(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <p className="text-xs text-zinc-500">
            Enter the specific amount of liquidity to withdraw, or leave empty to withdraw all
          </p>
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
        </div>

        <Button
          onClick={handleWithdraw}
          disabled={loading || !positionData || positionData.liquidity === "0"}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Withdraw to Admin Wallet"
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
              {txHashes && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center">
                    <span className="text-xs mr-2">Decrease Liquidity TX:</span>
                    <a
                      href={`https://etherscan.io/tx/${txHashes.tx1}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center text-blue-400 hover:underline"
                    >
                      {txHashes.tx1.substring(0, 10)}...{txHashes.tx1.substring(txHashes.tx1.length - 8)}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs mr-2">Collect Tokens TX:</span>
                    <a
                      href={`https://etherscan.io/tx/${txHashes.tx2}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center text-blue-400 hover:underline"
                    >
                      {txHashes.tx2.substring(0, 10)}...{txHashes.tx2.substring(txHashes.tx2.length - 8)}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}