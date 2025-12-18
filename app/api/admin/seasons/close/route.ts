// app/api/admin/seasons/close/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { updateSeasonRanks } from "@/lib/leaderboard/updateSeasonRanks";
import { distributeSeasonRewards } from "@/lib/season/distributeSeasonRewards";
import { closeSeason } from "@/lib/season/closeSeason";

export async function POST(req: Request) {
  const { seasonId } = await req.json();

  if (!seasonId) {
    return NextResponse.json(
      { error: "Missing seasonId" },
      { status: 400 }
    );
  }

  // OPTIONAL: add admin auth check here
  // Example: verify user role === admin

  try {
    // 1️⃣ Freeze final ranks
    await updateSeasonRanks(seasonId);

    // 2️⃣ Distribute rewards (idempotent)
    await distributeSeasonRewards(seasonId);

    // 3️⃣ Close season & roll XP
    await closeSeason(seasonId);

    return NextResponse.json({
      success: true,
      seasonId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
