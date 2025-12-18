import LayoutWithNav from "@/components/layout-with-nav"
import EnhancedPoolReserves from "@/components/enhanced-pool-reserves"

export default function AdminEnhancedPoolsPage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-white">Admin Enhanced Liquidity Pool Monitor</h1>
        <EnhancedPoolReserves />
      </div>
    </LayoutWithNav>
  )
}