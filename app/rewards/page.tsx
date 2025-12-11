"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Gift, Share2, Zap, TrendingUp } from "lucide-react"
import { useState } from "react"

interface RewardTier {
  tier: string
  referrals: string
  reward: string
  earned?: number
}

const REWARD_TIERS: RewardTier[] = [
  { tier: "Bronze", referrals: "0-5", reward: "$250", earned: 0 },
  { tier: "Silver", referrals: "6-15", reward: "$500", earned: 0 },
  { tier: "Gold", referrals: "16-50", reward: "$1,500", earned: 0 },
  { tier: "Platinum", referrals: "50+", reward: "$5,000+", earned: 0 },
]

const rewardActivities = [
  { activity: "Daily Login", reward: "5 points", frequency: "Daily" },
  { activity: "Complete Trade", reward: "10-100 points", frequency: "Per trade" },
  { activity: "Referral Sign-up", reward: "$50 + 5%", frequency: "Per referral" },
  { activity: "VIP Upgrade", reward: "500 points", frequency: "One-time" },
  { activity: "Stake Assets", reward: "+APY Bonus", frequency: "Continuously" },
  { activity: "Community Events", reward: "100-1000 points", frequency: "Monthly" },
]

export default function RewardsPage() {
  const [referralCode] = useState("ACE-USER-12345")
  const [copied, setCopied] = useState(false)

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Rewards Hub</h1>
          <p className="text-gray-400 mb-8">Earn rewards through trading, referrals, and participation</p>

          {/* Rewards Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="ace-glow-box p-6">
              <Zap className="w-8 h-8 text-cyan-400 mb-4" />
              <div className="text-gray-400 mb-2">Total Points Earned</div>
              <div className="text-3xl font-bold">2,450</div>
            </div>

            <div className="ace-glow-box p-6">
              <Gift className="w-8 h-8 text-cyan-400 mb-4" />
              <div className="text-gray-400 mb-2">Total Rewards Claimed</div>
              <div className="text-3xl font-bold">$1,234.56</div>
            </div>

            <div className="ace-glow-box p-6">
              <TrendingUp className="w-8 h-8 text-cyan-400 mb-4" />
              <div className="text-gray-400 mb-2">Active Referrals</div>
              <div className="text-3xl font-bold">8</div>
            </div>
          </div>

          {/* Referral Program */}
          <div className="ace-glow-box p-8 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Share2 className="w-8 h-8 text-cyan-400" />
              <h2 className="text-2xl font-bold">Referral Program</h2>
            </div>

            <p className="text-gray-300 mb-8">
              Earn up to $6,082 USDT for each successful referral. Your friends get $50 bonus on signup!
            </p>

            <div className="space-y-6">
              {/* Your Referral Link */}
              <div className="p-6 bg-[#0a2424]/50 rounded-lg border border-cyan-500/20">
                <div className="text-sm text-gray-400 mb-3">Your Referral Link</div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={`https://aceexchange.com/ref/${referralCode}`}
                    readOnly
                    className="flex-1 bg-[#000000]/50 border border-cyan-500/20 rounded-lg p-3 text-sm font-mono text-gray-300"
                  />
                  <Button
                    onClick={copyReferral}
                    className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold whitespace-nowrap"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              </div>

              {/* Referral Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0a2424]/50 rounded-lg text-center">
                  <div className="text-sm text-gray-400 mb-2">You Earn</div>
                  <div className="text-2xl font-bold text-cyan-400">5%</div>
                  <div className="text-xs text-gray-400 mt-2">of their trading volume</div>
                </div>

                <div className="p-4 bg-[#0a2424]/50 rounded-lg text-center">
                  <div className="text-sm text-gray-400 mb-2">They Get</div>
                  <div className="text-2xl font-bold text-green-400">$50</div>
                  <div className="text-xs text-gray-400 mt-2">signup bonus</div>
                </div>

                <div className="p-4 bg-[#0a2424]/50 rounded-lg text-center">
                  <div className="text-sm text-gray-400 mb-2">Unlimited</div>
                  <div className="text-2xl font-bold text-purple-400">∞</div>
                  <div className="text-xs text-gray-400 mt-2">referrals allowed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Reward Activities */}
          <h2 className="text-2xl font-bold mb-6">Ways to Earn Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {rewardActivities.map((item, i) => (
              <div key={i} className="ace-glow-box p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">{item.activity}</div>
                  <div className="text-sm text-gray-400">{item.frequency}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-cyan-400">{item.reward}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Reward Tiers */}
          <h2 className="text-2xl font-bold mb-6">Referral Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {REWARD_TIERS.map((tier, i) => (
              <div key={i} className="ace-glow-box p-6">
                <h3 className="text-xl font-bold mb-4">{tier.tier}</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400">Referrals</div>
                    <div className="font-bold">{tier.referrals}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Total Reward</div>
                    <div className="text-lg font-bold text-cyan-400">{tier.reward}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}