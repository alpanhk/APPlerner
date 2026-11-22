import type { CharId, PlayerProfile, StageState } from "../types";
import { bgSrc } from "../data/media-manifest";
import { arenaPortrait, playerIds } from "../portraits";

interface Props {
  stage: StageState;
  player: PlayerProfile;
  speakingChar: CharId | null;
  mouthOpen: boolean;
  reducedMotion: boolean;
  dim?: boolean;
}

export function Stage({ stage, player, speakingChar, mouthOpen, reducedMotion, dim }: Props) {
  const trans = reducedMotion ? "" : "transition-opacity duration-500";
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1f2740]">
      {/* Latar statis */}
      <img
        key={stage.bg}
        src={bgSrc(stage.bg)}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover ${trans} ${reducedMotion ? "" : "animate-[fadein_.5s_ease]"}`}
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1b2033]/70 via-transparent to-[#1b2033]/10" />

      {/* Potret karakter: diam; hanya mulut penutur yang berganti frame */}
      {stage.chars.map((c) => {
        const portraitId = c.id === "player" ? player.portrait ?? playerIds[0] : c.id;
        const isSpeaking = speakingChar === c.id && !reducedMotion;
        const pos =
          c.side === "left"
            ? "left-[2%] md:left-[6%]"
            : c.side === "right"
              ? "right-[2%] md:right-[6%]"
              : "left-1/2 -translate-x-1/2";
        const inactive = speakingChar !== null && !isSpeaking;
        return (
          <div
            key={c.id}
            className={`absolute bottom-[26%] h-[66%] md:h-[72%] ${pos} ${dim ? "opacity-40" : ""}`}
            style={{ aspectRatio: "320/440", filter: inactive ? "brightness(0.82)" : "none" }}
            data-char={c.id}
            data-mouth={isSpeaking && mouthOpen ? "open" : "closed"}
          >
            <img src={arenaPortrait(portraitId, isSpeaking && mouthOpen)}
              alt="" className="h-full w-full object-contain drop-shadow-lg" draggable={false} />
          </div>
        );
      })}

      {/* Overlay properti */}
      {stage.overlay && (
        <div className="absolute inset-0 flex items-start justify-center pt-[6%]">
          <div className={`${reducedMotion ? "" : "animate-[fadein_.4s_ease]"}`}>
            {stage.overlay === "note" && <NoteCard />}
            {stage.overlay === "envelope" && <Envelope name={player.name} />}
            {stage.overlay === "letter" && <Letter />}
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard() {
  return (
    <svg viewBox="0 0 360 240" className="w-[56%] max-w-[520px] drop-shadow-[0_10px_18px_rgba(0,0,0,.35)]" role="img" aria-label="Catatan bertuliskan Guten Morgen!">
      <path d="M14 20 L346 12 L350 226 L10 232 Z" fill="#f7efdd" stroke="#3a3040" strokeWidth={2.5} />
      <path d="M30 60 L330 56 M30 100 L330 96 M30 140 L330 136 M30 180 L330 176" stroke="#c9b99a" strokeWidth={1.2} />
      <text x={180} y={118} textAnchor="middle" fontFamily="'Caveat','Segoe Script','Comic Sans MS',cursive" fontSize={56} fill="#2c3e6b" transform="rotate(-1.5 180 118)">
        Guten Morgen!
      </text>
      <g transform="translate(250 165)">
        <path d="M0 0 h50 v30 q0 16 -25 16 q-25 0 -25 -16 Z" fill="#fff" stroke="#b5533c" strokeWidth={2.5} />
        <path d="M50 8 q18 0 18 12 q0 12 -18 12" fill="none" stroke="#b5533c" strokeWidth={2.5} />
        <path d="M14 -10 q4 -6 0 -12 M28 -10 q4 -6 0 -12" fill="none" stroke="#b5533c" strokeWidth={2} opacity={0.6} />
      </g>
    </svg>
  );
}

function Envelope({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 420 260" className="w-[52%] max-w-[480px] drop-shadow-[0_10px_18px_rgba(0,0,0,.35)]" role="img" aria-label={`Amplop tertutup bertuliskan ${name}`}>
      <rect x={10} y={20} width={400} height={230} rx={8} fill="#f6efe2" stroke="#3a3040" strokeWidth={2.5} />
      <path d="M10 28 L210 150 L410 28" fill="#efe4cf" stroke="#3a3040" strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={210} cy={150} r={14} fill="#b5533c" stroke="#3a3040" strokeWidth={2} />
      <rect x={330} y={40} width={56} height={44} fill="#2c3e6b" opacity={0.85} />
      <text x={358} y={70} textAnchor="middle" fontSize={22} fill="#f6efe2" fontFamily="serif">
        ✉
      </text>
      <text x={210} y={215} textAnchor="middle" fontFamily="'Caveat','Segoe Script',cursive" fontSize={34} fill="#2c3e6b">
        Für {name}
      </text>
    </svg>
  );
}

function Letter() {
  return (
    <svg viewBox="0 0 420 300" className="w-[56%] max-w-[520px] drop-shadow-[0_10px_18px_rgba(0,0,0,.35)]" role="img" aria-label="Surat terbuka: gambar cangkir, nama Mia, dan tulisan Bis morgen!">
      <path d="M20 16 L400 10 L404 288 L16 294 Z" fill="#fbf5e8" stroke="#3a3040" strokeWidth={2.5} />
      <path d="M44 70 L380 66 M44 110 L380 106 M44 150 L380 146 M44 190 L380 186 M44 230 L380 226" stroke="#d8c9a8" strokeWidth={1.2} />
      <g transform="translate(60 90)">
        <path d="M0 0 h70 v44 q0 22 -35 22 q-35 0 -35 -22 Z" fill="#fff" stroke="#b5533c" strokeWidth={3} />
        <path d="M70 10 q24 0 24 16 q0 16 -24 16" fill="none" stroke="#b5533c" strokeWidth={3} />
        <ellipse cx={35} cy={78} rx={44} ry={6} fill="none" stroke="#b5533c" strokeWidth={2.5} />
        <path d="M22 -12 q6 -8 0 -16 M40 -12 q6 -8 0 -16" fill="none" stroke="#b5533c" strokeWidth={2.5} opacity={0.6} />
      </g>
      <text x={260} y={135} textAnchor="middle" fontFamily="'Caveat','Segoe Script',cursive" fontSize={54} fill="#2c3e6b" transform="rotate(-2 260 135)">
        Bis morgen!
      </text>
      <text x={330} y={240} textAnchor="middle" fontFamily="'Caveat','Segoe Script',cursive" fontSize={40} fill="#b5533c" transform="rotate(-3 330 240)">
        — Mia
      </text>
    </svg>
  );
}
