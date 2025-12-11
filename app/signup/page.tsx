"use client"

import type React from "react"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      await signUp(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
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
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-gray-400 mb-8">Join ACE Exchange today</p>

            <form onSubmit={handleSignup} className="space-y-4">
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

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-3 text-white placeholder-gray-600"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="rounded"
                  required
                />
                <label htmlFor="agree" className="text-sm text-gray-400">
                  I agree to Terms and Privacy Policy
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-950/50 border border-red-500/30 rounded text-red-400 text-sm">{error}</div>
              )}

              <Button
                disabled={!agreed || loading}
                className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold py-6"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
                  Login here
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