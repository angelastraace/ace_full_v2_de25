"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, TrendingUp, Activity, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    // TODO: Implement admin logout
    router.push("/")
  }

  const stats = [
    { label: "Total Users", value: "12,543", icon: Users, color: "cyan" },
    { label: "Total Volume", value: "$245M", icon: DollarSign, color: "green" },
    { label: "TVL (Staking)", value: "$2.5B", icon: TrendingUp, color: "purple" },
    { label: "Active Trades", value: "1,245", icon: Activity, color: "blue" },
  ]

  const recentTransactions = [
    {
      id: "1",
      type: "Fund User",
      user: "user@example.com",
      amount: "1000 USDT",
      status: "Completed",
      timestamp: "2025-01-11 14:30",
    },
    {
      id: "2",
      type: "Fund User",
      user: "trader@example.com",
      amount: "500 USDC",
      status: "Completed",
      timestamp: "2025-01-11 13:15",
    },
    {
      id: "3",
      type: "Fund User",
      user: "hodler@example.com",
      amount: "0.5 ETH",
      status: "Pending",
      timestamp: "2025-01-11 12:00",
    },
    {
      id: "4",
      type: "User Withdrawal",
      user: "investor@example.com",
      amount: "2500 USDT",
      status: "Completed",
      timestamp: "2025-01-10 16:45",
    },
  ]

  return (
    <div className="min-h-screen bg-[#001219] text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-400">System management and monitoring</p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={loading}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-950 bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="ace-glow-box p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="ace-glow-box p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/admin/fund-user">
                <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold">Fund User</Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 bg-transparent">
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/transactions">
                <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 bg-transparent">
                  View Transactions
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 bg-transparent">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="ace-glow-box p-6">
            <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyan-500/20">
                    <th className="px-4 py-3 text-left text-gray-400">Type</th>
                    <th className="px-4 py-3 text-left text-gray-400">User</th>
                    <th className="px-4 py-3 text-right text-gray-400">Amount</th>
                    <th className="px-4 py-3 text-left text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-gray-400">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-cyan-500/10 hover:bg-[#0a2424]/30 transition">
                      <td className="px-4 py-3 font-bold">{tx.type}</td>
                      <td className="px-4 py-3 text-cyan-400">{tx.user}</td>
                      <td className="px-4 py-3 text-right font-bold">{tx.amount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            tx.status === "Completed"
                              ? "bg-green-950/50 text-green-400"
                              : "bg-yellow-950/50 text-yellow-400"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{tx.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}