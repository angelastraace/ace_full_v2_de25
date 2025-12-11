import LayoutWithNav from "@/components/layout-with-nav"
import ClientFundAdmin from "@/components/client-fund-admin"

export default function ClientFundPage() {
  // Get the admin wallet address from environment variable
  const adminWalletAddress = process.env.ADMIN_WALLET || "0x5E6c692142915ECB0ab39deBcfB38609216D61B8"

  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10 max-w-xl">
        <h1 className="text-2xl font-bold mb-6 text-white">Client-Side Admin Wallet Funding</h1>
        <ClientFundAdmin adminWalletAddress={adminWalletAddress} />

        <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <h2 className="text-lg font-medium text-white mb-2">About This Approach</h2>
          <p className="text-zinc-400 mb-3">
            This page demonstrates a client-side approach to funding the admin wallet. Unlike the server-side method,
            this approach:
          </p>
          <ul className="list-disc pl-5 text-zinc-400 space-y-1">
            <li>Requires the user to connect their own wallet (like MetaMask)</li>
            <li>Uses the user's wallet to sign and send transactions</li>
            <li>Doesn't require server-side private keys</li>
            <li>Puts transaction fees on the user rather than the admin</li>
          </ul>
          <p className="text-zinc-400 mt-3">
            This approach is useful when you want users to fund the admin wallet directly from their own accounts.
          </p>
        </div>
      </div>
    </LayoutWithNav>
  )
}