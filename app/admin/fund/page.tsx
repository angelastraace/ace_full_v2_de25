import LayoutWithNav from "@/components/layout-with-nav"
import FundAdminWallet from "@/components/fund-admin-wallet"

export default function FundAdminPage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-white">Fund Admin Wallet</h1>
        <FundAdminWallet />
      </div>
    </LayoutWithNav>
  )
}