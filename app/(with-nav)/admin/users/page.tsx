"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
import { Search, Edit, Trash2 } from "lucide-react"

interface User {
  id: string
  email: string
  username: string
  walletAddress: string
  balance: string
  vipTier: string
  createdAt: string
  status: "Active" | "Suspended" | "Pending"
}

const mockUsers: User[] = [
  {
    id: "1",
    email: "trader@example.com",
    username: "trader_pro",
    walletAddress: "0x1234...5678",
    balance: "$45,234.56",
    vipTier: "Gold",
    createdAt: "2025-01-01",
    status: "Active",
  },
  {
    id: "2",
    email: "hodler@example.com",
    username: "hodler123",
    walletAddress: "0x9abc...def0",
    balance: "$12,500.00",
    vipTier: "Silver",
    createdAt: "2025-01-02",
    status: "Active",
  },
  {
    id: "3",
    email: "newuser@example.com",
    username: "newuser",
    walletAddress: "0x1111...2222",
    balance: "$500.00",
    vipTier: "Standard",
    createdAt: "2025-01-10",
    status: "Pending",
  },
]

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>(mockUsers)

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== id))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-950/50 text-green-400"
      case "Suspended":
        return "bg-red-950/50 text-red-400"
      case "Pending":
        return "bg-yellow-950/50 text-yellow-400"
      default:
        return "bg-gray-950/50 text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-[#001219] text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-gray-400">Manage all registered users and their accounts</p>
          </div>

          {/* Search and Filters */}
          <div className="ace-glow-box p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email, username, or wallet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-3 pl-10 text-white placeholder-gray-600"
                />
              </div>
              <select className="bg-[#0a2424] border border-cyan-500/30 rounded-lg p-3 text-white">
                <option>All Status</option>
                <option>Active</option>
                <option>Pending</option>
                <option>Suspended</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="ace-glow-box overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500/20 bg-[#0a2424]/50">
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Wallet</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-semibold">Balance</th>
                  <th className="px-6 py-4 text-center text-gray-400 font-semibold">VIP Tier</th>
                  <th className="px-6 py-4 text-center text-gray-400 font-semibold">Status</th>
                  <th className="px-6 py-4 text-center text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-cyan-500/10 hover:bg-[#0a2424]/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold">{user.email}</div>
                      <div className="text-sm text-gray-400">@{user.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-[#000000]/50 px-2 py-1 rounded">{user.walletAddress}</code>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">{user.balance}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-cyan-950/50 text-cyan-400 rounded-full text-sm">
                        {user.vipTier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-cyan-500 text-cyan-400 bg-transparent hover:bg-cyan-950"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-400 bg-transparent hover:bg-red-950"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No users found matching your search</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}