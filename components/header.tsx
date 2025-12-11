"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 border-b border-cyan-500/20 bg-[#001219]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="ace-glow text-2xl font-black">ACE</div>
              <span className="text-xs text-cyan-400">EXCHANGE</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/trade" className="text-sm text-gray-300 hover:text-cyan-400 transition">
                Trade
              </Link>
              <Link href="/earn" className="text-sm text-gray-300 hover:text-cyan-400 transition">
                Earn
              </Link>
              <Link href="/markets" className="text-sm text-gray-300 hover:text-cyan-400 transition">
                Markets
              </Link>
              <Link href="/launchpad" className="text-sm text-gray-300 hover:text-cyan-400 transition">
                Launchpad
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-950 bg-transparent"
              >
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-cyan-500 text-black hover:bg-cyan-400">
                Sign Up
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-cyan-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link href="/trade" className="block text-sm text-gray-300 hover:text-cyan-400">
              Trade
            </Link>
            <Link href="/earn" className="block text-sm text-gray-300 hover:text-cyan-400">
              Earn
            </Link>
            <Link href="/markets" className="block text-sm text-gray-300 hover:text-cyan-400">
              Markets
            </Link>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1 border-cyan-500 text-cyan-400 bg-transparent">
                Login
              </Button>
              <Button size="sm" className="flex-1 bg-cyan-500 text-black">
                Sign Up
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}