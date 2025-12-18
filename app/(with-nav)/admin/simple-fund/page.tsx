import LayoutWithNav from "@/components/layout-with-nav"
import SimpleFundAdmin from "@/components/simple-fund-admin"

export default function SimpleFundPage() {
  // Get the admin wallet address from environment variable
  const adminWalletAddress = process.env.ADMIN_WALLET || "0x5E6c692142915ECB0ab39deBcfB38609216D61B8"

  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10 max-w-xl">
        <h1 className="text-2xl font-bold mb-6 text-white">Simple Admin Wallet Funding</h1>
        <SimpleFundAdmin adminWalletAddress={adminWalletAddress} />

        <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <h2 className="text-lg font-medium text-white mb-2">About This Page</h2>
          <p className="text-zinc-400">
            This simplified interface allows you to fund the admin wallet using our secure server-side actions. Unlike
            client-side approaches that require exposing private keys, this method keeps all sensitive information on
            the server.
          </p>
        </div>
      </div>
    </LayoutWithNav>
  )
}