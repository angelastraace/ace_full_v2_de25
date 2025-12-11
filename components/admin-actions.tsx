"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"
import { sendAdminReward } from "@/lib/sendFromLiquidityPool"
import { removeAndFundAdmin } from "@/lib/removeLiquidityAndFundAdmin"

export default function AdminActions() {
  // State for environment variables check
  const [envVarsReady, setEnvVarsReady] = useState(true)

  // State for the send reward form
  const [rewardAmount, setRewardAmount] = useState("")
  const [sendingReward, setSendingReward] = useState(false)
  const [rewardResult, setRewardResult] = useState<{
    success?: boolean
    txHash?: string
    error?: string
  } | null>(null)

  // State for the remove liquidity form
  const [liquidityToRemove, setLiquidityToRemove] = useState("")
  const [ethToSend, setEthToSend] = useState("")
  const [removingLiquidity, setRemovingLiquidity] = useState(false)
  const [removeResult, setRemoveResult] = useState<{
    success?: boolean
    txHash?: string
    removedTxHash?: string
    error?: string
  } | null>(null)

  // Check if environment variables are set
  useEffect(() => {
    // In client components, we can only access NEXT_PUBLIC_ env vars
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL

    if (!rpcUrl) {
      setEnvVarsReady(false)
    }
  }, [])

  // Handle sending admin reward
  const handleSendReward = async () => {
    if (!rewardAmount || Number.parseFloat(rewardAmount) <= 0) {
      setRewardResult({
        success: false,
        error: "Please enter a valid amount",
      })
      return
    }

    setSendingReward(true)
    setRewardResult(null)

    try {
      const result = await sendAdminReward(rewardAmount)
      setRewardResult(result)
    } catch (error: any) {
      console.error("Error sending reward:", error)
      setRewardResult({
        success: false,
        error: error.message || "An unknown error occurred",
      })
    } finally {
      setSendingReward(false)
    }
  }

  // Handle removing liquidity and funding admin
  const handleRemoveAndFund = async () => {
    if (
      !liquidityToRemove ||
      !ethToSend ||
      Number.parseFloat(liquidityToRemove) <= 0 ||
      Number.parseFloat(ethToSend) <= 0
    ) {
      setRemoveResult({
        success: false,
        error: "Please enter valid amounts for both fields",
      })
      return
    }

    setRemovingLiquidity(true)
    setRemoveResult(null)

    try {
      const result = await removeAndFundAdmin({
        liquidityToRemove,
        ethToSend,
      })
      setRemoveResult(result)
    } catch (error: any) {
      console.error("Error removing liquidity:", error)
      setRemoveResult({
        success: false,
        error: error.message || "An unknown error occurred",
      })
    } finally {
      setRemovingLiquidity(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Admin Pool Actions</CardTitle>
        <CardDescription className="text-zinc-400">Manage liquidity pool funds and rewards</CardDescription>
      </CardHeader>
      <CardContent>
        {!envVarsReady && (
          <div className="p-3 mb-4 rounded-md bg-amber-900/50 border border-amber-800 text-amber-300 text-sm flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p>Environment variables not configured.</p>
              <p className="text-xs mt-1">This is a demo mode. Transactions will be simulated.</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
            <TabsTrigger value="send">Send Admin Reward</TabsTrigger>
            <TabsTrigger value="remove">Remove Liquidity</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="reward-amount" className="text-zinc-400">
                Reward Amount (ETH)
              </Label>
              <Input
                id="reward-amount"
                type="number"
                step="0.01"
                placeholder="0.1"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-zinc-500">Enter the amount of ETH to send to the admin wallet</p>
            </div>

            <Button
              onClick={handleSendReward}
              disabled={sendingReward || !rewardAmount}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {sendingReward ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Reward...
                </>
              ) : (
                "Send Admin Reward"
              )}
            </Button>

            {rewardResult && (
              <div
                className={`p-3 rounded-md ${
                  rewardResult.success
                    ? "bg-emerald-900/50 border border-emerald-800 text-emerald-300"
                    : "bg-red-900/50 border border-red-800 text-red-300"
                } text-sm flex items-start gap-2 mt-4`}
              >
                {rewardResult.success ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  {rewardResult.success ? (
                    <>
                      <p>Successfully sent reward!</p>
                      <p className="text-xs mt-1 font-mono break-all">Transaction: {rewardResult.txHash}</p>
                    </>
                  ) : (
                    <p>{rewardResult.error}</p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="remove" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="liquidity-amount" className="text-zinc-400">
                Liquidity to Remove (LP Tokens)
              </Label>
              <Input
                id="liquidity-amount"
                type="number"
                step="0.01"
                placeholder="1.0"
                value={liquidityToRemove}
                onChange={(e) => setLiquidityToRemove(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-zinc-500">Enter the amount of LP tokens to remove from the pool</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eth-amount" className="text-zinc-400">
                ETH to Send to Admin
              </Label>
              <Input
                id="eth-amount"
                type="number"
                step="0.01"
                placeholder="0.5"
                value={ethToSend}
                onChange={(e) => setEthToSend(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-zinc-500">Enter the amount of ETH to send to the admin wallet</p>
            </div>

            <Button
              onClick={handleRemoveAndFund}
              disabled={removingLiquidity || !liquidityToRemove || !ethToSend}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {removingLiquidity ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Remove Liquidity & Fund Admin"
              )}
            </Button>

            {removeResult && (
              <div
                className={`p-3 rounded-md ${
                  removeResult.success
                    ? "bg-emerald-900/50 border border-emerald-800 text-emerald-300"
                    : "bg-red-900/50 border border-red-800 text-red-300"
                } text-sm flex items-start gap-2 mt-4`}
              >
                {removeResult.success ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  {removeResult.success ? (
                    <>
                      <p>Successfully removed liquidity and sent funds!</p>
                      <p className="text-xs mt-1 font-mono break-all">Remove TX: {removeResult.removedTxHash}</p>
                      <p className="text-xs mt-1 font-mono break-all">Send TX: {removeResult.txHash}</p>
                    </>
                  ) : (
                    <p>{removeResult.error}</p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t border-zinc-800 text-zinc-400 text-sm">
        All actions are logged to Supabase for audit purposes
      </CardFooter>
    </Card>
  )
}