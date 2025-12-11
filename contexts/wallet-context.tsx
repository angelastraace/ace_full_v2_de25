"use client"

import type React from "react"

import { createContext, useContext, useState, useCallback } from "react"
import { connectWallet, disconnectWallet, getWalletBalance } from "@/lib/wallet"

interface WalletContextType {
  address: string | null
  balance: string | null
  connected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  getBalance: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const connect = useCallback(async () => {
    const result = await connectWallet()
    if (result.success) {
      setAddress(result.address)
      setConnected(true)
      localStorage.setItem("connectedWallet", result.address)
    } else {
      throw new Error(result.error)
    }
  }, [])

  const disconnect = useCallback(async () => {
    const result = await disconnectWallet()
    if (result.success) {
      setAddress(null)
      setBalance(null)
      setConnected(false)
    } else {
      throw new Error(result.error)
    }
  }, [])

  const getBalance = useCallback(async () => {
    if (!address) return
    const result = await getWalletBalance(address)
    if (result.success) {
      setBalance(result.balance)
    }
  }, [address])

  return (
    <WalletContext.Provider value={{ address, balance, connected, connect, disconnect, getBalance }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return context
}