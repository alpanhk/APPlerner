import {useState} from 'react';
import {Stage} from './Stage';
import {DialogPanel,NextButton} from './DialogPanel';
import {Modal} from './Panels';
import {CHAPTER_TWO} from '../data/story/chapters';
import {sceneTitleForStep} from '../storage/chapterTwoCheckpoint';
import type {PlayerProfile,SpeakerId,StageState} from '../types';
export type MessageBeat='arrival'|'message-question'|'message-retry'|'message-tutor'|'message-correct'|'new-intro'|'new-question'|'new-retry'|'new-tutor'|'new-correct';
type Item={step:string;value:string;correct:boolean;help?:boolean;first?:boolean;mode?:string;reason?:string;reviewPending?:boolean};
type Props={player:PlayerProfile;reducedMotion:boolean;step:'message'|'pre-new';beat:MessageBeat;draft:string;events:Item[];feedback:string;onBack:()=>void;setBeat:(beat:MessageBeat,opts?:{help?:boolean;clear?:boolean})=>void;setDraft:(s:string)=>void;submit:()=>void;advance:()=>void;defer:()=>void};
export function MessageConversation(p:Props){
 const [translation,setTranslation]=useState(false),[panel,setPanel]=useState<'journal'|'history'|null>(null);
 const latest=[...p.events].reverse().find(e=>e.step===p.step);const understoodDay=latest?.reason?.includes('Sabtu sudah benar');
 const beats:Record<MessageBeat,{speaker:SpeakerId;text:string;translation?:string;lang:'id'|'de';next?:MessageBeat}>={
 arrival:{speaker:'narator',lang:'id',text:'Mia menyelipkan catatan pengambilan ke dalam buku tamu. Agar ia bisa menjaga kios sendiri, kamu perlu menulis hari dan jam yang telah disepakati.',next:'message-question'},
 'message-question':{speaker:'mia',lang:'de',text:'Schreib bitte auf, wann wir uns treffen.',translation:'Tolong catat kapan kita bertemu.'},
 'message-retry':{speaker:'mia',lang:'de',text:understoodDay?'Samstag habe ich verstanden. Aber um wie viel Uhr?':'Wann genau treffen wir uns?',translation:understoodDay?'Sabtu sudah kupahami. Tapi pukul berapa?':'Tepatnya kapan kita bertemu?'},
 'message-tutor':{speaker:'tutor',lang:'id',text:p.feedback || 'Gunakan am untuk hari dan um untuk jam. Periksa jadwal pada catatan.'},
 'message-correct':{speaker:'mia',lang:'de',text:'Am Samstag um halb neun. Ich stecke den Zettel ins Buch.',translation:'Sabtu pukul setengah sembilan. Kuselipkan catatan ke buku.'},
 'new-intro':{speaker:'narator',lang:'id',text:'Mia menemukan satu kartu janji baru: Jumat pukul 09.00. Ia ingin meninggalkan pesan lain agar kedua janji tidak tertukar.',next:'new-question'},
 'new-question':{speaker:'mia',lang:'de',text:'Und wann ist der neue Termin?',translation:'Dan kapan janji yang baru?'},
 'new-retry':{speaker:'mia',lang:'de',text:'Moment, wann genau ist der neue Termin?',translation:'Sebentar, kapan tepatnya janji baru itu?'},
 'new-tutor':{speaker:'tutor',lang:'id',text:p.feedback || 'Gunakan am untuk hari dan um untuk jam. Periksa kartu baru.'},
 'new-correct':{speaker:'mia',lang:'de',text:'Gut, ich lege die zweite Nachricht dazu.',translation:'Baik, kutambahkan pesan kedua.'},
 };
 const b=beats[p.beat],choice=p.beat==='message-question'||p.beat==='new-question',retry=p.beat==='message-retry'||p.beat==='new-retry',tutor=p.beat==='message-tutor'||p.beat==='new-tutor';
 const go=(beat:MessageBeat,opts?:{help?:boolean;clear?:boolean})=>{setTranslation(false);p.setBeat(beat,opts);};
 const actor=b.speaker==='tutor'?'tutor':'mia';const stage:StageState={bg:'kios-pasar',chars:[{id:'player',side:'left'},{id:actor,side:'right'}],overlay:null,ambience:'none'};
 return <main className="relative h-full overflow-hidden bg-[#1f2740] text-[#f7efdd]"><Stage stage={stage} player={p.player} speakingChar={null} mouthOpen={false} reducedMotion={p.reducedMotion}/><header className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-1 p-2"><span className="mr-auto rounded bg-[#1b2033]/80 px-2 py-1 text-xs font-semibold">A1 · Bab 02 · {CHAPTER_TWO.title} · {sceneTitleForStep(p.step)} · {p.player.name}</span><button className="btn-top" onClick={()=>setPanel('journal')}>Jurnal</button><button className="btn-top" onClick={()=>setPanel('history')}>Riwayat</button><button className="btn-top" onClick={p.onBack}>Judul</button></header>
 <DialogPanel speaker={b.speaker} playerName={p.player.name} text={b.text} lang={b.lang} translation={b.translation} showTranslation={translation} onToggleTranslation={()=>setTranslation(x=>!x)} canListen={false} onListen={()=>{}} isSpeaking={false} audioStatus={b.lang==='de'?'Klip tepat belum tersedia · baca teks.':undefined}>
 {b.next && <NextButton onClick={()=>go(b.next!)}/>}
 {choice && <><label className="block text-sm font-semibold">{p.step==='message'?'Tulis pesan: Sabtu, 08.30.':'Tulis pesan untuk janji baru: Jumat, 09.00.'}<textarea aria-label="Jawabanmu" className="block w-full rounded border border-[#2c3e6b]/50 bg-white p-2 font-normal" value={p.draft} onChange={e=>p.setDraft(e.target.value)}/></label><div className="mt-2 flex flex-wrap gap-2"><button className="btn-primary" disabled={!p.draft.trim()} onClick={p.submit}>Periksa jawaban</button><button className="btn-secondary" onClick={()=>go(p.step==='message'?'message-tutor':'new-tutor',{help:true})}>Minta bantuan</button></div><p className="text-xs text-[#6b5e4e]">Pemeriksaan terbatas; tata bahasa masih memerlukan telaah.</p></>}
 {retry && <div className="flex flex-wrap gap-2"><button className="btn-primary" onClick={()=>go(p.step==='message'?'message-question':'new-question')}>Coba lagi</button><button className="btn-secondary" onClick={()=>go(p.step==='message'?'message-tutor':'new-tutor',{help:true})}>Minta bantuan tutor</button><button className="btn-secondary" onClick={p.defer}>Lanjut · minta telaah</button></div>}
 {tutor && <NextButton label="Coba lagi" onClick={()=>go(p.step==='message'?'message-question':'new-question')}/>}
 {p.beat==='message-correct' && <NextButton label="Lihat janji baru" onClick={p.advance}/>}{p.beat==='new-correct' && <NextButton label="Lanjutkan" onClick={p.advance}/>}
 </DialogPanel>
 {panel && <Modal title={panel==='journal'?'Jurnal Bab 02':'Riwayat percakapan'} onClose={()=>setPanel(null)} wide>{panel==='history' && <p>Mia: Schreib bitte auf, wann wir uns treffen.</p>}<p>Catatan untuk Mia memuat hari dan jam pengambilan.</p><ul>{p.events.filter(e=>['message','pre-new'].includes(e.step)).map((e,i)=><li key={i}>{e.step==='message'?'Pesan pengambilan':'Janji baru'} · {e.value} · {e.first===undefined?'bantuan tidak tercatat':e.first?(e.help?'pertama berbantuan':'respons pertama tanpa bantuan'):(e.help?'revisi berbantuan':'ulangan')} · {e.reviewPending?'menunggu telaah':e.correct?'sesuai pola':'perlu revisi'} · {e.mode ?? 'menulis'}</li>)}</ul><p>Pesan tertulis bukan bukti berbicara. Keseluruhan tata bahasa masih menunggu telaah.</p></Modal>}
 </main>;
}
