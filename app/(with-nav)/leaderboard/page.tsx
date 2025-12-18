import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getUserWithRoles } from "@/lib/auth/getUserWithRoles";

type LeaderboardRow = {
  user_id: string;
  total_xp: number;
  level: number;
  rank: string;
};

export default async function LeaderboardPage() {
  const auth = await getUserWithRoles();

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
    .from("user_xp")
    .select("user_id, total_xp, level, rank")
    .order("total_xp", { ascending: false })
    .limit(50);

  const leaderboard = (data ?? []) as LeaderboardRow[];

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 ace-glow">Leaderboard</h1>
      <p className="opacity-60 mb-6">
        Top explorers ranked by XP
      </p>

      <div className="border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-right">Level</th>
              <th className="px-4 py-3 text-right">XP</th>
              <th className="px-4 py-3 text-right">Rank</th>
            </tr>
          </thead>

          <tbody>
            {leaderboard.map((row, i) => {
              const isYou = auth?.user.id === row.user_id;

              return (
                <tr
                  key={row.user_id}
                  className={`border-t border-white/10 ${
                    isYou ? "bg-cyan-500/10 pulse-glow" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono">
                    {i + 1}
                  </td>

                  <td className="px-4 py-3">
                    {isYou ? (
                      <span className="font-bold ace-glow">
                        You
                      </span>
                    ) : (
                      <span className="opacity-80">
                        {row.user_id.slice(0, 6)}…
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {row.level}
                  </td>

                  <td className="px-4 py-3 text-right font-mono">
                    {row.total_xp.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.rank === "Legend"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : row.rank === "Elite"
                          ? "bg-purple-500/20 text-purple-300"
                          : row.rank === "Veteran"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-white/10"
                      }`}
                    >
                      {row.rank}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
