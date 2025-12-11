"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { TrendingUp, Wallet, Activity, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useWallet } from "@/contexts/wallet-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { address, balance } = useWallet()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-ace-dark text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to access dashboard</h1>
          <Link href="/login">
            <Button className="bg-cyan-500 text-black hover:bg-cyan-400">Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.email?.split("@")[0]}</h1>
              <p className="text-gray-400">Your trading dashboard</p>
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

          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="ace-glow-box p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-400">Total Balance</div>
                <Wallet className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold">$12,345.67</div>
              <div className="text-sm text-green-400 mt-2">+5.2% this month</div>
            </div>

            <div className="ace-glow-box p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-400">24h Profit/Loss</div>
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold">+$234.56</div>
              <div className="text-sm text-green-400 mt-2">+1.9%</div>
            </div>

            <div className="ace-glow-box p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-400">Wallet Connected</div>
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <div className={`text-lg font-bold ${address ? "text-green-400" : "text-gray-400"}`}>
                {address ? "Connected" : "Not Connected"}
              </div>
              {address && <div className="text-xs text-gray-500 mt-2 font-mono">{address?.slice(0, 10)}...</div>}
            </div>
          </div>

          {/* Wallet Section */}
          {!address && (
            <div className="ace-glow-box p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-4">Connect your Web3 wallet to start trading and managing your assets</p>
              <Link href="/wallet-connect">
                <Button className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold">Connect Wallet</Button>
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="ace-glow-box p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/trade">
                <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 bg-transparent">
                  Trade Spot
                </Button>
              </Link>
              <Link href="/earn">
                <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 bg-transparent">
                  Start Staking
                </Button>
              </Link>
              <Link href="/rewards">
                <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 bg-transparent">
                  Rewards
                </Button>
              </Link>
              <Link href="/vip">
                <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 bg-transparent">
                  VIP Program
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="ace-glow-box p-6">
            <h2 className="text-xl font-bold mb-4">Recent Trades</h2>
            <div className="text-center text-gray-400 py-8">
              <p>No trades yet. Start trading now!</p>
              <Link href="/trade">
                <Button className="mt-4 bg-cyan-500 text-black hover:bg-cyan-400">Go to Trading Terminal</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}