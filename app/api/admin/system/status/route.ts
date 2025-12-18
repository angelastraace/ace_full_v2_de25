import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/auth/assertAdmin";

export async function GET() {
  await assertAdmin();

  const { data } = await supabase
    .from("system_controls")
    .select("is_paused, paused_reason, paused_at")
    .eq("id", 1)
    .single();

  return NextResponse.json(data ?? { is_paused: false });
}
