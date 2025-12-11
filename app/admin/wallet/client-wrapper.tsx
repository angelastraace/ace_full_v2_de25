"use client"

import dynamic from "next/dynamic"

// Import the AdminWallet component with SSR disabled
const AdminWallet = dynamic(() => import("@/components/admin-wallet"), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Loading Admin Wallet...</h1>
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <p className="text-zinc-400">The admin wallet interface is loading...</p>
      </div>
    </div>
  ),
})

export default function ClientWrapper() {
  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 text-white">Admin Wallet Management</h1>
      <AdminWallet />
    </div>
  )
}