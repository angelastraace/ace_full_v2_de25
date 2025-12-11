"use client"

import type React from "react"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { TrendingUp, Zap, Clock } from "lucide-react"
import { useState } from "react"

interface StakingProduct {
  id: string
  name: string
  asset: string
  apy: number
  lockupPeriod: string
  minAmount: number
  available: number
  icon: React.ReactNode
}

const STAKING_PRODUCTS: StakingProduct[] = [
  {
    id: "eth-staking",
    name: "ETH 2.0 Staking",
    asset: "ETH",
    apy: 3.5,
    lockupPeriod: "Flexible",
    minAmount: 0.1,
    available: 1250.5,
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: "sol-staking",
    name: "Solana Staking",
    asset: "SOL",
    apy: 8.2,
    lockupPeriod: "14 days",
    minAmount: 1,
    available: 5600.0,
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    id: "bnb-staking",
    name: "BNB Staking",
    asset: "BNB",
    apy: 5.8,
    lockupPeriod: "30 days",
    minAmount: 0.01,
    available: 3240.25,
    icon: <Clock className="w-6 h-6" />,
  },
  {
    id: "ada-staking",
    name: "Cardano Staking",
    asset: "ADA",
    apy: 4.2,
    lockupPeriod: "Flexible",
    minAmount: 10,
    available: 12500.0,
    icon: <TrendingUp className="w-6 h-6" />,
  },
]

export default function StakingPage() {
  const [selectedStaking, setSelectedStaking] = useState<StakingProduct | null>(null)
  const [stakeAmount, setStakeAmount] = useState("")
  const [myStakes, setMyStakes] = useState<any[]>([])

  const handleStake = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaking || !stakeAmount) return

    const newStake = {
      id: Date.now(),
      product: selectedStaking.name,
      asset: selectedStaking.asset,
      amount: Number.parseFloat(stakeAmount),
      apy: selectedStaking.apy,
      startDate: new Date(),
      earned: 0,
    }

    setMyStakes([...myStakes, newStake])
    setStakeAmount("")
    setSelectedStaking(null)
  }

  const projectedYearlyReturn = myStakes.reduce((sum, stake) => sum + stake.amount * (stake.apy / 100), 0)

  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Staking & Earn</h1>
          <p className="text-gray-400 mb-8">Earn passive income by staking your assets</p>

          {/* Summary */}
          {myStakes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="ace-glow-box p-6">
                <div className="text-gray-400 mb-2">Total Staked</div>
                <div className="text-3xl font-bold">${myStakes.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}</div>
              </div>
              <div className="ace-glow-box p-6">
                <div className="text-gray-400 mb-2">Total Earned</div>
                <div className="text-3xl font-bold text-green-400">
                  ${myStakes.reduce((sum, s) => sum + s.earned, 0).toFixed(2)}
                </div>
              </div>
              <div className="ace-glow-box p-6">
                <div className="text-gray-400 mb-2">Projected Yearly</div>
                <div className="text-3xl font-bold text-cyan-400">${projectedYearlyReturn.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Staking Products */}
          <h2 className="text-2xl font-bold mb-6">Available Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {STAKING_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className={`ace-glow-box p-6 cursor-pointer transition transform hover:scale-105 ${
                  selectedStaking?.id === product.id ? "ring-2 ring-cyan-400" : ""
                }`}
                onClick={() => setSelectedStaking(product)}
              >
                <div className="flex items-center gap-3 mb-4 text-cyan-400">{product.icon}</div>
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-gray-400">APY</div>
                    <div className="text-2xl font-bold text-green-400">{product.apy}%</div>
                  </div>

                  <div>
                    <div className="text-gray-400">Lockup</div>
                    <div className="font-bold">{product.lockupPeriod}</div>
                  </div>

                  <div>
                    <div className="text-gray-400">Min Stake</div>
                    <div className="font-bold">
                      {product.minAmount} {product.asset}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-cyan-500/20">
                    <div className="text-gray-400">Available</div>
                    <div className="font-bold">
                      {product.available.toFixed(2)} {product.asset}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Staking Form */}
          {selectedStaking && (
            <div className="max-w-2xl mx-auto ace-glow-box p-8 mb-12">
              <h2 className="text-2xl font-bold mb-6">Stake {selectedStaking.name}</h2>

              <form onSubmit={handleStake} className="space-y-6">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Amount ({selectedStaking.asset})</label>
                  <input
                    type="number"
                    step="0.01"
                    min={selectedStaking.minAmount}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder={`Minimum ${selectedStaking.minAmount}`}
                    className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-4 text-white placeholder-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Available: {selectedStaking.available} {selectedStaking.asset}
                  </p>
                </div>

                {stakeAmount && (
                  <div className="p-4 bg-[#0a2424]/50 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stake Amount</span>
                      <span className="font-bold">
                        {stakeAmount} {selectedStaking.asset}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">APY</span>
                      <span className="font-bold text-green-400">{selectedStaking.apy}%</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-cyan-500/20">
                      <span className="text-gray-400">Yearly Earnings (est.)</span>
                      <span className="font-bold text-cyan-400">
                        {(Number.parseFloat(stakeAmount) * (selectedStaking.apy / 100)).toFixed(4)}{" "}
                        {selectedStaking.asset}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!stakeAmount || Number.parseFloat(stakeAmount) < selectedStaking.minAmount}
                  className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold py-6"
                >
                  Stake Now
                </Button>
              </form>
            </div>
          )}

          {/* My Stakes */}
          {myStakes.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">My Stakes</h2>
              <div className="space-y-4">
                {myStakes.map((stake) => (
                  <div key={stake.id} className="ace-glow-box p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{stake.product}</h3>
                        <p className="text-gray-400">
                          {stake.amount} {stake.asset} • APY {stake.apy}%
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 text-sm mb-1">Earned</div>
                        <div className="text-2xl font-bold text-green-400">${stake.earned}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}