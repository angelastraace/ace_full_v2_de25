"use client"

import LayoutWithNav from "@/components/layout-with-nav"
import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { PlusCircle, User, Wallet, Copy, Check, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Supported blockchain networks
const SUPPORTED_NETWORKS = [
  { id: "ethereum", name: "Ethereum", symbol: "ETH", icon: "🔷" },
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", icon: "₿" },
  { id: "bsc", name: "Binance Smart Chain", symbol: "BNB", icon: "🟡" },
  { id: "solana", name: "Solana", symbol: "SOL", icon: "🟣" },
  { id: "polygon", name: "Polygon", symbol: "MATIC", icon: "🟪" },
  {
    id: "dai",
    name: "Dai Stablecoin",
    symbol: "DAI",
    icon: "🔶",
    contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
]

interface UserWallets {
  [key: string]: string
}

interface UserData {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  wallets: UserWallets
  createdAt: string
}

function UsersContent() {
  const [users, setUsers] = useState<UserData[]>([])
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "User",
    wallets: {} as UserWallets,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGeneratingWallets, setIsGeneratingWallets] = useState(false)
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null)
  const [activeUserTab, setActiveUserTab] = useState<number | null>(null)
  const [expandedWallets, setExpandedWallets] = useState<{ [key: string]: boolean }>({})
  const [expandedUserWallets, setExpandedUserWallets] = useState<{ [key: string]: boolean }>({})

  // Load saved users on component mount
  useEffect(() => {
    const savedUsers = localStorage.getItem("liquidityPoolUsers")
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers))
      } catch (e) {
        console.error("Error parsing saved users:", e)
      }
    }
  }, [])

  // Save users to localStorage when they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("liquidityPoolUsers", JSON.stringify(users))
    }
  }, [users])

  const generateWallets = async () => {
    setIsGeneratingWallets(true)
    const wallets: UserWallets = {}

    try {
      // Generate wallets for each supported network
      for (const network of SUPPORTED_NETWORKS) {
        if (network.id === "ethereum" || network.id === "bsc" || network.id === "polygon" || network.id === "dai") {
          // For EVM chains, generate a new wallet
          const wallet = ethers.Wallet.createRandom()
          wallets[network.id] = wallet.address
        } else if (network.id === "bitcoin") {
          // For Bitcoin, we'd use a Bitcoin-specific library
          // This is a placeholder - in a real app, you'd use a Bitcoin-specific library
          const mockBtcAddress = `bc1q${Array(40)
            .fill(0)
            .map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)])
            .join("")}`
          wallets[network.id] = mockBtcAddress
        } else if (network.id === "solana") {
          // For Solana, we'd use a Solana-specific library
          // This is a placeholder - in a real app, you'd use @solana/web3.js
          const mockSolAddress = Array(44)
            .fill(0)
            .map(() => "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"[Math.floor(Math.random() * 58)])
            .join("")
          wallets[network.id] = mockSolAddress
        }
      }

      setNewUser((prev) => ({ ...prev, wallets }))
    } catch (error) {
      console.error("Error generating wallets:", error)
    } finally {
      setIsGeneratingWallets(false)
    }
  }

  const handleAddUser = () => {
    if (newUser.firstName && newUser.lastName && newUser.email) {
      const newUserData: UserData = {
        id: Date.now(),
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone || "",
        role: newUser.role,
        wallets: newUser.wallets,
        createdAt: new Date().toISOString(),
      }

      setUsers([...users, newUserData])
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "User",
        wallets: {},
      })
      setIsDialogOpen(false)
    }
  }

  const copyToClipboard = async (text: string, networkId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedWallet(networkId)
      setTimeout(() => setCopiedWallet(null), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  const getExplorerUrl = (network: string, address: string) => {
    switch (network) {
      case "ethereum":
      case "dai":
        return `https://etherscan.io/address/${address}`
      case "bsc":
        return `https://bscscan.com/address/${address}`
      case "polygon":
        return `https://polygonscan.com/address/${address}`
      case "bitcoin":
        return `https://www.blockchain.com/explorer/addresses/btc/${address}`
      case "solana":
        return `https://explorer.solana.com/address/${address}`
      default:
        return "#"
    }
  }

  const toggleWallets = (networkId: string) => {
    setExpandedWallets((prev) => ({
      ...prev,
      [networkId]: !prev[networkId],
    }))
  }

  const toggleUserWallets = (userId: number, networkId: string) => {
    setExpandedUserWallets((prev) => ({
      ...prev,
      [`${userId}-${networkId}`]: !prev[`${userId}-${networkId}`],
    }))
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Users Management</h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 text-white border-zinc-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription className="text-zinc-400">Enter the details for the new user.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-zinc-300">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-zinc-300">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zinc-300">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-zinc-300">
                  Role
                </Label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-zinc-800 border-zinc-700 text-white rounded-md p-2"
                >
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="space-y-2 border-t border-zinc-800 pt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-zinc-300">Blockchain Wallets</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateWallets}
                    disabled={isGeneratingWallets}
                    className="bg-zinc-800 border-zinc-700 text-zinc-300"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {isGeneratingWallets ? "Generating..." : "Generate Wallets"}
                  </Button>
                </div>

                {Object.keys(newUser.wallets).length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {SUPPORTED_NETWORKS.map((network) =>
                      newUser.wallets[network.id] ? (
                        <div key={network.id} className="border-zinc-800">
                          <div
                            className="text-sm py-2 hover:no-underline cursor-pointer"
                            onClick={() => toggleWallets(network.id)}
                          >
                            <span className="flex items-center">
                              <span className="mr-2">{network.icon}</span>
                              {network.name} Wallet
                            </span>
                          </div>
                          {expandedWallets[network.id] && (
                            <div className="p-2 bg-zinc-800 rounded-md">
                              <div className="flex justify-between items-center">
                                <div className="font-mono text-xs break-all text-zinc-300">
                                  {newUser.wallets[network.id]}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(newUser.wallets[network.id], network.id)}
                                    className="h-7 w-7 p-0"
                                  >
                                    {copiedWallet === network.id ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5 text-zinc-400" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      window.open(getExplorerUrl(network.id, newUser.wallets[network.id]), "_blank")
                                    }
                                    className="h-7 w-7 p-0"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null,
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500 italic">
                    No wallets generated yet. Click "Generate Wallets" to create addresses for all supported networks.
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-zinc-700 text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!newUser.firstName || !newUser.lastName || !newUser.email}
              >
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <User className="mr-2 h-5 w-5 text-emerald-500" />
                  {user.firstName} {user.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info" onValueChange={() => setActiveUserTab(user.id)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                    <TabsTrigger value="info">User Info</TabsTrigger>
                    <TabsTrigger value="wallets">Wallets</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-3 pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-zinc-500">Email</p>
                        <p className="text-sm text-zinc-300">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Phone</p>
                        <p className="text-sm text-zinc-300">{user.phone || "—"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Role</p>
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-zinc-800 text-zinc-300 mt-1">
                        {user.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Created</p>
                      <p className="text-sm text-zinc-300">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="wallets" className="pt-3">
                    {Object.keys(user.wallets || {}).length > 0 ? (
                      <div className="space-y-2">
                        {SUPPORTED_NETWORKS.map((network) =>
                          user.wallets && user.wallets[network.id] ? (
                            <div key={network.id} className="border-zinc-800">
                              <div
                                className="text-sm py-2 hover:no-underline cursor-pointer"
                                onClick={() => toggleUserWallets(user.id, network.id)}
                              >
                                <span className="flex items-center">
                                  <span className="mr-2">{network.icon}</span>
                                  {network.name}
                                </span>
                              </div>
                              {expandedUserWallets[`${user.id}-${network.id}`] && (
                                <div className="p-2 bg-zinc-800 rounded-md">
                                  <div className="flex justify-between items-center">
                                    <div className="font-mono text-xs break-all text-zinc-300">
                                      {user.wallets[network.id]}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          copyToClipboard(user.wallets[network.id], `${user.id}-${network.id}`)
                                        }
                                        className="h-7 w-7 p-0"
                                      >
                                        {copiedWallet === `${user.id}-${network.id}` ? (
                                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                                        ) : (
                                          <Copy className="h-3.5 w-3.5 text-zinc-400" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          window.open(getExplorerUrl(network.id, user.wallets[network.id]), "_blank")
                                        }
                                        className="h-7 w-7 p-0"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null,
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-500 italic py-4 text-center">
                        No wallets generated for this user.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <p className="text-zinc-400">No users found. Add a user to get started.</p>
        </div>
      )}
    </div>
  )
}

export default function UsersPage() {
  return (
    <LayoutWithNav>
      <UsersContent />
    </LayoutWithNav>
  )
}