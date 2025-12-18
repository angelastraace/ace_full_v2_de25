import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { seasonIds } = await req.json();

  const { data } = await supabase
    .from("seasons")
    .select("id, name")
    .in("id", seasonIds);

  const map: Record<string, string> = {};
  for (const s of data ?? []) {
    map[s.id] = s.name;
  }

  return NextResponse.json({ seasons: map });
}
