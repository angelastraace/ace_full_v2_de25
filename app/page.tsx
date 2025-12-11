"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TrendingUp, Zap, Lock, Award } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            The Future of <span className="ace-glow">Crypto Trading</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Advanced trading, staking, lending, and rewards. The most feature-rich crypto exchange ever built.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/trade">
              <Button size="lg" className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold">
                Start Trading
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="lg"
                variant="outline"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-950 bg-transparent"
              >
                Create Account
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              { icon: TrendingUp, label: "Spot & Futures", desc: "200x leverage trading" },
              { icon: Zap, label: "Lightning Fast", desc: "100,000+ TPS" },
              { icon: Lock, label: "Secure", desc: "Multi-sig wallets" },
              { icon: Award, label: "Rewards", desc: "20% cashback card" },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="ace-glow-box p-6 backdrop-blur-sm">
                  <Icon className="w-8 h-8 text-cyan-400 mb-3 mx-auto" />
                  <h3 className="font-bold mb-2">{feature.label}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">
          Everything You Need to <span className="ace-glow">Trade & Earn</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              title: "Spot Trading",
              items: ["1000+ assets", "Real-time data", "Advanced charts"],
            },
            {
              title: "Futures",
              items: ["Up to 200x leverage", "Perpetual contracts", "Risk management"],
            },
            {
              title: "Staking & Earn",
              items: ["High APY rewards", "Auto-compounding", "Multiple coins"],
            },
            {
              title: "Smart Tools",
              items: ["Copy trading", "Trading bots", "AI insights"],
            },
          ].map((section, i) => (
            <div key={i} className="ace-glow-box p-8">
              <h3 className="text-2xl font-bold mb-4 text-cyan-400">{section.title}</h3>
              <ul className="space-y-3">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-3 text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto ace-glow-box p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-gray-300 mb-8">Join millions of traders on ACE Exchange</p>
          <Link href="/signup">
            <Button size="lg" className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}