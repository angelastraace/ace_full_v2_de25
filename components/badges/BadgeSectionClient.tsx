"use client";

import { BadgeGridClient } from "./BadgeGridClient";

type Props = {
  badges: any[];
  earnedCodes: Set<string>;
  recentlyUnlockedCode: string | null;
};

export function BadgeSectionClient({
  badges,
  earnedCodes,
  recentlyUnlockedCode,
}: Props) {
  return (
    <BadgeGridClient
      badges={badges}
      earnedCodes={earnedCodes}
      recentlyUnlockedCode={recentlyUnlockedCode}
    />
  );
}
