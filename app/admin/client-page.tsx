"use client"

import dynamic from "next/dynamic"
import LayoutWithNav from "@/components/layout-with-nav"

// Dynamically import the ultimate admin dashboard component with SSR disabled
const UltimateAdminDashboard = dynamic(() => import("@/components/ultimate-admin-dashboard"), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Loading Admin Dashboard...</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <div className="text-sm text-zinc-400 mb-1">Loading...</div>
            <div className="h-6 bg-zinc-800 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  ),
})

export default function AdminClientPage() {
  return (
    <LayoutWithNav>
      <UltimateAdminDashboard />
    </LayoutWithNav>
  )
}