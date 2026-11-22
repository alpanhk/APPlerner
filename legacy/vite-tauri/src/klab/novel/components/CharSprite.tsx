import type { CharId, Expression, PlayerProfile, StageChar } from "../types";
import { CHAR_FRAMES } from "../data/story-media.generated";
import { NPC_LOOKS, playerLook, Portrait } from "./Portrait";

/**
 * PILOT-AGENT-1 — potret produksi berbasis frame (Mandat §4/§5.2).
 * Karakter dengan frame produksi (4 avatar + mia/tutor/tetangga/pos/
 * petugas-stasiun/eva/pendatang-baru) dirender dari berkas webp; profil lama
 * tanpa characterId tetap memakai potret SVG lama agar progres lama tak berubah.
 * Mulut berganti frame HANYA pada tokoh yang audionya sedang bermain, dan
 * tubuh/kamera tidak bergerak antar frame (Mandat §5.4).
 */
interface Props {
  id: CharId;
  expr?: Expression;
  speaking: boolean;
  mouthOpen: boolean;
  player: PlayerProfile;
  prop?: StageChar["prop"];
  className?: string;
  title?: string;
}

export function CharSprite({ id, expr, speaking, mouthOpen, player, prop, className, title }: Props) {
  const expression = expr ?? "neutral";
  const frameKey = id === "player" ? (player.characterId ?? "") : id;
  const frames = frameKey ? CHAR_FRAMES[frameKey] : undefined;

  if (frames) {
    const src = speaking
      ? mouthOpen ? frames.speakOpen : frames.speakSmall
      : expression === "smile" ? frames.smile
        : expression === "question" ? frames.question
          : frames.neutral;
    return (
      <img
        src={src}
        alt=""
        role="img"
        aria-label={title ?? ""}
        draggable={false}
        className={className}
      />
    );
  }

  // Fallback: potret prosedural lama (progres tanpa avatar produksi).
  const look = id === "player" ? playerLook(player) : NPC_LOOKS[id as Exclude<CharId, "player">];
  return (
    <Portrait
      look={look}
      expr={expression}
      mouthOpen={speaking && mouthOpen}
      prop={prop}
      className={className}
      title={title}
    />
  );
}
