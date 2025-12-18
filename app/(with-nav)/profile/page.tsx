import LayoutWithNav from "@/components/layout-with-nav"
import { resolveAvatar } from "@/lib/avatar/resolveAvatar";
import { AceKatAvatar } from "@/components/avatar/AceKatAvatar";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  return (
    <LayoutWithNav>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6 text-white">User Profile</h1>
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <p className="text-zinc-400">User profile settings will be implemented here.</p>
        </div>
      </div>
    </LayoutWithNav>
  )
}