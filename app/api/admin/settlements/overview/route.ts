import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/auth/assertAdmin";

export async function GET() {
  await assertAdmin();

  const { data: rows } = await supabase
    .from("onchain_settlement_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: stats } = await supabase.rpc(
    "settlement_status_counts"
  );

  return NextResponse.json({
    rows: rows ?? [],
    stats: stats ?? [],
  });
}
