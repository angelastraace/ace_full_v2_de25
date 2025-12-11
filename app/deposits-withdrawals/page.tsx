import LayoutWithNav from "@/components/layout-with-nav"

export default function DepositsWithdrawalsPage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6 text-white">Deposits & Withdrawals</h1>
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <p className="text-zinc-400">Deposit and withdrawal functionality will be implemented here.</p>
        </div>
      </div>
    </LayoutWithNav>
  )
}