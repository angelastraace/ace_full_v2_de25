"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Rocket } from "lucide-react"

export default function LaunchpadPage() {
  const projects = [
    {
      name: "Project Alpha",
      symbol: "ALPHA",
      description: "Next-gen DeFi protocol",
      raise: "$5M",
      progress: 75,
      ends: "2 days",
    },
    {
      name: "Project Beta",
      symbol: "BETA",
      description: "AI-powered trading bot",
      raise: "$10M",
      progress: 45,
      ends: "7 days",
    },
  ]

  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Token Launchpad</h1>
          <p className="text-gray-400 mb-8">Invest in upcoming crypto projects early</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, i) => (
              <div key={i} className="ace-glow-box p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{project.name}</h3>
                    <p className="text-sm text-gray-400">{project.symbol}</p>
                  </div>
                  <Rocket className="w-6 h-6 text-cyan-400" />
                </div>

                <p className="text-gray-400 mb-4">{project.description}</p>

                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Raised</span>
                    <span className="text-sm font-bold">{project.raise}</span>
                  </div>
                  <div className="w-full bg-[#0a2424]/50 rounded-full h-2">
                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Sale ends in {project.ends}</span>
                  <span className="text-sm font-bold text-cyan-400">{project.progress}%</span>
                </div>

                <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold">Invest Now</Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}