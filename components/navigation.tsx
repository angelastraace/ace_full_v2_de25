"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  LayoutDashboard,
  Users,
  Activity,
  Wallet,
  CreditCard,
  Database,
  Settings,
  Shield,
  Menu,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  DollarSign,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function Navigation() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAdminSubmenuOpen, setIsAdminSubmenuOpen] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const navigateTo = (path: string) => {
    router.push(path)
  }

  return (
    <div
      className={`${isSidebarOpen ? "w-64" : "w-20"} bg-zinc-900 text-white transition-all duration-300 flex flex-col border-r border-zinc-800 h-screen fixed left-0 top-0 z-50`}
    >
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-emerald-500" />
          {isSidebarOpen && <span className="ml-2 font-bold text-lg">CryptoAdmin</span>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          {isSidebarOpen ? <ChevronDown className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="space-y-1 px-2">
          <NavItem
            icon={BarChart3}
            label="Dashboard"
            isActive={pathname === "/"}
            isCollapsed={!isSidebarOpen}
            onClick={() => navigateTo("/")}
          />

          {/* Admin Section with Submenu */}
          <div className="relative">
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md text-sm ${
                pathname.startsWith("/admin")
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
              onClick={() => {
                if (isSidebarOpen) {
                  setIsAdminSubmenuOpen(!isAdminSubmenuOpen)
                } else {
                  navigateTo("/admin")
                }
              }}
            >
              <LayoutDashboard className="h-5 w-5" />
              {isSidebarOpen && (
                <>
                  <span className="ml-3 flex-1">Admin Dashboard</span>
                  {isAdminSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </>
              )}
            </button>

            {/* Admin Submenu */}
            {isSidebarOpen && isAdminSubmenuOpen && (
              <div className="pl-8 mt-1 space-y-1">
                <NavItem
                  icon={Database}
                  label="Liquidity Pools"
                  isActive={pathname === "/admin/pools"}
                  isCollapsed={false}
                  onClick={() => navigateTo("/admin/pools")}
                  className="py-1.5 text-xs"
                />
                <NavItem
                  icon={Database}
                  label="Enhanced Pools"
                  isActive={pathname === "/admin/enhanced-pools"}
                  isCollapsed={false}
                  onClick={() => navigateTo("/admin/enhanced-pools")}
                  className="py-1.5 text-xs"
                />
                <NavItem
                  icon={Users}
                  label="Users"
                  isActive={pathname === "/admin/users"}
                  isCollapsed={false}
                  onClick={() => navigateTo("/admin/users")}
                  className="py-1.5 text-xs"
                />
                <NavItem
                  icon={Wallet}
                  label="Admin Wallet"
                  isActive={pathname === "/admin/wallet"}
                  isCollapsed={false}
                  onClick={() => navigateTo("/admin/wallet")}
                  className="py-1.5 text-xs"
                />
                <NavItem
                  icon={RefreshCw}
                  label="Uniswap V3"
                  isActive={pathname === "/admin/uniswap"}
                  isCollapsed={false}
                  onClick={() => navigateTo("/admin/uniswap")}
                  className="py-1.5 text-xs"
                />
                <NavItem
                  icon={RefreshCw}
                  label="Liquidity Manager"
                  isActive={pathname === "/admin/liquidity"}
                  isCollapsed={false}
                  onClick={() => navigateTo("/admin/liquidity")}
                  className="py-1.5 text-xs"
                />
                <NavItem
                  icon={Wallet}
                  label="Fund Admin"
                  isActive={pathname === "/admin/fund"}
                  isCollapsed={false}
                  onClick={() => navigateTo("/admin/fund")}
                  className="py-1.5 text-xs"
                />
                <NavItem
                  icon={DollarSign}
                  label="LP Funding"
                  isActive={pathname === "/admin/funding"}
                  isCollapsed={false}
                  onClick={() => navigateTo("/admin/funding")}
                  className="py-1.5 text-xs"
                />
              </div>
            )}
          </div>

          <NavItem
            icon={Activity}
            label="Transactions"
            isActive={pathname === "/transactions"}
            isCollapsed={!isSidebarOpen}
            onClick={() => navigateTo("/transactions")}
          />
          <NavItem
            icon={Wallet}
            label="Assets"
            isActive={pathname === "/assets"}
            isCollapsed={!isSidebarOpen}
            onClick={() => navigateTo("/assets")}
          />
          <NavItem
            icon={CreditCard}
            label="Deposits/Withdrawals"
            isActive={pathname === "/deposits-withdrawals"}
            isCollapsed={!isSidebarOpen}
            onClick={() => navigateTo("/deposits-withdrawals")}
          />
          <NavItem
            icon={Settings}
            label="Settings"
            isActive={pathname === "/settings"}
            isCollapsed={!isSidebarOpen}
            onClick={() => navigateTo("/settings")}
          />
        </nav>
      </div>
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-600">AD</AvatarFallback>
          </Avatar>
          {isSidebarOpen && (
            <div className="ml-3">
              <p className="text-sm font-medium">Admin User</p>
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-zinc-400 hover:text-white"
                onClick={() => navigateTo("/profile")}
              >
                View Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Component for navigation items
function NavItem({ icon: Icon, label, isActive = false, isCollapsed = false, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-3 py-2 rounded-md text-sm ${
        isActive ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      } ${isCollapsed ? "justify-center" : ""} ${className}`}
    >
      <Icon className="h-5 w-5" />
      {!isCollapsed && <span className="ml-3">{label}</span>}
    </button>
  )
}