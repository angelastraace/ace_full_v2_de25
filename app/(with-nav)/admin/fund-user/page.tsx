"use client"

import type React from "react"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"

export default function AdminFundUserPage() {
  const [email, setEmail] = useState("")
  const [amount, setAmount] = useState("")
  const [asset, setAsset] = useState("USDT")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/fund-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount, asset }),
      })

      const data = await response.json()

      setResult({
        success: data.success,
        message: data.message || "Operation completed",
      })

      if (data.success) {
        setEmail("")
        setAmount("")
        setAsset("USDT")
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Error: " + (error instanceof Error ? error.message : "Unknown error"),
      })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#001219] text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-2">Fund User Account</h1>
            <p className="text-gray-400">Send funds to a registered user from liquidity pool</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 ace-glow-box p-8">
              <form onSubmit={handleFund} className="space-y-6">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block font-semibold">User Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-4 text-white placeholder-gray-600 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">Must be a registered user email</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">Amount</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1000"
                      step="0.01"
                      className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-4 text-white placeholder-gray-600 focus:border-cyan-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">Asset</label>
                    <select
                      value={asset}
                      onChange={(e) => setAsset(e.target.value)}
                      className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-4 text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option>USDT</option>
                      <option>USDC</option>
                      <option>DAI</option>
                      <option>ETH</option>
                      <option>BTC</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-[#0a2424]/50 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Total to Send</div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {amount || "0"} {asset}
                  </div>
                </div>

                {result && (
                  <div
                    className={`p-4 rounded-lg ${
                      result.success
                        ? "bg-green-950/50 border border-green-500/30"
                        : "bg-red-950/50 border border-red-500/30"
                    }`}
                  >
                    <p className={result.success ? "text-green-400" : "text-red-400"}>{result.message}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email || !amount}
                  className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold py-6"
                >
                  {loading ? "Processing..." : "Fund Account"}
                </Button>
              </form>
            </div>

            {/* Info Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="ace-glow-box p-6">
                <h3 className="text-lg font-bold mb-4">Liquidity Pool Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-gray-400">Available Balance</div>
                    <div className="text-xl font-bold text-cyan-400">$5,234,567.89</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Supported Assets</div>
                    <div className="text-sm space-y-1 mt-2">
                      <div className="inline-block px-2 py-1 bg-cyan-950/50 rounded text-xs mr-2">USDT</div>
                      <div className="inline-block px-2 py-1 bg-cyan-950/50 rounded text-xs mr-2">USDC</div>
                      <div className="inline-block px-2 py-1 bg-cyan-950/50 rounded text-xs mr-2">ETH</div>
                      <div className="inline-block px-2 py-1 bg-cyan-950/50 rounded text-xs">BTC</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ace-glow-box p-6">
                <h3 className="text-lg font-bold mb-4">Recent Fundigns</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { user: "user1@ex.com", amount: "1000 USDT", time: "2h ago" },
                    { user: "user2@ex.com", amount: "500 USDC", time: "4h ago" },
                    { user: "user3@ex.com", amount: "0.5 ETH", time: "6h ago" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between p-2 bg-[#0a2424]/50 rounded">
                      <span className="text-gray-400">{item.user}</span>
                      <span className="font-bold">{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}