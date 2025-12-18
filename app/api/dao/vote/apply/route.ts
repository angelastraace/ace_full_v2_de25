// app/api/admin/dao/apply/route.ts
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { proposalId } = await req.json();

  const { data: proposal } = await supabase
    .from("dao_proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (!proposal || proposal.status !== "open") {
    return NextResponse.json({ error: "Invalid proposal" }, { status: 400 });
  }

  const { data: votes } = await supabase
    .from("dao_votes")
    .select("choice, weight")
    .eq("proposal_id", proposalId);

  const yes = votes?.filter(v => v.choice === "yes").reduce((s, v) => s + v.weight, 0) ?? 0;
  const no = votes?.filter(v => v.choice === "no").reduce((s, v) => s + v.weight, 0) ?? 0;

  if (yes < proposal.quorum || yes <= no) {
    await supabase.from("dao_proposals").update({ status: "rejected" }).eq("id", proposalId);
    return NextResponse.json({ rejected: true });
  }

  // merge config
  const { data: current } = await supabase.from("fee_config").select("config").eq("id", 1).single();
  const merged = { ...current.config, ...proposal.payload };

  await supabase.from("fee_config").update({ config: merged }).eq("id", 1);
  await supabase.from("dao_proposals").update({ status: "applied" }).eq("id", proposalId);

  return NextResponse.json({ applied: true });
}
