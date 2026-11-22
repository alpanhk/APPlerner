import {useState} from 'react';
import {Stage} from './Stage';
import {DialogPanel,NextButton} from './DialogPanel';
import {Modal} from './Panels';
import {CHAPTER_TWO} from '../data/story/chapters';
import {sceneTitleForStep} from '../storage/chapterTwoCheckpoint';
import type {PlayerProfile,SpeakerId,StageState} from '../types';
export type DayBeat='arrival'|'day-question'|'day-retry'|'day-tutor'|'day-correct'|'day-explain'|'new-intro'|'new-question'|'new-retry'|'new-tutor'|'new-correct';
type Item={step:string;value:string;correct:boolean;help?:boolean;first?:boolean;mode?:string};
type Props={player:PlayerProfile;reducedMotion:boolean;step:'day'|'day-new';beat:DayBeat;draft:string;events:Item[];onBack:()=>void;setBeat:(beat:DayBeat,opts?:{help?:boolean;clear?:boolean})=>void;setDraft:(s:string)=>void;submit:()=>void;advance:()=>void};
export function DayConversation(p:Props){
 const [translation,setTranslation]=useState(false),[panel,setPanel]=useState<'journal'|'history'|null>(null);
 const beats:Record<DayBeat,{speaker:SpeakerId;text:string;translation?:string;lang:'id'|'de';next?:DayBeat}>={
 arrival:{speaker:'narator',lang:'id',text:'Pada jadwal penjual tertulis: keranjang siap dua hari lagi. Mia membuka kalender untuk mencatat hari.',next:'day-question'},
 'day-question':{speaker:'mia',lang:'de',text:'Heute ist Donnerstag. Wann holen wir den Korb ab?',translation:'Hari ini Kamis. Kapan kita mengambil keranjang?'},
 'day-retry':{speaker:'mia',lang:'de',text:'Zwei Tage nach Donnerstag? Ich bin nicht sicher.',translation:'Dua hari setelah Kamis? Aku belum yakin.'},
 'day-tutor':{speaker:'tutor',lang:'id',text:'Hitung dari Kamis: Jumat satu hari, Sabtu dua hari. Untuk hari gunakan am.'},
 'day-correct':{speaker:'mia',lang:'de',text:'Gut, dann trage ich Samstag ein.',translation:'Baik, kalau begitu kutulis hari Sabtu.',next:'day-explain'},
 'day-explain':{speaker:'tutor',lang:'id',text:'Untuk menyebut hari kegiatan, pakai am: am Samstag berarti pada hari Sabtu.'},
 'new-intro':{speaker:'narator',lang:'id',text:'Mia mengambil kartu janji lain. Hari pada kartu itu Minggu; pertemuan baru berlangsung besok.',next:'new-question'},
 'new-question':{speaker:'mia',lang:'de',text:'Heute ist Sonntag. Wann treffen wir uns morgen?',translation:'Hari ini Minggu. Kapan kita bertemu besok?'},
 'new-retry':{speaker:'mia',lang:'de',text:'Nach Sonntag? Schau noch einmal auf den Kalender.',translation:'Setelah Minggu? Coba lihat lagi kalender.'},
 'new-tutor':{speaker:'tutor',lang:'id',text:'Sesudah Sonntag adalah Montag. Gunakan am sebelum nama hari.'},
 'new-correct':{speaker:'mia',lang:'de',text:'Danke! Montag steht auf der neuen Karte.',translation:'Terima kasih! Senin sudah tertulis pada kartu baru.'},
 };
 const b=beats[p.beat],choice=p.beat==='day-question'||p.beat==='new-question',retry=p.beat==='day-retry'||p.beat==='new-retry',tutor=p.beat==='day-tutor'||p.beat==='new-tutor';
 const go=(beat:DayBeat,opts?:{help?:boolean;clear?:boolean})=>{setTranslation(false);p.setBeat(beat,opts);};
 const actor=b.speaker==='tutor'?'tutor':'mia';const stage:StageState={bg:'kios-pasar',chars:[{id:'player',side:'left'},{id:actor,side:'right'}],overlay:null,ambience:'none'};
 return <main className="relative h-full overflow-hidden bg-[#1f2740] text-[#f7efdd]"><Stage stage={stage} player={p.player} speakingChar={null} mouthOpen={false} reducedMotion={p.reducedMotion}/><header className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-1 p-2"><span className="mr-auto rounded bg-[#1b2033]/80 px-2 py-1 text-xs font-semibold">A1 · Bab 02 · {CHAPTER_TWO.title} · {sceneTitleForStep(p.step)} · {p.player.name}</span><button className="btn-top" onClick={()=>setPanel('journal')}>Jurnal</button><button className="btn-top" onClick={()=>setPanel('history')}>Riwayat</button><button className="btn-top" onClick={p.onBack}>Judul</button></header>
 <DialogPanel speaker={b.speaker} playerName={p.player.name} text={b.text} lang={b.lang} translation={b.translation} showTranslation={translation} onToggleTranslation={()=>setTranslation(x=>!x)} canListen={false} onListen={()=>{}} isSpeaking={false} audioStatus={b.lang==='de'?'Klip tepat belum tersedia · baca teks.':undefined}>
 {b.next && <NextButton onClick={()=>go(b.next!)}/>}
 {choice && <><label className="block text-sm font-semibold">Jawabanmu<textarea aria-label="Jawabanmu" className="block w-full rounded border border-[#2c3e6b]/50 bg-white p-2 font-normal" value={p.draft} onChange={e=>p.setDraft(e.target.value)}/></label><div className="mt-2 flex flex-wrap gap-2"><button className="btn-primary" disabled={!p.draft.trim()} onClick={p.submit}>Periksa jawaban</button><button className="btn-secondary" onClick={()=>go(p.step==='day'?'day-tutor':'new-tutor',{help:true})}>Minta bantuan</button></div></>}
 {retry && <div className="flex gap-2"><button className="btn-primary" onClick={()=>go(p.step==='day'?'day-question':'new-question')}>Coba lagi</button><button className="btn-secondary" onClick={()=>go(p.step==='day'?'day-tutor':'new-tutor',{help:true})}>Minta bantuan tutor</button></div>}
 {tutor && <NextButton label="Coba lagi" onClick={()=>go(p.step==='day'?'day-question':'new-question')}/>}
 {p.beat==='day-explain' && <NextButton label="Lihat kartu janji lain" onClick={p.advance}/>}{p.beat==='new-correct' && <NextButton label="Lanjutkan" onClick={p.advance}/>}
 </DialogPanel>
 {panel && <Modal title={panel==='journal'?'Jurnal Bab 02':'Riwayat percakapan'} onClose={()=>setPanel(null)} wide>{panel==='history' && <p>Mia: Heute ist Donnerstag. Wann holen wir den Korb ab? Jadwal: dua hari lagi.</p>}<p>Kalender membantu mencatat hari pengambilan.</p><ul>{p.events.filter(e=>['day','day-new'].includes(e.step)).map((e,i)=><li key={i}>{e.step==='day'?'Hari pengambilan':'Janji baru'} · {e.value} · {e.first===undefined?'bantuan tidak tercatat':e.first?(e.help?'pertama berbantuan':'respons pertama tanpa bantuan'):(e.help?'revisi berbantuan':'ulangan')} · {e.correct?'sesuai':'perlu revisi'} · {e.mode ?? 'menulis'}</li>)}</ul><p>Jawaban diketik adalah menulis; bukan bukti berbicara atau ketuntasan.</p></Modal>}
 </main>;
}
