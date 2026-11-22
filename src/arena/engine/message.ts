// Formatives Heuristik-Modell, kein Ersatz für eine menschliche Sprachprüfung.
export type MessageAssessment = { status: "correct" | "wrong" | "ambiguous"; reason: string };
export function assessPlatformMessage(text: string, target: number): MessageAssessment {
  const s = text.toLocaleLowerCase("de").normalize("NFC").replace(/ß/g,"ss").replace(/\bfuenf\b/g,"fünf");
  const words: Record<string,number> = {zwei:2,drei:3,vier:4,fünf:5,sechs:6,sieben:7,acht:8};
  const mentions=[...s.matchAll(/\b(?:gleis|bahnsteig)\s*(?:nummer\s*)?(\d+|zwei|drei|vier|fünf|sechs|sieben|acht)\b/g)].map(m=>{
    const prefix=s.slice(Math.max(0,m.index!-30),m.index!);
    const clause=prefix.split(/[.!?;,]|\b(?:sondern|aber)\b/).pop() ?? "";
    return {number:words[m[1]] ?? Number(m[1]), negated:/\b(?:nicht|kein|keine|keinem|keinen)\b/.test(clause)};
  });
  const positive=mentions.filter(m=>!m.negated).map(m=>m.number);
  if (!mentions.length || !positive.length) return {status:"ambiguous",reason:"Peron mana yang harus Mia tuju? Jelaskan dengan „von Gleis …“ atau „zu Gleis …“."};
  if (new Set(positive).size>1) return {status:"ambiguous",reason:"Kamu menyebut beberapa peron. Mana tujuan terbaru? Jelaskan juga peron lama yang tidak berlaku."};
  const directed=/\b(?:von|vom|auf|zu|zum|nach|an|ab)\s+(?:dem\s+)?(?:gleis|bahnsteig)\b/.test(s) || /\b(?:gleis|bahnsteig)\s*(?:nummer\s*)?(?:\d+|zwei|drei|vier|fünf|sechs|sieben|acht)\s+(?:ist|gilt|stimmt)\b/.test(s);
  if (!directed) return {status:"ambiguous",reason:"Kamu menyebut peron. Apakah Mia harus ke sana atau keretanya berangkat dari sana? Jelaskan singkat."};
  if (positive[0]!==target) return {status:"wrong",reason:`Arah pesanmu menuju Gleis ${positive[0]}; periksa peron yang terakhir diumumkan dan perbaiki tujuannya.`};
  return {status:"correct",reason:`Tujuan Gleis ${target} tersampaikan. Tata bahasa dan kesesuaian gaya masih menunggu penilaian terpisah.`};
}
