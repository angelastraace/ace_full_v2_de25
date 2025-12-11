"use client"

import type React from "react"
import { createContext, useContext } from "react"

interface AssetContextType {
  assets: Record<string, number>
}

const AssetContext = createContext<AssetContextType>({
  assets: {},
})

export function AssetProvider({ children }: { children: React.ReactNode }) {
  const assets = {
    BTC: 0.5,
    ETH: 5.0,
    USDT: 10000,
  }

  return <AssetContext.Provider value={{ assets }}>{children}</AssetContext.Provider>
}

export function useAsset() {
  return useContext(AssetContext)
}