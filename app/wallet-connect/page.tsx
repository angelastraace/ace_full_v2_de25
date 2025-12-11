"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { Wallet, Copy, LogOut } from "lucide-react"

export default function WalletConnectPage() {
  const { address, balance, connected, connect, disconnect, getBalance } = useWallet()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      await connect()
      await getBalance()
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await disconnect()
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      <div className="pt-20 pb-20 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="ace-glow-box p-8">
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="w-8 h-8 text-cyan-400" />
              <h1 className="text-3xl font-bold">Connect Wallet</h1>
            </div>

            {!connected ? (
              <div className="space-y-4">
                <p className="text-gray-400 mb-6">Connect your Web3 wallet to start trading on ACE Exchange</p>

                <Button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold py-6"
                >
                  {loading ? "Connecting..." : "Connect MetaMask"}
                </Button>

                <p className="text-sm text-gray-500 text-center">Make sure MetaMask is installed in your browser</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-[#0a2424]/50 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Connected Wallet</div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-sm break-all">{address}</div>
                    <button
                      onClick={copyAddress}
                      className="p-2 hover:bg-[#0a2424] rounded transition"
                      title="Copy address"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {balance && (
                  <div className="p-4 bg-[#0a2424]/50 rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">ETH Balance</div>
                    <div className="text-2xl font-bold text-cyan-400">{balance} ETH</div>
                  </div>
                )}

                <Button
                  onClick={handleDisconnect}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-red-500 text-red-400 hover:bg-red-950 bg-transparent"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect Wallet
                </Button>

                {copied && <p className="text-center text-green-400 text-sm">Address copied!</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}