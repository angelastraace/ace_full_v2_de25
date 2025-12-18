import LayoutWithNav from "@/components/layout-with-nav"
import FundingDashboard from "@/components/funding-dashboard"

export default function FundingPage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-white">LP Funding Dashboard</h1>
        <FundingDashboard />
      </div>
    </LayoutWithNav>
  )
}