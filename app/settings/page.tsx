import LayoutWithNav from "@/components/layout-with-nav"

export default function SettingsPage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6 text-white">Settings</h1>
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <p className="text-zinc-400">System settings will be implemented here.</p>
        </div>
      </div>
    </LayoutWithNav>
  )
}