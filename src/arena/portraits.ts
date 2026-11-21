import data from "./data/portraits.json";

export const playerIds = ["player-01", "player-02", "player-03", "player-04"];

const portraits: Record<string, { neutral: string; open: string | null }> = data;
export function arenaPortrait(id: string, open = false): string {
  const portrait = portraits[id];
  return portrait ? import.meta.env.BASE_URL + "a1-story/" + ((open && portrait.open) || portrait.neutral) : "";
}
