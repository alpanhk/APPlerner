import { useEffect, useRef, useState } from "react";
import { readiness, type Evidence } from "../engine/readiness";
import announcement4 from "../../klab/novel/assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-transisi-01-petugas-stasiun.mp3";
import announcement5 from "../../klab/novel/assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-pengumuman-variasi-01-petugas-stasiun.mp3";
import ticket from "../../../arena-pilot/media/tiket.webp";
import board from "../../../arena-pilot/media/papan-peron.webp";

// Cerita dan bukti disimpan terpisah dari progres prolog lama; rekaman tidak disimpan.
type Phase = "ticket" | "listen4" | "listen5" | "ask" | "message" | "result";
type Event = { kind: string; stimulus: string; value: string; at: number; support?: string; correct?: boolean };
type Mission = { phase: Phase; answer: string; question: string; message: string; transcript: Record<string, boolean>; played: Record<string, boolean>; failed: Record<string, boolean>; events: Event[] };
const key = "lernen.station.v1";
const fresh = (): Mission => ({phase:"ticket",answer:"",question:"",message:"",transcript:{},played:{},failed:{},events:[]});
function load(): Mission { try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v && Array.isArray(v.events) && ["ticket","listen4","listen5","ask","message","result"].includes(v.phase) ? {...fresh(), ...v} : fresh(); } catch { return fresh(); } }
function checkMessage(s: string): string {
  const t = s.toLocaleLowerCase("de").replace(/ß/g,"ss").replace(/\s+/g," ");
  if (!/mia/.test(t)) return "Sebutkan penerima Mia dalam pesan.";
  if (/\b(nicht|kein|keine)\b/.test(t) || /(gleis|bahnsteig)\s*(2|3|4|zwei|drei|vier)\b/.test(t) || /10[:.]25/.test(t)) return "Pesan memuat informasi yang bertentangan. Periksa peron terbaru dan jam keberangkatan.";
  if (!/(gleis|bahnsteig)/.test(t) || !/(\b5\b|fünf|fuenf)/.test(t)) return "Peron terakhir adalah Gleis fünf. Periksa nomor dan sebutkan peronnya.";
  if (!/(09[:. ]?10|9[:. ]?10|neun\s+(uhr\s+)?zehn)/.test(t)) return "Periksa jam keberangkatan pada tiket: 09:10.";
  return "";
}
export function StationMission({ onBack, soundOn }: {onBack: () => void; soundOn: boolean}) {
  const [data, setData] = useState<Mission>(load);
  const current = useRef(data); current.current = data;
  const [feedback, setFeedback] = useState("");
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [microphone, setMicrophone] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const urlRef = useRef("");
  const mounted = useRef(true);
  const locked = useRef(false);
  const lastAttempt = useRef("");
  const lastMessage = useRef("");
  const update = (fn: (v: Mission) => Mission) => { const next=fn(current.current); current.current=next; setData(next); try { localStorage.setItem(key,JSON.stringify(next)); } catch { setFeedback("Penyimpanan tidak tersedia; progres mungkin tidak tersimpan."); } };
  const event = (kind: string, stimulus: string, value: string, extra: Partial<Event> = {}): Event => ({kind,stimulus,value,at:Date.now(),...extra});
  const stop = () => { audio.current?.pause(); audio.current = null; setPlaying(false); };
  const clearRecording = () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current=""; setRecordingUrl(""); };
  useEffect(() => { mounted.current=true; return () => { mounted.current=false; audio.current?.pause(); stream.current?.getTracks().forEach(t=>t.stop()); if(recorder.current?.state === "recording") recorder.current.stop(); if(urlRef.current) URL.revokeObjectURL(urlRef.current); }; }, []);
  useEffect(() => { if (!soundOn) stop(); }, [soundOn]);
  const listening = data.phase === "listen4" || data.phase === "listen5";
  const stimulus = data.phase === "listen5" ? "peron-5" : "peron-4";
  const transcript = data.phase === "listen5" ? "Achtung, der Zug fährt heute von Gleis fünf ab." : "Achtung, der Zug fährt heute von Gleis vier ab.";
  function play() {
    stop(); if (!soundOn) { setFeedback("Mode senyap aktif. Buka transkrip untuk jalur membaca."); return; }
    const id=stimulus; const clip = new Audio(data.phase === "listen5" ? announcement5 : announcement4); audio.current=clip;
    clip.onplaying=()=>{ if(audio.current!==clip) return; setPlaying(true); update(v=>({...v,played:{...v.played,[id]:true},events:[...v.events,event("audio-playing",id,"diputar")]})); };
    const fail=()=>{ if(audio.current!==clip)return; stop(); update(v=>({...v,failed:{...v.failed,[id]:true},events:[...v.events,event("audio-error",id,"gagal diputar")]})); setFeedback("Audio gagal diputar. Buka transkrip dan lanjutkan melalui jalur membaca; ini bukan kesalahan menyimak."); };
    clip.onended=()=>{if(audio.current===clip) stop();}; clip.onerror=fail; void clip.play().catch(fail);
  }
  function submitPlatform() {
    if (locked.current || !listening || !data.answer.trim()) return; locked.current=true;
    const answer=data.answer.trim(); const attemptKey=`${data.phase}:${answer}`; if(lastAttempt.current===attemptKey){ locked.current=false; return; } lastAttempt.current=attemptKey; const expected=data.phase === "listen5" ? "5" : "4"; const correct=answer===expected || answer.toLowerCase()===(expected === "4" ? "vier" : "fünf");
    const support=data.transcript[stimulus] ? "transkrip/membaca" : data.played[stimulus] ? "audio diputar" : data.failed[stimulus] ? "audio gagal" : "audio belum diputar";
    update(v=>({...v,events:[...v.events,event("jawaban-peron",stimulus,answer,{support,correct:(data.transcript[stimulus] || data.played[stimulus]) ? correct : undefined})],answer:"",phase:correct?(v.phase === "listen4" ? "listen5" : "ask"):v.phase}));
    stop(); setFeedback(correct ? (expected === "4" ? "Benar. Sekarang coba pengumuman baru." : "Benar. Sekarang mintalah klarifikasi kepada petugas.") : "Itu belum cocok. Dengarkan lagi atau buka transkrip, lalu coba kembali.");
    queueMicrotask(()=>{locked.current=false;});
  }
  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error("not available");
      clearRecording(); const s=await navigator.mediaDevices.getUserMedia({audio:true}); if (!mounted.current) { s.getTracks().forEach(t=>t.stop()); return; } stream.current=s; const r=new MediaRecorder(s); recorder.current=r; const chunks: BlobPart[]=[];
      r.ondataavailable=e=>{if(e.data.size) chunks.push(e.data);};
      r.onstop=()=>{s.getTracks().forEach(t=>t.stop());stream.current=null;if (!mounted.current) return; setRecording(false);if(chunks.length){const u=URL.createObjectURL(new Blob(chunks,{type:r.mimeType}));urlRef.current=u;setRecordingUrl(u); update(v=>({...v,events:[...v.events,event("rekaman-lokal","tanya-petugas","sampel direkam; menunggu telaah",{support:"lisan"})]}));}};
      r.start(); setRecording(true); setMicrophone("Rekaman lokal sedang berjalan.");
    } catch { if (mounted.current) setMicrophone("Mikrofon tidak tersedia atau ditolak. Kamu tetap bisa melanjutkan lewat teks."); }
  }
  function submitQuestion() {
    if (locked.current || current.current.phase!=="ask" || !data.question.trim()) return;
    if (!/(gleis|bahnsteig)/i.test(data.question) || !data.question.includes("?")) {setFeedback("Ajukan pertanyaan dengan Gleis atau Bahnsteig dan tanda tanya.");return;}
    locked.current=true; update(v=>({...v,phase:"message",events:[...v.events,event("pertanyaan","tanya-petugas",v.question,{support:"diketik; bukan bukti lisan"})]}));setFeedback("Pertanyaanmu meminta peron dengan jelas. Petugas memastikan informasi pengumuman terakhir.");queueMicrotask(()=>locked.current=false);
  }
  function continueWithRecording() {
    if (!recordingUrl || current.current.phase !== "ask" || locked.current) return;
    locked.current=true; update(v=>({...v,phase:"message",events:[...v.events,event("pertanyaan-lisan","tanya-petugas","rekaman lokal; belum dinilai",{support:"lisan menunggu telaah"})]}));
    setFeedback("Rekaman disimpan sementara pada perangkat; belum ada penilaian isi atau kemampuan berbicara."); queueMicrotask(()=>locked.current=false);
  }
  function submitMessage() {
    if (locked.current || current.current.phase!=="message" || !data.message.trim() || lastMessage.current===data.message.trim()) return;
    lastMessage.current=data.message.trim(); locked.current=true; const problem=checkMessage(data.message); update(v=>({...v,phase:problem?"message":"result",events:[...v.events,event("pesan","pesan-mia",v.message,{support:"diketik; penilaian formatif otomatis",correct:!problem})]})); setFeedback(problem || "Pesan memuat Mia, peron terbaru dan jam keberangkatan. Penilaian bahasa lengkap masih menunggu telaah.");queueMicrotask(()=>locked.current=false);
  }
  const learningEvidence: Evidence[] = data.events.filter(e=>e.kind === "jawaban-peron").map((e, i, all)=>({
    kind:"receptive", stimulus:e.stimulus, context:"stasiun", at:e.at,
    first:e.correct !== undefined && all.findIndex(x=>x.stimulus===e.stimulus && x.correct !== undefined)===i, correct:e.correct===true,
    support:e.support === "audio diputar" ? "none" : "transcript",
  }));
  const ready=readiness(learningEvidence,"receptive");
  const responses=data.events.filter(e=>e.kind==="jawaban-peron" || e.kind==="pesan" || e.kind==="pertanyaan" || e.kind==="rekaman-lokal" || e.kind==="rekaman-dihapus" || e.kind==="pertanyaan-lisan");
  return <main className="station h-full overflow-y-auto bg-[#1f2740] text-[#f7efdd]"><div className="mx-auto max-w-4xl p-4">
    <header className="flex flex-wrap items-center gap-3"><button className="btn-top" onClick={()=>{stop();onBack();}}>Judul</button><h1 className="text-2xl font-black">Latih keterampilan · Peron berubah</h1></header>
    <p className="mt-2">Latihan A1 · progres dan draf tersimpan di browser ini. Cerita selesai tidak sama dengan kelayakan naik.</p>
    <section className="mt-4 rounded-xl bg-[#f7efdd] p-4 text-[#1f2233]" aria-live="polite">
      {data.phase === "ticket" && <><h2 className="text-xl font-bold">Baca tiket</h2><img src={ticket} alt="Ilustrasi tiket" className="my-2 max-h-36 rounded"/><p>Tiket latihan: Leipzig · Abfahrt <strong>09:10</strong>. Papan lama menunjukkan Gleis 2.</p><button className="btn-primary mt-3" onClick={()=>update(v=>({...v,phase:"listen4"}))}>Ke pengumuman</button></>}
      {listening && <><h2 className="text-xl font-bold">Dengarkan pengumuman {data.phase === "listen5" ? "baru" : "di stasiun"}</h2><p>{data.phase === "listen5" ? "Situasi baru, tiket lain. " : ""}Tiket: Leipzig, Abfahrt 09:10. Peron lama: Gleis 2. Pilih peron terbaru setelah mendengarkan.</p>
        <p className="my-2 text-sm">Pengeras suara stasiun · pengumuman sintetis. Angka pada papan disembunyikan sampai kamu menjawab.</p>
        <button className="btn-secondary mr-2" onClick={play}>{playing?"Putar ulang":"Dengarkan"}</button><button className="btn-secondary" onClick={()=>{update(v=>({...v,transcript:{...v.transcript,[stimulus]:true},events:v.transcript[stimulus]?v.events:[...v.events,event("transkrip",stimulus,"dibuka",{support:"membaca"})]}));}}>Buka transkrip</button>
        {data.transcript[stimulus] && <p className="my-2" lang="de">{transcript}</p>}
        <form onSubmit={e=>{e.preventDefault();submitPlatform();}} className="mt-4 flex flex-wrap gap-2"><label>Nomor peron <input aria-label="Nomor peron" className="rounded border border-slate-500 bg-white p-2" value={data.answer} onChange={e=>{lastAttempt.current="";update(v=>({...v,answer:e.target.value}));}} /></label><button className="btn-primary" type="submit">Periksa peron</button></form>
        {data.events.some(e=>e.kind==="jawaban-peron" && e.stimulus===stimulus) && <img src={board} alt="Ilustrasi papan keberangkatan setelah respons" className="mt-3 max-h-28"/>}</>}
      {data.phase === "ask" && <><h2 className="text-xl font-bold">Tanyakan kepada petugas</h2><p>Petugas: informasi terbaru ada pada pengumuman. Mintalah klarifikasi dengan sopan.</p><p className="text-sm">Rekaman disimpan hanya sementara pada perangkat dan belum dinilai; teks tidak dianggap berbicara.</p>
        <div className="my-3 flex flex-wrap gap-2"><button className="btn-secondary" onClick={recording?()=>recorder.current?.stop():startRecording}>{recording?"Hentikan rekaman":"Rekam suara"}</button>{recordingUrl && <><audio controls src={recordingUrl} aria-label="Dengar rekaman sendiri"/><button className="btn-secondary" onClick={continueWithRecording}>Lanjut dengan rekaman</button><button className="btn-secondary" onClick={()=>{clearRecording();update(v=>({...v,events:[...v.events,event("rekaman-dihapus","tanya-petugas","rekaman lokal dihapus",{support:"tidak tersedia untuk penilaian"})]}));setMicrophone("Rekaman lokal dihapus.");}}>Hapus rekaman</button></>}</div><p role="status">{microphone}</p>
        <form onSubmit={e=>{e.preventDefault();submitQuestion();}}><label className="block">Pertanyaan dalam bahasa Jerman <input className="my-2 w-full rounded border border-slate-500 bg-white p-2" value={data.question} onChange={e=>update(v=>({...v,question:e.target.value}))} /></label><button className="btn-primary">Kirim pertanyaan teks</button></form></>}
      {data.phase === "message" && <><h2 className="text-xl font-bold">Tulis pesan kepada Mia</h2><p>Beri tahu Mia peron terakhir dan jam keberangkatan 09:10. Susun dengan kata-katamu sendiri.</p><form onSubmit={e=>{e.preventDefault();submitMessage();}}><label className="block">Pesan <textarea className="my-2 w-full rounded border border-slate-500 bg-white p-2" rows={3} value={data.message} onChange={e=>{lastMessage.current="";update(v=>({...v,message:e.target.value}));}}/></label><button className="btn-primary">Periksa dan kirim pesan</button></form></>}
      {data.phase === "result" && <>{recordingUrl && <div><p>Rekaman sementara masih tersedia selama halaman ini terbuka.</p><audio controls src={recordingUrl} aria-label="Dengar rekaman sendiri"/><button className="btn-secondary" onClick={()=>{clearRecording();update(v=>({...v,events:[...v.events,event("rekaman-dihapus","tanya-petugas","rekaman lokal dihapus",{support:"tidak tersedia untuk penilaian"})]}));}}>Hapus rekaman</button></div>}<h2 className="text-xl font-bold">Misi selesai · hasil tersimpan</h2><p>Kamu menemukan informasi dan menulis pesan. Ini adalah latihan; bukti penguasaan tertunda dan penilaian lisan belum cukup.</p><p>Langkah berikutnya: coba pengumuman baru pada hari lain tanpa transkrip, lalu minta penilaian sampel lisan dan tulisan.</p><button className="btn-secondary mt-3" onClick={()=>{stop();update(v=>({...fresh(),events:v.events}));setFeedback("");}}>Mulai latihan baru</button></>}
      {feedback && <p role="status" className="mt-3 rounded bg-[#e9dfc9] p-2">{feedback}</p>}
    </section>
    <details className="mt-4 rounded bg-[#303a55] p-4"><summary>Jurnal latihan · respons dan revisi</summary><p>{ready ? "Bukti menyimak awal memenuhi ambang pilot; keputusan tetap perlu ditinjau." : "Belum layak lanjut berdasarkan bukti: diperlukan soal segar, konteks lain dan cek pada hari berbeda."}</p><p>Audio diputar tidak membuktikan pemahaman; transkrip adalah dukungan membaca. Rekaman tanpa penilaian andal menunggu telaah.</p>{responses.length===0?<p>Belum ada respons.</p>:<ol className="list-decimal pl-6">{responses.map((e,i)=><li key={i}>{(e.kind === "jawaban-peron" || e.kind === "pesan") && (responses.slice(0,i).some(old=>old.kind===e.kind && old.stimulus===e.stimulus) ? "Revisi · " : "Respons pertama · ")}{e.stimulus} · {e.kind} · {e.value} · {e.correct===undefined?(e.support === "audio gagal" || e.support === "audio belum diputar" ? "bukan nilai menyimak" : "menunggu telaah"):e.correct?"sesuai":"perlu revisi"} · {e.support}</li>)}</ol>}</details>
  </div></main>;
}
