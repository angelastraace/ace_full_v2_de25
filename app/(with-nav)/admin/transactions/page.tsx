"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

interface Transaction {
  id: string
  type: "funding" | "withdrawal" | "trade"
  user: string
  amount: string
  asset: string
  fromPool: string
  status: "Completed" | "Pending" | "Failed"
  txHash: string
  timestamp: string
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "funding",
    user: "trader@example.com",
    amount: "1000",
    asset: "USDT",
    fromPool: "DAI/USDC",
    status: "Completed",
    txHash: "0xabc123...def789",
    timestamp: "2025-01-11 14:30",
  },
  {
    id: "2",
    type: "withdrawal",
    user: "hodler@example.com",
    amount: "500",
    asset: "USDC",
    fromPool: "N/A",
    status: "Completed",
    txHash: "0x123def...789abc",
    timestamp: "2025-01-11 13:15",
  },
  {
    id: "3",
    type: "funding",
    user: "newuser@example.com",
    amount: "0.5",
    asset: "ETH",
    fromPool: "Uniswap V3",
    status: "Pending",
    txHash: "0xfed456...cba321",
    timestamp: "2025-01-11 12:00",
  },
]

export default function AdminTransactionsPage() {
  const getTypeIcon = (type: string) => {
    return type === "funding" ? (
      <ArrowDownLeft className="w-5 h-5 text-green-400" />
    ) : (
      <ArrowUpRight className="w-5 h-5 text-red-400" />
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-950/50 text-green-400"
      case "Pending":
        return "bg-yellow-950/50 text-yellow-400"
      case "Failed":
        return "bg-red-950/50 text-red-400"
      default:
        return "bg-gray-950/50 text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-[#001219] text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
            <p className="text-gray-400">All funding and withdrawal transactions</p>
          </div>

          {/* Transactions Table */}
          <div className="ace-glow-box overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500/20 bg-[#0a2424]/50">
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">User</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Pool</th>
                  <th className="px-6 py-4 text-center text-gray-400 font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">TX Hash</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-cyan-500/10 hover:bg-[#0a2424]/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type)}
                        <span className="font-bold capitalize">{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-cyan-400">{tx.user}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {tx.amount} {tx.asset}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">{tx.fromPool}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(tx.status)}`}>{tx.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-[#000000]/50 px-2 py-1 rounded">{tx.txHash}</code>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{tx.timestamp}</td>
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