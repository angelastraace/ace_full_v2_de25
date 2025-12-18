"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { useState } from "react"

export default function MarketsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const cryptoList = [
    { symbol: "BTC", name: "Bitcoin", price: "45234.50", change: "+5.32", market_cap: "$890B" },
    { symbol: "ETH", name: "Ethereum", price: "2845.20", change: "+3.21", market_cap: "$342B" },
    { symbol: "SOL", name: "Solana", price: "198.45", change: "-2.15", market_cap: "$92B" },
    { symbol: "XRP", name: "Ripple", price: "2.45", change: "+8.76", market_cap: "$135B" },
    { symbol: "ADA", name: "Cardano", price: "1.05", change: "+4.32", market_cap: "$37B" },
  ]

  const filtered = cryptoList.filter(
    (crypto) =>
      crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crypto.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Market Data</h1>
            <p className="text-gray-400">Real-time cryptocurrency prices and market information</p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search by symbol or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-4 text-white placeholder-gray-600"
            />
          </div>

          {/* Markets Table */}
          <div className="ace-glow-box overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500/20">
                  <th className="px-6 py-4 text-left text-gray-400">Coin</th>
                  <th className="px-6 py-4 text-right text-gray-400">Price</th>
                  <th className="px-6 py-4 text-right text-gray-400">24h Change</th>
                  <th className="px-6 py-4 text-right text-gray-400">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((crypto, i) => (
                  <tr key={i} className="border-b border-cyan-500/10 hover:bg-[#0a2424]/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold">{crypto.symbol}</div>
                      <div className="text-sm text-gray-400">{crypto.name}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">${crypto.price}</td>
                    <td
                      className={`px-6 py-4 text-right font-bold ${
                        crypto.change.startsWith("+") ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {crypto.change}%
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400">{crypto.market_cap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}