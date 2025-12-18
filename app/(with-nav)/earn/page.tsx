"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { TrendingUp, Zap, Lock } from "lucide-react"

export default function EarnPage() {
  const earnProducts = [
    {
      name: "Simple Earn",
      description: "Lend your assets and earn interest",
      apy: "12.5%",
      icon: TrendingUp,
      assets: ["USDT", "USDC", "DAI"],
    },
    {
      name: "Staking",
      description: "Stake coins and earn rewards",
      apy: "18.3%",
      icon: Zap,
      assets: ["ETH", "SOL", "AVAX"],
    },
    {
      name: "Launchpool",
      description: "Earn new token launches",
      apy: "25.0%",
      icon: Lock,
      assets: ["Variable"],
    },
  ]

  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Earn Passive Income</h1>
            <p className="text-gray-400">Multiple ways to grow your crypto holdings</p>
          </div>

          {/* Earn Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {earnProducts.map((product, i) => {
              const Icon = product.icon
              return (
                <div key={i} className="ace-glow-box p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-8 h-8 text-cyan-400" />
                    <h3 className="text-2xl font-bold">{product.name}</h3>
                  </div>

                  <p className="text-gray-400 mb-6">{product.description}</p>

                  <div className="mb-6 p-4 bg-[#0a2424]/50 rounded-lg">
                    <div className="text-sm text-gray-400">Average APY</div>
                    <div className="text-3xl font-bold text-cyan-400">{product.apy}</div>
                  </div>

                  <div className="mb-6">
                    <div className="text-sm text-gray-400 mb-2">Supported Assets:</div>
                    <div className="flex flex-wrap gap-2">
                      {product.assets.map((asset, j) => (
                        <span key={j} className="px-3 py-1 bg-cyan-950/50 rounded-full text-sm">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold">Start Earning</Button>
                </div>
              )
            })}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              { label: "Total Value Locked", value: "$2.5B" },
              { label: "Active Users", value: "250K+" },
              { label: "Average APY", value: "18.5%" },
            ].map((stat, i) => (
              <div key={i} className="ace-glow-box p-6 text-center">
                <div className="text-gray-400 mb-2">{stat.label}</div>
                <div className="text-3xl font-bold text-cyan-400">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}