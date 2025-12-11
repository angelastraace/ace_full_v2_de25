"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// Import Chart.js components only on the client side
let Chart, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend
let Line, Doughnut

// Dynamic imports for Chart.js
if (typeof window !== "undefined") {
  const ChartJS = require("chart.js")
  Chart = ChartJS.Chart
  CategoryScale = ChartJS.CategoryScale
  LinearScale = ChartJS.LinearScale
  PointElement = ChartJS.PointElement
  LineElement = ChartJS.LineElement
  ArcElement = ChartJS.ArcElement
  Tooltip = ChartJS.Tooltip
  Legend = ChartJS.Legend

  const ReactChartJS = require("react-chartjs-2")
  Line = ReactChartJS.Line
  Doughnut = ReactChartJS.Doughnut

  // Register Chart.js components
  Chart.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend)
}

interface AdminChartsProps {
  historicalData: {
    timestamps: string[]
    liquidityValues: number[]
    volumeValues: number[]
  }
  doughnutData: {
    labels: string[]
    values: number[]
  }
}

export default function AdminCharts({ historicalData, doughnutData }: AdminChartsProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Liquidity & Volume Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Token Reserve Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  const lineData = {
    labels: historicalData.timestamps,
    datasets: [
      {
        label: "Total Liquidity (USD)",
        data: historicalData.liquidityValues,
        fill: false,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        tension: 0.3,
      },
      {
        label: "Trading Volume (USD)",
        data: historicalData.volumeValues,
        fill: false,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.3,
      },
    ],
  }

  const doughnutChartData = {
    labels: doughnutData.labels,
    datasets: [
      {
        data: doughnutData.values,
        backgroundColor: ["#3b82f6", "#f87171"],
      },
    ],
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Liquidity & Volume Trends</CardTitle>
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
          <CardTitle className="text-white">Token Reserve Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <Doughnut
              data={doughnutChartData}
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
  )
}