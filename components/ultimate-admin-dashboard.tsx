"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Line, Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend)

export default function UltimateAdminDashboard() {
  const [metrics, setMetrics] = useState({
    users: 0,
    quests: 0,
    xpEarned: 0,
    totalRewards: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  async function fetchDashboardStats() {
    setLoading(true)
    const [users, quests, xp, rewards] = await Promise.all([
      supabase.from("users").select("id", { count: "exact" }),
      supabase.from("quests").select("id", { count: "exact" }),
      supabase.rpc("total_xp_earned"),
      supabase.from("nft_rewards").select("id", { count: "exact" }),
    ])

    setMetrics({
      users: users.count || 0,
      quests: quests.count || 0,
      xpEarned: xp.data || 0,
      totalRewards: rewards.count || 0,
    })

    setLoading(false)
  }

  const lineData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "XP Earned",
        data: [500, 1200, 1800, 2500],
        fill: false,
        borderColor: "#22c55e",
        tension: 0.3,
      },
    ],
  }

  const doughnutData = {
    labels: ["Active", "Inactive"],
    datasets: [
      {
        data: [metrics.users * 0.75, metrics.users * 0.25],
        backgroundColor: ["#3b82f6", "#f87171"],
      },
    ],
  }

  return (
    <main className="p-4 md:p-8 space-y-6 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white min-h-screen">
      <h1 className="text-4xl font-extrabold tracking-tight">🧠 ACE Admin Intelligence Panel</h1>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">🧑‍🚀 Users: {metrics.users}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">📜 Quests: {metrics.quests}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">💥 XP Earned: {metrics.xpEarned}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">🎁 Total Rewards: {metrics.totalRewards}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">📈 Weekly XP Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      ticks: { color: "rgba(255, 255, 255, 0.7)" },
                      grid: { color: "rgba(255, 255, 255, 0.1)" },
                    },
                    x: {
                      ticks: { color: "rgba(255, 255, 255, 0.7)" },
                      grid: { color: "rgba(255, 255, 255, 0.1)" },
                    },
                  },
                  plugins: {
                    legend: {
                      labels: { color: "rgba(255, 255, 255, 0.9)" },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">🌀 User Engagement Split</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: "rgba(255, 255, 255, 0.9)" },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">🔄 Refresh Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={fetchDashboardStats}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? "Loading..." : "Refresh Dashboard"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}