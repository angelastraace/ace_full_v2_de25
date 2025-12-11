"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Check, Crown, Zap, Gift, TrendingUp } from "lucide-react"
import { useState } from "react"

interface VIPTier {
  name: string
  level: number
  makerFee: string
  takerFee: string
  features: string[]
  monthlyBonus: string
  color: string
}

const VIP_TIERS: VIPTier[] = [
  {
    name: "Standard",
    level: 0,
    makerFee: "0.10%",
    takerFee: "0.10%",
    features: ["Spot trading", "Basic support", "Standard limits"],
    monthlyBonus: "$0",
    color: "gray",
  },
  {
    name: "Silver",
    level: 1,
    makerFee: "0.08%",
    takerFee: "0.10%",
    features: ["Reduced fees", "Priority support", "Higher limits", "Exclusive airdrops"],
    monthlyBonus: "$50",
    color: "cyan",
  },
  {
    name: "Gold",
    level: 2,
    makerFee: "0.05%",
    takerFee: "0.08%",
    features: ["Premium benefits", "Dedicated manager", "Early access", "20% cashback card", "Higher staking rewards"],
    monthlyBonus: "$200",
    color: "amber",
  },
  {
    name: "Platinum",
    level: 3,
    makerFee: "0.02%",
    takerFee: "0.05%",
    features: [
      "VIP trading",
      "Personal manager",
      "Early access",
      "40% cashback card",
      "Maximum staking rewards",
      "Exclusive events",
    ],
    monthlyBonus: "$1000",
    color: "purple",
  },
]

export default function VIPPage() {
  const [currentTier, setCurrentTier] = useState<string>("Standard")
  const [selectedUpgrade, setSelectedUpgrade] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <Crown className="w-10 h-10 text-amber-400" />
              ACE VIP Program
            </h1>
            <p className="text-gray-400">Unlock exclusive benefits with premium membership</p>
          </div>

          {/* Current Status */}
          <div className="ace-glow-box p-8 mb-12 text-center">
            <p className="text-gray-400 mb-2">Your Current Tier</p>
            <h2 className="text-4xl font-bold text-cyan-400 mb-4">{currentTier}</h2>
            <p className="text-gray-400">Upgrade to unlock more benefits and rewards</p>
          </div>

          {/* VIP Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {VIP_TIERS.map((tier, index) => {
              const isCurrent = tier.name === currentTier
              const isSelected = tier.name === selectedUpgrade
              const colorClass = {
                gray: "cyan",
                cyan: "cyan",
                amber: "amber",
                purple: "purple",
              }[tier.color] as string

              return (
                <div
                  key={tier.name}
                  className={`ace-glow-box p-6 relative transition transform ${
                    isCurrent
                      ? "ring-2 ring-green-400 scale-105"
                      : isSelected
                        ? "ring-2 ring-cyan-400"
                        : "hover:scale-102"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                      Current
                    </div>
                  )}

                  <h3 className={`text-2xl font-bold mb-4 text-${colorClass}-400`}>{tier.name}</h3>

                  <div className="mb-6 space-y-2">
                    <div>
                      <div className="text-sm text-gray-400">Maker Fee</div>
                      <div className="text-xl font-bold">{tier.makerFee}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Taker Fee</div>
                      <div className="text-xl font-bold">{tier.takerFee}</div>
                    </div>
                    <div className="pt-3 border-t border-cyan-500/20">
                      <div className="text-sm text-gray-400">Monthly Bonus</div>
                      <div className={`text-2xl font-bold text-${colorClass}-400`}>{tier.monthlyBonus}</div>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className={`w-4 h-4 text-${colorClass}-400`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && (
                    <Button
                      onClick={() => setSelectedUpgrade(tier.name)}
                      className={`w-full font-bold ${
                        isSelected
                          ? `bg-${colorClass}-500 text-black hover:bg-${colorClass}-400`
                          : `bg-[#0a2424] text-${colorClass}-400 border border-${colorClass}-500/30 hover:bg-[#0a2424]`
                      }`}
                    >
                      {isSelected ? "Selected" : "Upgrade"}
                    </Button>
                  )}

                  {isCurrent && (
                    <Button disabled className="w-full bg-green-600 text-white">
                      Current Tier
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Benefits Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="ace-glow-box p-6">
              <Zap className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Lower Fees</h3>
              <p className="text-gray-400">Reduce trading fees up to 98% compared to standard rates</p>
            </div>

            <div className="ace-glow-box p-6">
              <Gift className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Exclusive Rewards</h3>
              <p className="text-gray-400">Receive monthly bonuses, airdrops, and special rewards</p>
            </div>

            <div className="ace-glow-box p-6">
              <TrendingUp className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Premium Support</h3>
              <p className="text-gray-400">24/7 dedicated support and priority transaction processing</p>
            </div>
          </div>

          {/* ACE Crypto Card */}
          <div className="ace-glow-box p-8 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">ACE</span>
              </div>
              <h2 className="text-2xl font-bold">ACE Crypto Rewards Visa Card</h2>
            </div>

            <p className="text-gray-400 mb-6">
              Exclusive to VIP members - Spend crypto and earn rewards with our branded Visa card
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-[#0a2424]/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Silver Cashback</div>
                <div className="text-2xl font-bold text-cyan-400">5%</div>
              </div>
              <div className="p-4 bg-[#0a2424]/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Gold Cashback</div>
                <div className="text-2xl font-bold text-amber-400">20%</div>
              </div>
              <div className="p-4 bg-[#0a2424]/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Platinum Cashback</div>
                <div className="text-2xl font-bold text-purple-400">40%</div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          {selectedUpgrade && selectedUpgrade !== currentTier && (
            <div className="max-w-2xl mx-auto ace-glow-box p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Upgrade to {selectedUpgrade}?</h3>
              <p className="text-gray-400 mb-6">
                Unlock premium features, lower fees, and exclusive rewards. Your benefits will be activated immediately.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => setSelectedUpgrade(null)}
                  variant="outline"
                  className="border-cyan-500 text-cyan-400 bg-transparent hover:bg-cyan-950"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setCurrentTier(selectedUpgrade)
                    setSelectedUpgrade(null)
                  }}
                  className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold px-8"
                >
                  Confirm Upgrade
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}