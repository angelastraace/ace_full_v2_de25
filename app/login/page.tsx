"use client"

import type React from "react"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signIn(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      <div className="pt-20 pb-20 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="ace-glow-box p-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-400 mb-8">Login to your ACE Exchange account</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-3 text-white placeholder-gray-600"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-3 text-white placeholder-gray-600"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-400">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <Link href="/forgot-password" className="text-cyan-400 hover:text-cyan-300">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="p-3 bg-red-950/50 border border-red-500/30 rounded text-red-400 text-sm">{error}</div>
              )}

              <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold py-6" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Don't have an account?{" "}
                <Link href="/signup" className="text-cyan-400 hover:text-cyan-300">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}