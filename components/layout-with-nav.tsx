"use client"

import type React from "react"
import Navigation from "@/components/navigation"

export default function LayoutWithNav({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Navigation />
      <div className="flex-1 ml-64">{children}</div>
    </div>
  )
}