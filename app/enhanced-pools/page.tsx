import LayoutWithNav from "@/components/layout-with-nav"
import EnhancedPoolReserves from "@/components/enhanced-pool-reserves"

export default function EnhancedPoolsPage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-white">Enhanced Liquidity Pool Monitor</h1>
        <EnhancedPoolReserves />
      </div>
    </LayoutWithNav>
  )
}