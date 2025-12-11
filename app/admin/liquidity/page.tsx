import LayoutWithNav from "@/components/layout-with-nav"
import UniswapLiquidityManager from "@/components/uniswap-liquidity-manager"

export default function UniswapLiquidityPage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-white">Uniswap V3 Liquidity Management</h1>
        <UniswapLiquidityManager />
      </div>
    </LayoutWithNav>
  )
}