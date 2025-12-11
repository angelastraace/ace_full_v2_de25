"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, TrendingUp, Activity } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="ace-glow-box p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-400">Total Users</div>
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold">12,543</div>
            </div>

            <div className="ace-glow-box p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-400">Total Volume</div>
                <DollarSign className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold">$245M</div>
            </div>

            <div className="ace-glow-box p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-400">TVL (Staking)</div>
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold">$2.5B</div>
            </div>

            <div className="ace-glow-box p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-400">Active Trades</div>
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold">1,245</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ace-glow-box p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold">Fund User Account</Button>
              <Button variant="outline" className="border-cyan-500 text-cyan-400 bg-transparent">
                View All Users
              </Button>
              <Button variant="outline" className="border-cyan-500 text-cyan-400 bg-transparent">
                System Status
              </Button>
            </div>
          </div>

          {/* Recent Funding Transactions */}
          <div className="ace-glow-box p-6">
            <h2 className="text-xl font-bold mb-4">Recent Admin Funding</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyan-500/20">
                    <th className="px-4 py-2 text-left text-gray-400">User</th>
                    <th className="px-4 py-2 text-right text-gray-400">Amount</th>
                    <th className="px-4 py-2 text-left text-gray-400">Asset</th>
                    <th className="px-4 py-2 text-left text-gray-400">Status</th>
                    <th className="px-4 py-2 text-left text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      user: "user@example.com",
                      amount: "1000",
                      asset: "USDT",
                      status: "Completed",
                      date: "2025-01-11",
                    },
                    {
                      user: "trader@example.com",
                      amount: "500",
                      asset: "USDC",
                      status: "Completed",
                      date: "2025-01-10",
                    },
                    { user: "hodler@example.com", amount: "0.5", asset: "ETH", status: "Pending", date: "2025-01-10" },
                  ].map((tx, i) => (
                    <tr key={i} className="border-b border-cyan-500/10 hover:bg-[#0a2424]/30">
                      <td className="px-4 py-3">{tx.user}</td>
                      <td className="px-4 py-3 text-right font-bold">{tx.amount}</td>
                      <td className="px-4 py-3">{tx.asset}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            tx.status === "Completed"
                              ? "bg-green-950/50 text-green-400"
                              : "bg-yellow-950/50 text-yellow-400"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{tx.date}</td>
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