import LayoutWithNav from "@/components/layout-with-nav"
import ClientWrapper from "./client-wrapper"
import UniswapLiquidityManager from "@/components/uniswap-liquidity-manager"

export default function AdminWalletPage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10 max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-white">Admin Wallet Management</h1>
        <ClientWrapper />
        <h2 className="text-xl font-bold mt-8 text-white">Uniswap V3 Liquidity Management</h2>
        <UniswapLiquidityManager />
      </div>
    </LayoutWithNav>
  )
}