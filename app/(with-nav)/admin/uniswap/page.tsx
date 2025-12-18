import LayoutWithNav from "@/components/layout-with-nav"
import UniswapOperations from "@/components/uniswap-operations"
import AddLiquidityForm from "@/components/add-liquidity-form"
import SwapAndSendForm from "@/components/swap-and-send-form"

export default function UniswapPage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10 max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Uniswap V3 Operations</h1>
        <UniswapOperations />
        <h2 className="text-xl font-bold mt-8 text-white">Add Liquidity</h2>
        <AddLiquidityForm />
        <h2 className="text-xl font-bold mt-8 text-white">Swap and Send to Admin</h2>
        <SwapAndSendForm />
      </div>
    </LayoutWithNav>
  )
}