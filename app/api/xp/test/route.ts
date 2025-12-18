import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { awardXP } from "@/lib/server/awardXP";

export async function POST() {
  try {
    // 1️⃣ Create Supabase SSR client
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // 2️⃣ Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 3️⃣ Award XP (service role)
    const result = await awardXP({
      userId: user.id,
      amount: 10,
      reason: "TEST_XP",
    });

    // 4️⃣ Success response
    return NextResponse.json({
      ok: true,
      awarded: 10,
      newLevel: result.level,
      totalXP: result.totalXP,
    });
  } catch (err: any) {
    console.error("XP TEST ERROR:", err);

    return new Response(
      JSON.stringify({
        error: "XP test failed",
        message: err?.message,
        stack: err?.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
