import { supabase } from "@/lib/supabase";

type LogParams = {
  adminUserId: string;
  action: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
};

export async function logAdminAction({
  adminUserId,
  action,
  targetId,
  metadata,
  ipAddress,
  userAgent,
}: LogParams) {
  await supabase.from("admin_audit_log").insert({
    admin_user_id: adminUserId,
    action,
    target_id: targetId ?? null,
    metadata: metadata ?? null,
    ip_address: ipAddress ?? null,
    user_agent: userAgent ?? null,
  });
}
