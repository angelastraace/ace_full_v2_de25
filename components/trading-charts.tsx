"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface PriceData {
  time: string
  price: number
}

const mockChartData: PriceData[] = [
  { time: "00:00", price: 43500 },
  { time: "04:00", price: 43800 },
  { time: "08:00", price: 44200 },
  { time: "12:00", price: 44500 },
  { time: "16:00", price: 45000 },
  { time: "20:00", price: 45234 },
]

export default function TradingCharts() {
  return (
    <div className="w-full h-80 ace-glow-box p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mockChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" />
          <XAxis dataKey="time" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0a2424",
              border: "1px solid rgba(34, 211, 238, 0.3)",
              borderRadius: "8px",
            }}
            cursor={{ stroke: "rgba(34, 211, 238, 0.5)" }}
          />
          <Line type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}