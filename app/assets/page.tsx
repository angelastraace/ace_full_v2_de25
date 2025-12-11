import LayoutWithNav from "@/components/layout-with-nav"
import AssetManagement from "@/components/asset-management"

export default function AssetsPage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6 text-white">Assets Management</h1>
        <AssetManagement />
      </div>
    </LayoutWithNav>
  )
}