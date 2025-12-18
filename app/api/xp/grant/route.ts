import { updatePlayerState } from "@/lib/player/updatePlayerState";
import { getActiveSeason } from "@/lib/season/getActiveSeason";
import { trustXpMultiplier } from "@/lib/trust/trustXpMultiplier";

// 1️⃣ normalize XP (you already did this earlier)
const { effectiveXp } = normalizeXp(
  base_xp,
  alreadyEarned,
  cap
);

// 2️⃣ fetch trust score
const { data: state } = await supabase
  .from("player_state_cache")
  .select("trust_score")
  .eq("user_id", user_id)
  .single();

const trustScore = state?.trust_score ?? 100;

// 3️⃣ apply trust throttling
const trustMultiplier = trustXpMultiplier(trustScore);

const finalXp = Math.floor(effectiveXp * trustMultiplier);

// Safety guard
if (finalXp <= 0) {
  return NextResponse.json({
    applied_xp: 0,
    throttled: true,
    trust_multiplier: trustMultiplier,
  });
}

// 4️⃣ insert XP event (optional but recommended)
await supabase.from("xp_events").insert({
  user_id,
  base_xp,
  effective_xp: finalXp,
  trust_multiplier: trustMultiplier,
  trust_score: trustScore,
  source,
});

// 5️⃣ update global player state
await updatePlayerState(user_id, finalXp);

// 6️⃣ update seasonal XP
const season = await getActiveSeason();

if (season) {
  await supabase
    .from("player_seasons")
    .upsert(
      {
        user_id,
        season_id: season.id,
        season_xp: finalXp,
      },
      {
        onConflict: "user_id,season_id",
      }
    );
}
