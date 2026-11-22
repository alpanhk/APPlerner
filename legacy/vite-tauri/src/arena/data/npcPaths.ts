import NPC_PORTRAITS from "./portraits.json";

export type NPCFrameId = "neutral" | "smile" | "question" | "think" | "talkOpen" | "talkSmall" | "preview";
export interface NPCPortrait {
  name: string;
  status?: string;
  frames: Record<NPCFrameId, string>;
}

export function npcPath(characterId: string, frameId: NPCFrameId): string {
  const entry = (NPC_PORTRAITS as unknown as Record<string, NPCPortrait>)[characterId];
  const rel = entry ? entry.frames[frameId] : `${characterId}/neutral.webp`;
  return `a1-story/${rel}`;
}
