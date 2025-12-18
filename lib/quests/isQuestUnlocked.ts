export function isQuestUnlocked({
  chainId,
  chainStep,
  completedStep,
}: {
  chainId: string | null;
  chainStep: number | null;
  completedStep: number;
}) {
  if (!chainId) return true; // not part of a chain
  return chainStep === completedStep + 1;
}
