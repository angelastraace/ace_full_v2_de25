import { supabase } from "@/lib/supabase";

export async function assertNotPaused(
  scope: "trade" | "settlement" | "rewards" | "withdrawals"
) {
  const { data } = await supabase
    .from("system_controls")
    .select("is_paused, paused_reason")
    .eq("id", 1)
    .single();

  if (data?.is_paused) {
    throw new Error(
      `System paused (${scope}): ${data.paused_reason ?? "no reason"}`
    );
  }
}
