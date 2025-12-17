"use client"

import { AuthProvider } from "@/contexts/auth-context"
import Nav from "@/components/nav"

export default function WithNavLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Nav />
      <main className="relative z-10">
        {children}
      </main>
    </AuthProvider>
  )
}
