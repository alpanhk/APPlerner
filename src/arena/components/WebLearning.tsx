import { useMemo, useRef, useState } from "react";
import { READINGS } from "../data";
import type { Route } from "../../klab/routes";

type Result = { attempts: number; correct: number; lastAt: number };
type Progress = Record<string, Result>;
const STORAGE = "lernen.web-reading.v1";
function load(): Progress { try { const v=JSON.parse(localStorage.getItem(STORAGE) ?? "{}"); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; } catch { return {}; } }
export function WebLearning({ onBack, route }: {onBack:()=>void; route?:Route}) {
  const [progress,setProgress]=useState(load);
  const [level,setLevel]=useState("A1");
  const [id,setId]=useState<number | null>(route?.name === "reader" ? route.textId : null);
  const [choice,setChoice]=useState("");
  const [feedback,setFeedback]=useState("");
  const lastAnswer=useRef("");
  const text=READINGS.find(t=>t.textId===id);
  const sentence=text?.sentences.find(s=>s.de && s.id);
  const options=useMemo(()=>{
    if (!text || !sentence) return [];
    const wrong=READINGS.filter(r=>r.level===text.level && r.textId!==text.textId).flatMap(r=>r.sentences).find(s=>s.id && s.id!==sentence.id)?.id;
    return wrong ? [sentence.id,wrong].sort((a,b)=>a.localeCompare(b)) : [sentence.id];
  },[text,sentence]);
  const answer=()=>{
    if (!text || !sentence || !choice || lastAnswer.current === `${id}:${choice}`) return;
    lastAnswer.current=`${id}:${choice}`;
    const correct=choice===sentence.id;
    const prev=progress[String(text.textId)] ?? {attempts:0,correct:0,lastAt:0};
    const next={...progress,[text.textId]:{attempts:prev.attempts+1,correct:prev.correct+(correct?1:0),lastAt:Date.now()}};
    try {localStorage.setItem(STORAGE,JSON.stringify(next));setProgress(next);setFeedback(correct?"Benar. Ini latihan membaca, bukan bukti kelulusan.":"Belum tepat. Baca kembali kalimat dan terjemahannya, lalu coba lagi.");}
    catch {setFeedback("Progres tidak dapat disimpan di browser ini.");}
  };
  return <main className="h-dvh overflow-y-auto bg-[#1f2740] p-4 text-[#f7efdd]"><div className="mx-auto max-w-4xl">
    <header className="flex flex-wrap items-center gap-3"><button className="rounded bg-[#f7efdd] px-3 py-2 font-bold text-[#2c3e6b]" onClick={onBack}>Kembali ke menu</button><h1 className="text-2xl font-black">Ruang belajar A1–B2 · Browser</h1></header>
    <p className="my-3">Bacaan dari koleksi Lernen dan latihan arti satu kalimat. Ini bukan seluruh pelajaran atau simulasi ujian; progres disimpan hanya di browser ini, terpisah dari SQLite Windows.</p>
    {!text ? <><label>Level <select className="rounded bg-white p-2 text-[#1f2233]" value={level} onChange={e=>setLevel(e.target.value)}>{["A1","A2","B1","B2"].map(v=><option key={v}>{v}</option>)}</select></label><p className="my-2">{READINGS.filter(r=>r.level===level).length} bacaan tersedia · {Object.keys(progress).length} bacaan pernah dilatih</p><ul className="grid gap-2 sm:grid-cols-2">{READINGS.filter(r=>r.level===level).map(r=><li key={r.textId}><button className="w-full rounded border border-[#f7efdd]/40 bg-[#303a55] p-3 text-left" onClick={()=>{setId(r.textId);setChoice("");setFeedback("");lastAnswer.current="";}}><strong>{r.title}</strong><br/><span>{r.level} · {r.sentences.length} kalimat · {progress[String(r.textId)] ? `${progress[String(r.textId)].correct}/${progress[String(r.textId)].attempts} jawaban benar` : "belum dilatih"}</span></button></li>)}</ul></> : <section className="rounded-xl bg-[#f7efdd] p-4 text-[#1f2233]"><button className="rounded border border-[#2c3e6b] px-3 py-1" onClick={()=>{setId(null);setFeedback("");}}>‹ Daftar bacaan</button><h2 className="my-3 text-xl font-bold">{text.title} · {text.level}</h2><ul>{text.sentences.map((s,i)=><li key={i} className="mb-2"><span lang="de">{s.de}</span><details><summary>Arti</summary>{s.id}</details></li>)}</ul>{sentence && <fieldset className="mt-4 border-t border-[#2c3e6b]/30 pt-3"><legend className="font-bold">Latihan membaca</legend><p>Apakah arti kalimat <span lang="de">„{sentence.de}“</span>?</p>{options.map(o=><label key={o} className="my-2 block"><input type="radio" name="reading-answer" checked={choice===o} onChange={()=>{setChoice(o);setFeedback("");lastAnswer.current="";}}/> {o}</label>)}<button disabled={!choice} className="rounded bg-[#b5533c] px-3 py-2 font-bold text-white disabled:opacity-50" onClick={answer}>Periksa jawaban</button><p role="status">{feedback}</p><p>Riwayat latihan: {progress[String(text.textId)]?.correct ?? 0} benar dari {progress[String(text.textId)]?.attempts ?? 0} jawaban.</p></fieldset>}</section>}
  </div></main>;
}
