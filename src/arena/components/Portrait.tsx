import type { Expression, HairStyle, PlayerProfile } from "../types";

// ===== Potret karakter (pinggang ke atas) =====
// Semua karakter memakai rangka yang sama. Hanya bagian mulut yang berganti
// antara frame "tertutup" dan "berbicara"; tubuh, rambut, dan kamera diam.

const INK = "#3a3040";
const SW = 2.4;

export interface CharLook {
  name: string;
  skin: string;
  hair: string;
  hairStyle: HairStyle | "bun";
  outfit: string;
  accent?: string;
  glasses?: boolean;
  scarf?: boolean;
  cap?: "post" | "flat";
  bag?: boolean;
}

export const NPC_LOOKS: Record<string, CharLook> = {
  tutor: { name: "Frau Lehmann", skin: "#e9c3a3", hair: "#b9b1ad", hairStyle: "bun", outfit: "#3f7d7a", accent: "#b5533c", glasses: true, scarf: true },
  mia: { name: "Mia", skin: "#f1d2b8", hair: "#d8a85a", hairStyle: "bob", outfit: "#b5533c", accent: "#f0dcc5" },
  pos: { name: "Petugas pos", skin: "#d9a87c", hair: "#4a3326", hairStyle: "short", outfit: "#e8b429", accent: "#2c3e6b", cap: "post", bag: true },
  tetangga: { name: "Herr Bauer", skin: "#e2b89a", hair: "#9a948f", hairStyle: "short", outfit: "#6b7f58", accent: "#4a4a3a", cap: "flat" },
};

export const SPEAKER_NAMES: Record<string, string> = {
  tutor: "Frau Lehmann (tutor)",
  mia: "Mia",
  pos: "Petugas pos",
  barista: "Pelayan",
  "penjual-pasar": "Penjual pasar",
  "penjual-mandiri-ch02": "Penjual kios lain",
  tetangga: "Herr Bauer",
  narator: "",
  player: "",
};

export function playerLook(p: PlayerProfile): CharLook {
  return { name: p.name, skin: p.skin, hair: p.hairColor, hairStyle: p.hair, outfit: p.outfit, accent: "#f3e9d8" };
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

interface Props {
  look: CharLook;
  expr: Expression;
  mouthOpen: boolean;
  prop?: "envelope";
  className?: string;
  title?: string;
}

export function Portrait({ look, expr, mouthOpen, prop, className, title }: Props) {
  const hairDark = shade(look.hair, -30);
  const outfitDark = shade(look.outfit, -35);

  // ----- Rambut: lapisan belakang -----
  const backHair = (() => {
    switch (look.hairStyle) {
      case "bob":
        return <path d="M98 120 Q92 70 160 64 Q228 70 222 120 L226 196 Q226 214 206 214 L114 214 Q94 214 94 196 Z" fill={look.hair} stroke={INK} strokeWidth={SW} />;
      case "long":
        return <path d="M98 120 Q92 66 160 62 Q228 66 222 120 L236 300 Q236 316 214 316 L106 316 Q84 316 84 300 Z" fill={look.hair} stroke={INK} strokeWidth={SW} />;
      case "curly":
        return (
          <g fill={look.hair} stroke={INK} strokeWidth={SW}>
            {[[104, 120], [96, 160], [100, 198], [216, 120], [224, 160], [220, 198], [122, 86], [160, 72], [198, 86]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={26} />
            ))}
          </g>
        );
      case "bun":
        return (
          <g fill={look.hair} stroke={INK} strokeWidth={SW}>
            <circle cx={196} cy={78} r={22} />
            <path d="M102 130 Q100 70 160 66 Q220 70 218 130 L214 160 L106 160 Z" />
          </g>
        );
      default:
        return null;
    }
  })();

  // ----- Rambut: lapisan depan (poni) -----
  const frontHair = (() => {
    if (look.cap === "post") {
      return (
        <g>
          <path d="M104 118 Q106 92 160 88 Q214 92 216 118 Q190 106 160 106 Q130 106 104 118 Z" fill={look.hair} stroke={INK} strokeWidth={SW} />
          <path d="M100 108 Q104 62 160 58 Q216 62 220 108 Z" fill={look.outfit} stroke={INK} strokeWidth={SW} />
          <path d="M92 110 Q160 96 228 110 Q160 124 92 110 Z" fill={look.accent} stroke={INK} strokeWidth={SW} />
          <circle cx={160} cy={84} r={7} fill={look.accent} stroke={INK} strokeWidth={1.5} />
        </g>
      );
    }
    if (look.cap === "flat") {
      return (
        <g>
          <path d="M104 124 Q106 100 160 96 Q214 100 216 124 Q190 112 160 112 Q130 112 104 124 Z" fill={look.hair} stroke={INK} strokeWidth={SW} />
          <path d="M98 112 Q100 66 160 62 Q222 66 222 112 Q190 102 160 102 Q130 102 98 112 Z" fill={look.accent} stroke={INK} strokeWidth={SW} />
          <path d="M160 102 Q200 100 234 112 Q200 116 160 112 Z" fill={shade(look.accent ?? "#444", -20)} stroke={INK} strokeWidth={SW} />
        </g>
      );
    }
    switch (look.hairStyle) {
      case "curly":
        return (
          <g fill={look.hair} stroke={INK} strokeWidth={SW}>
            <circle cx={118} cy={104} r={22} />
            <circle cx={146} cy={88} r={22} />
            <circle cx={176} cy={86} r={22} />
            <circle cx={204} cy={104} r={22} />
          </g>
        );
      case "bob":
        return <path d="M100 126 Q98 70 160 66 Q222 70 220 126 Q206 98 170 100 Q146 98 128 112 Q112 120 100 126 Z" fill={hairDark} stroke={INK} strokeWidth={SW} />;
      case "long":
        return <path d="M100 126 Q98 68 160 64 Q222 68 220 126 Q200 100 160 100 Q120 100 100 126 Z" fill={hairDark} stroke={INK} strokeWidth={SW} />;
      case "bun":
        return <path d="M102 130 Q100 72 160 68 Q220 72 218 130 Q196 104 160 104 Q124 104 102 130 Z" fill={look.hair} stroke={INK} strokeWidth={SW} />;
      default:
        return <path d="M100 128 Q98 68 160 64 Q222 68 220 128 Q208 100 176 104 Q150 96 130 112 Q114 118 100 128 Z" fill={look.hair} stroke={INK} strokeWidth={SW} />;
    }
  })();

  // ----- Ekspresi: alis & mata -----
  const brows = {
    neutral: ["M124 124 Q138 117 152 123", "M168 123 Q182 117 196 124"],
    smile: ["M124 120 Q138 112 152 119", "M168 119 Q182 112 196 120"],
    question: ["M122 114 Q138 104 154 118", "M168 126 Q182 123 196 126"],
    think: ["M124 128 Q138 123 152 126", "M168 126 Q182 123 196 129"],
  }[expr];
  const irisDx = expr === "think" ? 3 : 0;
  const irisDy = expr === "think" ? -2 : 0;

  // ----- Mulut: dua frame sejajar pada titik (160,193) -----
  const mouth = (() => {
    if (mouthOpen) {
      if (expr === "smile") {
        return (
          <g>
            <path d="M144 186 Q160 216 176 186 Z" fill="#5b2b2b" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M149 188 L171 188 L168 194 L152 194 Z" fill="#fff" />
            <ellipse cx={160} cy={204} rx={6} ry={4} fill="#c96a6a" />
          </g>
        );
      }
      const rx = expr === "question" ? 7 : 10;
      const ry = expr === "question" ? 8 : 9;
      return (
        <g>
          <ellipse cx={160} cy={193} rx={rx} ry={ry} fill="#5b2b2b" stroke={INK} strokeWidth={SW} />
          <rect x={160 - rx + 3} y={186} width={rx * 2 - 6} height={4} rx={1} fill="#fff" />
          <ellipse cx={160} cy={198} rx={rx - 4} ry={3.5} fill="#c96a6a" />
        </g>
      );
    }
    const d = {
      neutral: "M147 192 Q160 199 173 192",
      smile: "M143 188 Q160 208 177 188",
      question: "M151 195 Q160 191 169 195",
      think: "M149 194 L171 194",
    }[expr];
    return <path d={d} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />;
  })();

  return (
    <svg viewBox="0 0 320 440" className={className} role="img" aria-label={title ?? look.name}>
      {/* rambut belakang */}
      {backHair}
      {/* leher & tubuh */}
      <rect x={141} y={196} width={38} height={48} rx={12} fill={shade(look.skin, -22)} stroke={INK} strokeWidth={SW} />
      <path d="M54 440 L54 310 Q54 256 112 244 L142 236 Q160 254 178 236 L208 244 Q266 256 266 310 L266 440 Z" fill={look.outfit} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {/* kerah */}
      <path d="M142 236 Q160 262 178 236 L186 246 Q160 282 134 246 Z" fill={look.accent ?? "#f3e9d8"} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {/* garis lengan */}
      <path d="M90 300 Q84 360 86 440" fill="none" stroke={outfitDark} strokeWidth={2} opacity={0.6} />
      <path d="M230 300 Q236 360 234 440" fill="none" stroke={outfitDark} strokeWidth={2} opacity={0.6} />
      {look.bag && <path d="M110 250 L236 418" stroke={look.accent} strokeWidth={14} strokeLinecap="round" opacity={0.95} />}
      {look.scarf && (
        <g>
          <path d="M126 240 Q160 290 194 240 L204 258 Q160 310 116 258 Z" fill={look.accent} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M186 262 L204 340 L176 342 Z" fill={look.accent} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        </g>
      )}
      {/* telinga */}
      <circle cx={103} cy={150} r={11} fill={look.skin} stroke={INK} strokeWidth={SW} />
      <circle cx={217} cy={150} r={11} fill={look.skin} stroke={INK} strokeWidth={SW} />
      {/* kepala */}
      <ellipse cx={160} cy={140} rx={58} ry={66} fill={look.skin} stroke={INK} strokeWidth={SW} />
      {/* pipi */}
      <ellipse cx={127} cy={172} rx={10} ry={6} fill="#e08a7a" opacity={expr === "smile" ? 0.5 : 0.3} />
      <ellipse cx={193} cy={172} rx={10} ry={6} fill="#e08a7a" opacity={expr === "smile" ? 0.5 : 0.3} />
      {/* mata */}
      <ellipse cx={138} cy={146} rx={9} ry={10} fill="#fff" stroke={INK} strokeWidth={2} />
      <ellipse cx={182} cy={146} rx={9} ry={10} fill="#fff" stroke={INK} strokeWidth={2} />
      <circle cx={138 + irisDx} cy={147 + irisDy} r={5} fill="#3a2a24" />
      <circle cx={182 + irisDx} cy={147 + irisDy} r={5} fill="#3a2a24" />
      <circle cx={140 + irisDx} cy={144 + irisDy} r={1.6} fill="#fff" />
      <circle cx={184 + irisDx} cy={144 + irisDy} r={1.6} fill="#fff" />
      {/* alis */}
      <path d={brows[0]} fill="none" stroke={hairDark === look.hair ? INK : shade(look.hair, -60)} strokeWidth={3.5} strokeLinecap="round" />
      <path d={brows[1]} fill="none" stroke={shade(look.hair, -60)} strokeWidth={3.5} strokeLinecap="round" />
      {/* hidung */}
      <path d="M160 160 Q154 174 162 176" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      {/* mulut */}
      {mouth}
      {/* kacamata */}
      {look.glasses && (
        <g fill="none" stroke="#2c3e6b" strokeWidth={2.5}>
          <circle cx={138} cy={147} r={15} />
          <circle cx={182} cy={147} r={15} />
          <path d="M153 147 L167 147" />
          <path d="M123 145 L106 142" />
          <path d="M197 145 L214 142" />
        </g>
      )}
      {/* rambut depan */}
      {frontHair}
      {/* properti: amplop di tangan */}
      {prop === "envelope" && (
        <g transform="rotate(-10 250 350)">
          <rect x={206} y={318} width={88} height={60} rx={4} fill="#f6efe2" stroke={INK} strokeWidth={SW} />
          <path d="M206 318 L250 352 L294 318" fill="none" stroke={INK} strokeWidth={2} />
          <rect x={262} y={326} width={20} height={14} fill="#b5533c" opacity={0.8} />
          <circle cx={226} cy={380} r={15} fill={look.skin} stroke={INK} strokeWidth={SW} />
        </g>
      )}
    </svg>
  );
}
