import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { tierGte } from "@/lib/tier/tierRank";
import { ownsNft } from "@/lib/cosmetics/assertNftOwnership";

export async function POST(req: Request) {
  // 1️⃣ Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2️⃣ Input
  const { category, skin_id } = await req.json();

  if (!category || !skin_id) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  // 3️⃣ Player tier
  const { data: state } = await supabase
    .from("player_state_cache")
    .select("tier")
    .eq("user_id", user.id)
    .single();

  const userTier = state?.tier ?? "Bronze";

  // 4️⃣ Load skin
  const { data: skin } = await supabase
    .from("cosmetic_skins")
    .select("*")
    .eq("id", skin_id)
    .single();

  if (!skin) {
    return NextResponse.json(
      { error: "Skin not found" },
      { status: 404 }
    );
  }

  // 5️⃣ Tier gate
  if (!tierGte(userTier, skin.min_tier)) {
    return NextResponse.json(
      { error: "Skin locked (tier)" },
      { status: 403 }
    );
  }

  // 6️⃣ NFT ownership gate (ONLY if NFT-based)
  if (skin.source === "nft") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("user_id", user.id)
      .single();

    const wallet = profile?.wallet_address;

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not connected" },
        { status: 403 }
      );
    }

    const owns = await ownsNft(wallet, skin.source_ref);

    if (!owns) {
      return NextResponse.json(
        { error: "Required NFT not owned" },
        { status: 403 }
      );
    }
  }

  // 7️⃣ Save cosmetic selection
  await supabase.from("user_cosmetics").upsert({
    user_id: user.id,
    category,
    skin_id,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
