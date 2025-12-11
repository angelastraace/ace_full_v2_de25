import LayoutWithNav from "@/components/layout-with-nav"
import PoolReserves from "@/components/pool-reserves"

export default function PoolsPage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-white">Liquidity Pool Management</h1>
        <PoolReserves />
      </div>
    </LayoutWithNav>
  )
}