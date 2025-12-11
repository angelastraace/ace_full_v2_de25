"use client"

import { useState, useRef, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCw, AlertCircle, Save, Check } from "lucide-react"
import { getEnhancedPoolInfo, getTokenUsdValue, createTokenCache } from "@/utils/pool-utils"

// Create a persistent token cache
const tokenCache = createTokenCache()

// Default public RPC endpoints as fallbacks
const PUBLIC_RPC_ENDPOINTS = [
  "https://eth.llamarpc.com",
  "https://rpc.ankr.com/eth",
  "https://ethereum.publicnode.com",
  "https://1rpc.io/eth",
]

// Default ABIs for common pool types
const POOL_ABIS = {
  uniswapV2: [
    "function getReserves() view returns (uint112, uint112, uint32)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function totalSupply() view returns (uint256)",
    "event Sync(uint112 reserve0, uint112 reserve1)",
  ],
  uniswapV2Legacy: [
    "function getReserves() view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function totalSupply() view returns (uint256)",
    "event Sync(uint112 reserve0, uint112 reserve1)",
  ],
  minimal: [
    "function getReserves() view returns (uint112, uint112, uint32)",
    "event Sync(uint112 reserve0, uint112 reserve1)",
  ],
}

// Local storage key for enhanced pool settings
const ENHANCED_POOL_SETTINGS_KEY = "enhancedPoolSettings"

export default function EnhancedPoolReserves() {
  const [rpcUrl, setRpcUrl] = useState(process.env.NEXT_PUBLIC_RPC_URL || "")
  const [poolAddress, setPoolAddress] = useState("")
  const [poolData, setPoolData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [pollingInterval, setPollingInterval] = useState(null)
  const poolContractRef = useRef(null)

  // Load saved connection settings on component mount
  useEffect(() => {
    const loadSavedSettings = () => {
      try {
        const savedSettings = localStorage.getItem(ENHANCED_POOL_SETTINGS_KEY)
        if (savedSettings) {
          const { rpcUrl: savedRpcUrl, poolAddress: savedPoolAddress } = JSON.parse(savedSettings)
          setRpcUrl(savedRpcUrl || process.env.NEXT_PUBLIC_RPC_URL || "")
          setPoolAddress(savedPoolAddress || "")

          // If we have saved settings, automatically fetch data
          if (savedRpcUrl && savedPoolAddress) {
            fetchPoolData(savedRpcUrl, savedPoolAddress)
          }
        }
      } catch (error) {
        console.error("Error loading saved settings:", error)
      }
    }

    loadSavedSettings()

    // Cleanup event listeners and polling on unmount
    return () => {
      if (poolContractRef.current) {
        poolContractRef.current.removeAllListeners()
      }
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [])

  const fetchPoolData = async (url = rpcUrl, address = poolAddress) => {
    if (!url || !address) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError(null)

    // Check if the URL contains a placeholder API key
    if (url.includes("your-api-key")) {
      setError("Please replace 'your-api-key' with a valid API key in the RPC URL")
      setLoading(false)
      return
    }

    // Try multiple RPC providers if the main one fails
    const providers = [url, ...PUBLIC_RPC_ENDPOINTS]
    let success = false

    for (const providerUrl of providers) {
      if (success) break

      try {
        const provider = new ethers.JsonRpcProvider(providerUrl, undefined, {
          staticNetwork: true,
          polling: false,
          batchStallTime: 0,
        })

        // Test the connection first
        await provider.getBlockNumber()

        // Try different ABIs for compatibility
        let pool = null
        let poolInfo = null
        const abiOptions = Object.keys(POOL_ABIS)
        let abiKeyUsed = null

        for (const abiKey in POOL_ABIS) {
          const abi = POOL_ABIS[abiKey]
          try {
            pool = new ethers.Contract(address, abi, provider)
            poolInfo = await getEnhancedPoolInfo(pool, provider, tokenCache)

            if (poolInfo) {
              success = true
              abiKeyUsed = abiKey
              break
            }
          } catch (e) {
            console.warn(`ABI attempt (${abiKey}) failed: ${e.message}`)
            // Continue to next ABI
          }
        }

        if (poolInfo) {
          setPoolData(poolInfo)

          // If we're using a fallback provider, update the UI but don't save it
          if (providerUrl !== url) {
            console.log(`Using fallback provider: ${providerUrl}`)
            setError(`Note: Using fallback provider due to connection issues with primary RPC`)
          }

          // If we used a different ABI than what was initially attempted, let the user know
          if (abiKeyUsed && abiOptions.indexOf(abiKeyUsed) > 0) {
            setError("Note: Used a different ABI format to successfully fetch data.")
          }

          // Save the successful settings
          saveConnectionSettings(url, address)
          break
        }
      } catch (error) {
        console.error(`Error with provider ${providerUrl}:`, error)
        // Continue to next provider
      }
    }

    if (!success) {
      setError(
        "Failed to connect to any RPC provider or retrieve pool data. Please check your connection and try again.",
      )
    }

    setLoading(false)
  }

  const startListening = async () => {
    if (!rpcUrl || !poolAddress) {
      setError("Please fill in all required fields")
      return
    }

    try {
      // First fetch initial data
      await fetchPoolData()

      // Try to set up event listener
      let listenerSuccess = false

      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl)

        // Try different ABIs for the event listener
        for (const abiKey in POOL_ABIS) {
          try {
            const pool = new ethers.Contract(poolAddress, POOL_ABIS[abiKey], provider)

            // Test if we can get reserves with this ABI
            await pool.getReserves()

            poolContractRef.current = pool

            // Set up event listener
            pool.on("Sync", async (reserve0, reserve1) => {
              try {
                if (!poolData) return // Skip if no initial data

                // Get token addresses (we already have them in poolData)
                const token0Address = poolData.tokens.token0.address
                const token1Address = poolData.tokens.token1.address

                // Format reserves using cached decimals
                const formattedReserve0 = ethers.formatUnits(reserve0, poolData.tokens.token0.decimals)
                const formattedReserve1 = ethers.formatUnits(reserve1, poolData.tokens.token1.decimals)

                // Calculate USD values
                const usdValue0 = await getTokenUsdValue(token0Address, formattedReserve0)
                const usdValue1 = await getTokenUsdValue(token1Address, formattedReserve1)

                // Update state with new reserves
                setPoolData((prevData) => ({
                  ...prevData,
                  lastUpdated: new Date().toISOString(),
                  tokens: {
                    token0: {
                      ...prevData.tokens.token0,
                      reserves: {
                        raw: reserve0.toString(),
                        formatted: formattedReserve0,
                        usdValue: usdValue0,
                      },
                    },
                    token1: {
                      ...prevData.tokens.token1,
                      reserves: {
                        raw: reserve1.toString(),
                        formatted: formattedReserve1,
                        usdValue: usdValue1,
                      },
                    },
                  },
                  metrics: {
                    totalLiquidityUsd: usdValue0 + usdValue1,
                    ratio: Number(formattedReserve0) / Number(formattedReserve1) || 0,
                  },
                }))
              } catch (error) {
                console.error("Error processing Sync event:", error)
              }
            })

            listenerSuccess = true
            break
          } catch (e) {
            console.warn(`Failed to set up listener with ${abiKey} ABI:`, e)
            // Try next ABI
          }
        }
      } catch (error) {
        console.error("Error setting up event listener:", error)
        listenerSuccess = false
      }

      // If event listener failed, fall back to polling
      if (!listenerSuccess) {
        console.log("Event listener failed, falling back to polling")

        // Set up polling as a fallback
        const interval = setInterval(() => {
          fetchPoolData()
        }, 15000) // Poll every 15 seconds

        setPollingInterval(interval)
      }

      setIsListening(true)
    } catch (error) {
      console.error("Error starting updates:", error)
      setError(error.message)
    }
  }

  const stopListening = () => {
    if (poolContractRef.current) {
      poolContractRef.current.removeAllListeners()
      poolContractRef.current = null
    }

    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }

    setIsListening(false)
  }

  // Save connection settings to localStorage
  const saveConnectionSettings = (url = rpcUrl, address = poolAddress) => {
    setIsSaving(true)

    try {
      const settings = {
        rpcUrl: url,
        poolAddress: address,
      }

      localStorage.setItem(ENHANCED_POOL_SETTINGS_KEY, JSON.stringify(settings))

      // Show success indicator
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="w-full bg-zinc-900 text-white border-zinc-800">
      <CardHeader>
        <CardTitle>Enhanced Pool Monitor</CardTitle>
        <CardDescription className="text-zinc-400">
          Monitor liquidity pool reserves with real-time updates and token information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input fields */}
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

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => fetchPoolData()}
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Fetch Once
              </>
            )}
          </Button>

          <Button
            onClick={() => saveConnectionSettings()}
            disabled={isSaving || (!rpcUrl && !poolAddress)}
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

          {!isListening ? (
            <Button
              onClick={startListening}
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Start Updates
            </Button>
          ) : (
            <Button onClick={stopListening} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              Stop Updates
            </Button>
          )}
        </div>

        {/* Display pool data */}
        {poolData && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-md bg-zinc-800">
                <div className="text-sm text-zinc-400 mb-1">{poolData.tokens.token0.symbol}</div>
                <div className="text-xl font-bold">
                  {Number(poolData.tokens.token0.reserves.formatted).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </div>
                <div className="text-sm text-emerald-400 mt-1">
                  $
                  {poolData.tokens.token0.reserves.usdValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-zinc-500 mt-1 truncate">{poolData.tokens.token0.address}</div>
              </div>

              <div className="p-4 rounded-md bg-zinc-800">
                <div className="text-sm text-zinc-400 mb-1">{poolData.tokens.token1.symbol}</div>
                <div className="text-xl font-bold">
                  {Number(poolData.tokens.token1.reserves.formatted).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </div>
                <div className="text-sm text-emerald-400 mt-1">
                  $
                  {poolData.tokens.token1.reserves.usdValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-zinc-500 mt-1 truncate">{poolData.tokens.token1.address}</div>
              </div>
            </div>

            <div className="p-4 rounded-md bg-zinc-800">
              <div className="text-sm text-zinc-400 mb-1">Total Liquidity</div>
              <div className="text-xl font-bold">
                $
                {poolData.metrics.totalLiquidityUsd.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-sm text-zinc-400 mt-1">
                Ratio: 1 {poolData.tokens.token0.symbol} = {poolData.metrics.ratio.toFixed(6)}{" "}
                {poolData.tokens.token1.symbol}
              </div>
            </div>

            <div className="text-xs text-zinc-500 text-right">
              Last updated: {new Date(poolData.lastUpdated).toLocaleString()}
            </div>

            {isListening && (
              <div className="mt-2 text-xs text-emerald-400 flex items-center">
                <span className="h-2 w-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                {pollingInterval ? "Polling for updates..." : "Listening for real-time updates..."}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-md bg-red-900/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}