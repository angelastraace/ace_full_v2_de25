"use client"
import { Activity, CreditCard, Shield } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import EthersClient from "./ethers-client"
import PoolMonitor from "./pool-monitor"

export default function Dashboard() {
  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Trading Volume"
            value="$24,532,642"
            change="+12.5%"
            trend="up"
            icon={<Activity className="h-5 w-5 text-emerald-500" />}
          />
          <StatsCard
            title="Active Users"
            value="8,294"
            change="+5.2%"
            trend="up"
            icon={<Activity className="h-5 w-5 text-emerald-500" />}
          />
          <StatsCard
            title="Pending Withdrawals"
            value="$1,245,320"
            change="-3.1%"
            trend="down"
            icon={<CreditCard className="h-5 w-5 text-amber-500" />}
          />
          <StatsCard
            title="System Health"
            value="98.7%"
            change="+0.2%"
            trend="up"
            icon={<Shield className="h-5 w-5 text-emerald-500" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EthersClient />
          <PoolMonitor />
        </div>
      </div>
    </div>
  )
}

// Component for stats cards
function StatsCard({ title, value, change, trend, icon }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-zinc-400 mb-1">{title}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <p className={`text-xs flex items-center mt-1 ${trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
              {trend === "up" ? "↑" : "↓"} {change}
            </p>
          </div>
          <div>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}