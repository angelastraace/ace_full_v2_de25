"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCw, AlertCircle, Save, Check } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

// Default public RPC endpoints as fallbacks
const PUBLIC_RPC_ENDPOINTS = [
  "https://eth.llamarpc.com",
  "https://rpc.ankr.com/eth",
  "https://ethereum.publicnode.com",
  "https://1rpc.io/eth",
]

// Default ABIs for common pool types
const DEFAULT_ABIS = {
  uniswapV2: `[
    {"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},
    {"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},
    {"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}
  ]`,
  uniswapV3: `[
    {"inputs":[],"name":"slot0","outputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"uint16","name":"observationIndex","type":"uint16"},{"internalType":"uint16","name":"observationCardinality","type":"uint16"},{"internalType":"uint16","name":"observationCardinalityNext","type":"uint16"},{"internalType":"uint8","name":"feeProtocol","type":"uint8"},{"internalType":"bool","name":"unlocked","type":"bool"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"liquidity","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"fee","outputs":[{"internalType":"uint24","name":"","type":"uint24"}],"stateMutability":"view","type":"function"}
  ]`,
  sushiswap: `[
    {"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"reserve0","type":"uint112"},{"internalType":"uint112","name":"reserve1","type":"uint112"},{"internalType":"uint32","name":"blockTimestampLast","type":"uint32"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}
  ]`,
  minimal: `[
    {"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"","type":"uint112"},{"internalType":"uint112","name":"","type":"uint112"},{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"}
  ]`,
  uniswapV2Legacy: `[
    {"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"}
  ]`,
}

// Local storage key for pool reserves settings
const POOL_RESERVES_SETTINGS_KEY = "poolReservesSettings"

export default function PoolReserves() {
  const [rpcUrl, setRpcUrl] = useState(process.env.NEXT_PUBLIC_RPC_URL || "")
  const [privateKey, setPrivateKey] = useState("")
  const [poolAddress, setPoolAddress] = useState("")
  const [poolAbi, setPoolAbi] = useState(DEFAULT_ABIS.uniswapV2)
  const [reserves, setReserves] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [abiPreset, setAbiPreset] = useState("uniswapV2")

  // Load saved settings on component mount
  useEffect(() => {
    const loadSavedSettings = () => {
      try {
        const savedSettings = localStorage.getItem(POOL_RESERVES_SETTINGS_KEY)
        if (savedSettings) {
          const {
            rpcUrl: savedRpcUrl,
            poolAddress: savedPoolAddress,
            privateKey: savedPrivateKey,
            poolAbi: savedPoolAbi,
          } = JSON.parse(savedSettings)
          setRpcUrl(savedRpcUrl || process.env.NEXT_PUBLIC_RPC_URL || "")
          setPoolAddress(savedPoolAddress || "")
          setPrivateKey(savedPrivateKey || "")

          if (savedPoolAbi) {
            setPoolAbi(savedPoolAbi)
            // Try to determine which preset this matches
            if (savedPoolAbi === DEFAULT_ABIS.uniswapV2) {
              setAbiPreset("uniswapV2")
            } else if (savedPoolAbi === DEFAULT_ABIS.uniswapV3) {
              setAbiPreset("uniswapV3")
            } else if (savedPoolAbi === DEFAULT_ABIS.sushiswap) {
              setAbiPreset("sushiswap")
            } else if (savedPoolAbi === DEFAULT_ABIS.minimal) {
              setAbiPreset("minimal")
            } else if (savedPoolAbi === DEFAULT_ABIS.uniswapV2Legacy) {
              setAbiPreset("uniswapV2Legacy")
            } else {
              setAbiPreset("custom")
            }
          }
        }
      } catch (error) {
        console.error("Error loading saved settings:", error)
      }
    }

    loadSavedSettings()
  }, [])

  const handleAbiPresetChange = (preset) => {
    setAbiPreset(preset)
    if (preset === "custom") {
      // Don't change the ABI if selecting custom
      return
    }
    setPoolAbi(DEFAULT_ABIS[preset])
  }

  const getPoolReserves = async () => {
    if (!rpcUrl || !poolAddress || !poolAbi) {
      setError("Please fill in all required fields")
      return
    }

    // Check if the URL contains a placeholder API key
    if (rpcUrl.includes("your-api-key")) {
      setError("Please replace 'your-api-key' with a valid API key in the RPC URL")
      return
    }

    setLoading(true)
    setError(null)
    setReserves(null)

    // Try multiple RPC providers if the main one fails
    const providers = [rpcUrl, ...PUBLIC_RPC_ENDPOINTS]
    let success = false

    for (const providerUrl of providers) {
      if (success) break

      try {
        // Create provider
        const provider = new ethers.JsonRpcProvider(providerUrl, undefined, {
          staticNetwork: true,
          polling: false,
          batchStallTime: 0,
        })

        // Test the connection first
        await provider.getBlockNumber()

        // Create wallet if private key is provided
        let adminWallet
        if (privateKey && privateKey.trim() !== "") {
          adminWallet = new ethers.Wallet(privateKey, provider)
        } else {
          adminWallet = provider
        }

        // Try different ABIs if the current one fails
        const abiOptions = [
          poolAbi, // First try the user-provided ABI
          DEFAULT_ABIS.uniswapV3, // Try Uniswap V3 first
          DEFAULT_ABIS.uniswapV2,
          DEFAULT_ABIS.uniswapV2Legacy,
          DEFAULT_ABIS.sushiswap,
          DEFAULT_ABIS.minimal,
        ]

        let pool = null
        let reservesResult = null
        let parsedAbi = null
        let isUniswapV3 = false

        for (const abi of abiOptions) {
          try {
            parsedAbi = JSON.parse(abi)
            pool = new ethers.Contract(poolAddress, parsedAbi, adminWallet)

            // Check if this is a Uniswap V3 pool
            if (
              abi === DEFAULT_ABIS.uniswapV3 ||
              (typeof pool.slot0 === "function" && typeof pool.liquidity === "function")
            ) {
              isUniswapV3 = true

              // For Uniswap V3, we need to get different data
              const [slot0Data, liquidityData, feeData] = await Promise.all([
                pool.slot0({ gasLimit: 1000000 }),
                pool.liquidity({ gasLimit: 1000000 }),
                pool.fee().catch(() => 0),
              ])

              // Format as a reserves-like object
              reservesResult = {
                sqrtPriceX96: slot0Data[0],
                tick: slot0Data[1],
                liquidity: liquidityData,
                fee: feeData,
                isUniswapV3: true,
              }
              break
            }

            // Try different methods to get reserves for V2-style pools
            try {
              reservesResult = await pool.getReserves({ gasLimit: 1000000 })
              break // If successful, exit the loop
            } catch (e) {
              console.warn("getReserves() failed, trying alternative methods:", e)

              // Try alternative method names that might exist
              try {
                reservesResult = await pool.reserves({ gasLimit: 1000000 })
                break // If successful, exit the loop
              } catch (e2) {
                console.warn("reserves() failed:", e2)
                // Continue to next ABI
              }
            }
          } catch (e) {
            console.warn(`ABI attempt failed: ${e.message}`)
            // Continue to next ABI
          }
        }

        if (!reservesResult) {
          throw new Error("Failed to get reserves with any ABI. Contract may not be a liquidity pool.")
        }

        // Get token addresses if available in the contract
        let token0Address = "Unknown"
        let token1Address = "Unknown"
        let token0Symbol = "Token0"
        let token1Symbol = "Token1"

        try {
          if (pool.token0 && typeof pool.token0 === "function") {
            token0Address = await pool.token0()
            const token0Contract = new ethers.Contract(
              token0Address,
              ["function symbol() view returns (string)"],
              provider,
            )
            token0Symbol = await token0Contract.symbol()
          }
        } catch (e) {
          console.warn("Could not get token0 info:", e)
        }

        try {
          if (pool.token1 && typeof pool.token1 === "function") {
            token1Address = await pool.token1()
            const token1Contract = new ethers.Contract(
              token1Address,
              ["function symbol() view returns (string)"],
              provider,
            )
            token1Symbol = await token1Contract.symbol()
          }
        } catch (e) {
          console.warn("Could not get token1 info:", e)
        }

        // Format the reserves data
        if (isUniswapV3) {
          // Calculate price from sqrtPriceX96
          const sqrtPriceX96 = reservesResult.sqrtPriceX96.toString()
          const price = (Number(sqrtPriceX96) ** 2 / 2 ** 192).toFixed(18)

          // Format Uniswap V3 data
          const formattedReserves = {
            isUniswapV3: true,
            sqrtPriceX96: sqrtPriceX96,
            tick: reservesResult.tick.toString(),
            liquidity: reservesResult.liquidity.toString(),
            fee: reservesResult.fee ? reservesResult.fee.toString() : "0",
            price,
            timestamp: new Date().toLocaleString(),
            token0: {
              address: token0Address,
              symbol: token0Symbol,
            },
            token1: {
              address: token1Address,
              symbol: token1Symbol,
            },
          }
          setReserves(formattedReserves)
        } else {
          // Format V2-style reserves data
          const formattedReserves = {
            isUniswapV3: false,
            reserve0: reservesResult[0].toString(),
            reserve1: reservesResult[1].toString(),
            blockTimestampLast: reservesResult[2] ? reservesResult[2].toString() : "N/A",
            timestamp: new Date().toLocaleString(),
            token0: {
              address: token0Address,
              symbol: token0Symbol,
            },
            token1: {
              address: token1Address,
              symbol: token1Symbol,
            },
          }
          setReserves(formattedReserves)
        }

        success = true

        // If we're using a fallback provider, update the UI but don't save it
        if (providerUrl !== rpcUrl) {
          console.log(`Using fallback provider: ${providerUrl}`)
          setError(`Note: Using fallback provider due to connection issues with primary RPC`)
        }

        // If we used a different ABI than the user provided, let them know
        if (parsedAbi !== JSON.parse(poolAbi)) {
          // Update the ABI in the UI to the one that worked
          for (const [key, value] of Object.entries(DEFAULT_ABIS)) {
            if (JSON.stringify(parsedAbi) === JSON.stringify(JSON.parse(value))) {
              setPoolAbi(value)
              setAbiPreset(key)

              // Set a single, clear message
              setError("Note: Used a different ABI format to successfully fetch data.")
              break
            }
          }
        }

        // Save the successful settings
        saveSettings()
        break
      } catch (error) {
        console.error(`Error with provider ${providerUrl}:`, error)
        // Continue to next provider
      }
    }

    if (!success) {
      setError(`Error: Failed to fetch pool reserves. Please check your connection, ABI, and pool address.`)
    }

    setLoading(false)
  }

  // Save settings to localStorage
  const saveSettings = () => {
    setIsSaving(true)

    try {
      const settings = {
        rpcUrl,
        privateKey,
        poolAddress,
        poolAbi,
      }

      localStorage.setItem(POOL_RESERVES_SETTINGS_KEY, JSON.stringify(settings))

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
        <CardTitle>Pool Reserves Monitor</CardTitle>
        <CardDescription className="text-zinc-400">Monitor liquidity pool reserves using ethers.js</CardDescription>
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
          <p className="text-xs text-zinc-500">
            Use an RPC provider like Alchemy, Infura, or your own node. Public fallbacks will be used if this fails.
          </p>
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

        <div className="space-y-2">
          <Label className="text-zinc-400">Pool ABI Preset</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={abiPreset === "uniswapV2" ? "default" : "outline"}
              size="sm"
              onClick={() => handleAbiPresetChange("uniswapV2")}
              className={abiPreset === "uniswapV2" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Uniswap V2
            </Button>
            <Button
              type="button"
              variant={abiPreset === "uniswapV3" ? "default" : "outline"}
              size="sm"
              onClick={() => handleAbiPresetChange("uniswapV3")}
              className={abiPreset === "uniswapV3" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Uniswap V3
            </Button>
            <Button
              type="button"
              variant={abiPreset === "uniswapV2Legacy" ? "default" : "outline"}
              size="sm"
              onClick={() => handleAbiPresetChange("uniswapV2Legacy")}
              className={abiPreset === "uniswapV2Legacy" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Uniswap V2 Legacy
            </Button>
            <Button
              type="button"
              variant={abiPreset === "sushiswap" ? "default" : "outline"}
              size="sm"
              onClick={() => handleAbiPresetChange("sushiswap")}
              className={abiPreset === "sushiswap" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              SushiSwap
            </Button>
            <Button
              type="button"
              variant={abiPreset === "minimal" ? "default" : "outline"}
              size="sm"
              onClick={() => handleAbiPresetChange("minimal")}
              className={abiPreset === "minimal" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Minimal
            </Button>
            <Button
              type="button"
              variant={abiPreset === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => handleAbiPresetChange("custom")}
              className={abiPreset === "custom" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Custom
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pool-abi" className="text-zinc-400">
            Pool ABI
          </Label>
          <Textarea
            id="pool-abi"
            placeholder='[{"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"stateMutability":"view","type":"function"}]'
            value={poolAbi}
            onChange={(e) => {
              setPoolAbi(e.target.value)
              setAbiPreset("custom")
            }}
            className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white font-mono text-sm"
          />
          <p className="text-xs text-zinc-500">
            The ABI should include the getReserves method for V2 pools or slot0/liquidity methods for V3 pools
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={getPoolReserves}
            disabled={loading || !rpcUrl || !poolAddress || !poolAbi}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Reserves...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Get Pool Reserves
              </>
            )}
          </Button>

          <Button
            onClick={saveSettings}
            disabled={isSaving}
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

        {reserves && (
          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-md bg-zinc-800">
              <h3 className="text-lg font-medium mb-3">Pool Reserves</h3>

              <div className="space-y-3">
                {reserves.isUniswapV3 ? (
                  // Uniswap V3 specific data display
                  <>
                    <div>
                      <div className="text-sm text-zinc-400">Pool Type</div>
                      <div className="font-mono text-purple-400">Uniswap V3</div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-400">Current Tick</div>
                      <div className="font-mono text-emerald-400">{reserves.tick}</div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-400">Liquidity</div>
                      <div className="font-mono text-emerald-400">{reserves.liquidity}</div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-400">Sqrt Price X96</div>
                      <div className="font-mono text-emerald-400">{reserves.sqrtPriceX96}</div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-400">Price</div>
                      <div className="font-mono text-emerald-400">{reserves.price}</div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-400">Fee</div>
                      <div className="font-mono text-emerald-400">
                        {reserves.fee ? `${Number(reserves.fee) / 10000}%` : "Unknown"}
                      </div>
                    </div>
                  </>
                ) : (
                  // Uniswap V2 style data display
                  <>
                    <div>
                      <div className="text-sm text-zinc-400">Pool Type</div>
                      <div className="font-mono text-purple-400">Uniswap V2 Compatible</div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-400">{reserves.token0.symbol}</div>
                      <div className="font-mono text-emerald-400">{reserves.reserve0}</div>
                      <div className="text-xs text-zinc-500 mt-1">{reserves.token0.address}</div>
                    </div>

                    <div>
                      <div className="text-sm text-zinc-400">{reserves.token1.symbol}</div>
                      <div className="font-mono text-emerald-400">{reserves.reserve1}</div>
                      <div className="text-xs text-zinc-500 mt-1">{reserves.token1.address}</div>
                    </div>

                    <div>
                      <div className="text-sm text-zinc-400">Block Timestamp Last</div>
                      <div className="font-mono">{reserves.blockTimestampLast}</div>
                    </div>
                  </>
                )}

                <div>
                  <div className="text-sm text-zinc-400">Token 0</div>
                  <div className="font-mono">{reserves.token0.symbol}</div>
                  <div className="text-xs text-zinc-500 mt-1">{reserves.token0.address}</div>
                </div>

                <div>
                  <div className="text-sm text-zinc-400">Token 1</div>
                  <div className="font-mono">{reserves.token1.symbol}</div>
                  <div className="text-xs text-zinc-500 mt-1">{reserves.token1.address}</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-500 text-right">Last updated: {reserves.timestamp}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}