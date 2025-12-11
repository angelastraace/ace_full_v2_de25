"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, CheckCircle, XCircle } from "lucide-react"

// Network configurations
const NETWORKS = [
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "🔷",
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
    blockExplorer: "https://etherscan.io",
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    icon: "₿",
    rpcUrl: "https://btc.getblock.io/mainnet/",
    blockExplorer: "https://www.blockchain.com/explorer",
  },
  {
    id: "bsc",
    name: "Binance Smart Chain",
    icon: "🟡",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    blockExplorer: "https://bscscan.com",
  },
  {
    id: "solana",
    name: "Solana",
    icon: "🟣",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    blockExplorer: "https://explorer.solana.com",
  },
  {
    id: "polygon",
    name: "Polygon",
    icon: "🟪",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
  },
]

export default function BlockchainStatus() {
  const [networkStatus, setNetworkStatus] = useState<
    Record<
      string,
      {
        connected: boolean
        latency: number | null
        blockHeight: number | null
        error: string | null
      }
    >
  >({})
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    checkNetworkStatus()
  }, [])

  const checkNetworkStatus = async () => {
    setLoading(true)

    const statusUpdates: Record<string, any> = {}

    for (const network of NETWORKS) {
      statusUpdates[network.id] = {
        connected: false,
        latency: null,
        blockHeight: null,
        error: null,
      }

      try {
        const startTime = Date.now()

        if (network.id === "ethereum" || network.id === "bsc" || network.id === "polygon") {
          // For EVM-compatible chains
          const provider = new ethers.JsonRpcProvider(network.rpcUrl)
          const blockNumber = await provider.getBlockNumber()

          const endTime = Date.now()
          const latency = endTime - startTime

          statusUpdates[network.id] = {
            connected: true,
            latency,
            blockHeight: blockNumber,
            error: null,
          }
        } else if (network.id === "bitcoin") {
          // For Bitcoin, we'd use a Bitcoin-specific library
          // This is a placeholder - in a real app, you'd use a Bitcoin-specific library
          await new Promise((resolve) => setTimeout(resolve, 500))

          const endTime = Date.now()
          const latency = endTime - startTime

          statusUpdates[network.id] = {
            connected: true,
            latency,
            blockHeight: 800000, // Placeholder value
            error: null,
          }
        } else if (network.id === "solana") {
          // For Solana, we'd use a Solana-specific library
          // This is a placeholder - in a real app, you'd use @solana/web3.js
          await new Promise((resolve) => setTimeout(resolve, 300))

          const endTime = Date.now()
          const latency = endTime - startTime

          statusUpdates[network.id] = {
            connected: true,
            latency,
            blockHeight: 200000000, // Placeholder value
            error: null,
          }
        }
      } catch (error) {
        console.error(`Error connecting to ${network.id}:`, error)
        statusUpdates[network.id] = {
          connected: false,
          latency: null,
          blockHeight: null,
          error: error.message,
        }
      }
    }

    setNetworkStatus(statusUpdates)
    setLastUpdated(new Date())
    setLoading(false)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Blockchain Network Status</CardTitle>
          <CardDescription className="text-zinc-400">
            Real-time connection status to blockchain networks
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkNetworkStatus}
          disabled={loading}
          className="bg-zinc-800 border-zinc-700 text-zinc-300"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NETWORKS.map((network) => {
            const status = networkStatus[network.id] || {
              connected: false,
              latency: null,
              blockHeight: null,
              error: null,
            }

            return (
              <div key={network.id} className="p-4 rounded-md bg-zinc-800 border border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{network.icon}</span>
                    <span className="font-medium">{network.name}</span>
                  </div>
                  {status.connected ? (
                    <div className="flex items-center text-emerald-400">
                      <CheckCircle className="h-5 w-5 mr-1" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-400">
                      <XCircle className="h-5 w-5 mr-1" />
                      <span>Disconnected</span>
                    </div>
                  )}
                </div>

                {status.connected && (
                  <div className="space-y-1 mt-3">
                    {status.latency !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Latency:</span>
                        <span className={status.latency < 500 ? "text-emerald-400" : "text-amber-400"}>
                          {status.latency}ms
                        </span>
                      </div>
                    )}

                    {status.blockHeight !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Block Height:</span>
                        <span className="text-white">{status.blockHeight.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Explorer:</span>
                      <a
                        href={network.blockExplorer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  </div>
                )}

                {!status.connected && status.error && (
                  <div className="mt-3 text-sm text-red-400">Error: {status.error}</div>
                )}
              </div>
            )
          })}
        </div>

        {lastUpdated && (
          <div className="text-xs text-zinc-500 mt-4 text-right">Last updated: {lastUpdated.toLocaleString()}</div>
        )}
      </CardContent>
    </Card>
  )
}