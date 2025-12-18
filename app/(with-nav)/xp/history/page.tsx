import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getUserWithRoles } from "@/lib/auth/getUserWithRoles";

type XPEvent = {
  id: string;
  source: string;
  base_xp: number;
  multiplier: number;
  total_xp: number;
  created_at: string;
};

export default async function XPHistoryPage() {
  const auth = await getUserWithRoles();
  if (!auth) return null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookies().get(name)?.value,
      },
    }
  );

  const { data } = await supabase
    .from("xp_events")
    .select("id, source, base_xp, multiplier, total_xp, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  const events = (data ?? []) as XPEvent[];

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <h1 className="text-3xl font-bold ace-glow mb-2">
        XP History
      </h1>
      <p className="opacity-60 mb-6">
        Every XP point you’ve earned, fully transparent.
      </p>

      <div className="border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-right">Base XP</th>
              <th className="px-4 py-3 text-right">Multiplier</th>
              <th className="px-4 py-3 text-right">Total XP</th>
            </tr>
          </thead>

          <tbody>
            {events.map((e) => (
              <tr
                key={e.id}
                className="border-t border-white/10"
              >
                <td className="px-4 py-3 opacity-70">
                  {new Date(e.created_at).toLocaleString()}
                </td>

                <td className="px-4 py-3 capitalize">
                  {e.source}
                </td>

                <td className="px-4 py-3 text-right font-mono">
                  {e.base_xp}
                </td>

                <td className="px-4 py-3 text-right font-mono">
                  ×{e.multiplier}
                </td>

                <td className="px-4 py-3 text-right font-mono text-cyan-400">
                  +{e.total_xp}
                </td>
              </tr>
            ))}

            {events.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center opacity-50"
                >
                  No XP earned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
