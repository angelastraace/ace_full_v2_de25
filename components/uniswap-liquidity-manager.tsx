"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, Info } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { decreaseUniswapLiquidity, collectUniswapTokens, getPositionInfo } from "@/app/actions/uniswap-position-actions"

// Uniswap V3 NonfungiblePositionManager address
const POSITION_MANAGER_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"

export default function UniswapLiquidityManager() {
  // State for position info
  const [tokenId, setTokenId] = useState("958204") // Default to the provided token ID
  const [liquidity, setLiquidity] = useState("")
  const [liquidityToRemove, setLiquidityToRemove] = useState("")
  const [recipient, setRecipient] = useState(process.env.ADMIN_WALLET || "")
  const [positionInfo, setPositionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingPosition, setFetchingPosition] = useState(false)
  const [decreasing, setDecreasing] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("remove")

  // Fetch position information
  const fetchPositionInfo = async () => {
    if (!tokenId) {
      setError("Please enter a valid token ID")
      return
    }

    setFetchingPosition(true)
    setError(null)
    setPositionInfo(null)

    try {
      const result = await getPositionInfo(tokenId)

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch position information")
      }

      setPositionInfo(result.position)
      setLiquidity(result.position.liquidity)
    } catch (error: any) {
      console.error("Error fetching position info:", error)
      setError(`Failed to fetch position info: ${error.message}`)
    } finally {
      setFetchingPosition(false)
    }
  }

  // Handle decreasing liquidity
  const handleDecreaseLiquidity = async () => {
    if (!tokenId || !liquidityToRemove) {
      setError("Please enter a valid token ID and liquidity amount")
      return
    }

    setDecreasing(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await decreaseUniswapLiquidity({
        tokenId,
        liquidity: liquidityToRemove,
        amount0Min: "0", // In production, you should calculate this based on current price
        amount1Min: "0", // In production, you should calculate this based on current price
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to decrease liquidity")
      }

      setSuccess(`Successfully decreased liquidity. Transaction hash: ${result.txHash}`)

      // Refresh position info after decreasing liquidity
      await fetchPositionInfo()
    } catch (error: any) {
      console.error("Error decreasing liquidity:", error)
      setError(`Failed to decrease liquidity: ${error.message}`)
    } finally {
      setDecreasing(false)
    }
  }

  // Handle collecting tokens
  const handleCollectTokens = async () => {
    if (!tokenId || !recipient) {
      setError("Please enter a valid token ID and recipient address")
      return
    }

    setCollecting(true)
    setError(null)
    setSuccess(null)

    try {
      console.log(`Attempting to collect tokens for position ${tokenId} to ${recipient}`)

      const result = await collectUniswapTokens({
        tokenId,
        recipient,
      })

      console.log("Collect tokens result:", result)

      if (!result.success) {
        throw new Error(result.error || "Failed to collect tokens")
      }

      setSuccess(`Successfully collected tokens. Transaction hash: ${result.txHash}`)

      // Refresh position info after collecting tokens
      await fetchPositionInfo()
    } catch (error: any) {
      console.error("Error collecting tokens:", error)
      setError(`Failed to collect tokens: ${error.message}`)
    } finally {
      setCollecting(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Uniswap V3 Liquidity Manager</CardTitle>
        <CardDescription className="text-zinc-400">Manage your Uniswap V3 liquidity positions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 bg-zinc-800">
            <TabsTrigger value="remove">Remove Liquidity</TabsTrigger>
            <TabsTrigger value="info">Position Info</TabsTrigger>
          </TabsList>

          <TabsContent value="remove" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token-id" className="text-zinc-400">
                  Position NFT Token ID
                </Label>
                <Input
                  id="token-id"
                  placeholder="958204"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-500">Enter the NFT token ID of your Uniswap V3 position</p>
              </div>

              <Button
                onClick={fetchPositionInfo}
                disabled={fetchingPosition || !tokenId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {fetchingPosition ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching Position...
                  </>
                ) : (
                  "Fetch Position Info"
                )}
              </Button>

              {positionInfo && (
                <div className="p-4 rounded-md bg-zinc-800 space-y-3">
                  <h3 className="text-lg font-medium">Position Information</h3>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-zinc-400">Token 0</p>
                      <p className="text-sm font-medium">{positionInfo.token0Symbol}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Token 1</p>
                      <p className="text-sm font-medium">{positionInfo.token1Symbol}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-400">Fee Tier</p>
                    <p className="text-sm font-medium">{positionInfo.fee / 10000}%</p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-400">Liquidity</p>
                    <p className="text-sm font-medium">{positionInfo.liquidity}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-zinc-400">Token 0 Owed</p>
                      <p className="text-sm font-medium">{positionInfo.tokensOwed0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Token 1 Owed</p>
                      <p className="text-sm font-medium">{positionInfo.tokensOwed1}</p>
                    </div>
                  </div>
                </div>
              )}

              {positionInfo && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="liquidity-to-remove" className="text-zinc-400">
                      Liquidity to Remove
                    </Label>
                    <Input
                      id="liquidity-to-remove"
                      placeholder={positionInfo.liquidity}
                      value={liquidityToRemove}
                      onChange={(e) => setLiquidityToRemove(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <div className="flex justify-between">
                      <p className="text-xs text-zinc-500">Enter the amount of liquidity to remove</p>
                      <button
                        className="text-xs text-blue-400 hover:underline"
                        onClick={() => setLiquidityToRemove(positionInfo.liquidity)}
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleDecreaseLiquidity}
                    disabled={decreasing || !liquidityToRemove}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {decreasing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Decreasing Liquidity...
                      </>
                    ) : (
                      "Decrease Liquidity"
                    )}
                  </Button>

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
                      Address that will receive the collected tokens (default: admin wallet)
                    </p>
                  </div>

                  <Button
                    onClick={handleCollectTokens}
                    disabled={collecting || !recipient}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {collecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Collecting Tokens...
                      </>
                    ) : (
                      <>
                        Collect Tokens
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </>
              )}

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
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="p-4 rounded-md bg-zinc-800">
              <h3 className="text-lg font-medium mb-2">Uniswap V3 Position Manager</h3>
              <p className="text-sm text-zinc-400 mb-2">
                The Uniswap V3 NonfungiblePositionManager is used to manage liquidity positions in Uniswap V3 pools.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Position Manager Address:</span>
                  <span className="text-sm font-mono">{POSITION_MANAGER_ADDRESS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Interface:</span>
                  <span className="text-sm">INonfungiblePositionManager</span>
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
              <h3 className="text-lg font-medium mb-2">How to Remove Liquidity</h3>
              <div className="space-y-3 text-sm text-zinc-400">
                <div className="flex items-start gap-2">
                  <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>Fetch your position information using your NFT token ID</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>Decrease liquidity by specifying how much liquidity to remove</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>Collect the tokens by specifying the recipient address</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-md bg-amber-900/30 border border-amber-800 text-amber-300 text-sm flex items-start gap-2">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Important Notes</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Decreasing liquidity doesn't automatically send tokens to your wallet</li>
                  <li>You must collect tokens after decreasing liquidity</li>
                  <li>Set reasonable minimum amounts to protect against slippage</li>
                  <li>Make sure you're the owner of the position NFT</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}