type Role =
  | "admin"
  | "vip"
  | "founder"
  | "dao_voter"
  | "event_alpha";

const ROLE_CONFIG: Record<
  Role,
  {
    label: string;
    className: string;
  }
> = {
  admin: {
    label: "ADMIN",
    className:
      "bg-red-600 text-white animate-[pulse-red_1.8s_infinite]",
  },
  founder: {
    label: "FOUNDER",
    className:
      "bg-yellow-500 text-black animate-[pulse-gold_2s_infinite]",
  },
  dao_voter: {
    label: "DAO VOTER",
    className:
      "bg-emerald-500 text-black animate-[pulse-green_2.2s_infinite]",
  },
  vip: {
    label: "VIP",
    className:
      "bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.6)]",
  },
  event_alpha: {
    label: "ALPHA EVENT",
    className:
      "bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.8)]",
  },
};

export function RoleBadge({ role }: { role: Role }) {
  const config = ROLE_CONFIG[role];
  if (!config) return null;

  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}
