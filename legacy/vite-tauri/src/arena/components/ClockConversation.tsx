import {useState} from 'react';
import {Stage} from './Stage';
import {DialogPanel, NextButton} from './DialogPanel';
import {Modal} from './Panels';
import {CHAPTER_TWO} from '../data/story/chapters';
import {sceneTitleForStep} from '../storage/chapterTwoCheckpoint';
import type {PlayerProfile, SpeakerId, StageState} from '../types';

export type ClockBeat = 'arrival'|'seller'|'question'|'retry'|'tutor'|'correct'|'explain'|'note'|'new-intro'|'new-question'|'new-retry'|'new-tutor'|'new-correct';
type Item={step:string;value:string;correct:boolean;help?:boolean;first?:boolean;mode?:string;reason?:string};
type Props={player:PlayerProfile;reducedMotion:boolean;step:'clock'|'clock-new';beat:ClockBeat;draft:string;events:Item[];onBack:()=>void;onLegacy:()=>void;onJournal:()=>void;setBeat:(beat:ClockBeat,opts?:{help?:boolean;clear?:boolean})=>void;setDraft:(s:string)=>void;submit:()=>void;advance:()=>void};
export function ClockConversation(p:Props){
 const [translation,setTranslation]=useState(false);const [panel,setPanel]=useState<'history'|'journal'|null>(null);
 const beats:Record<ClockBeat,{speaker:SpeakerId;text:string;translation?:string;lang:'id'|'de';next?:ClockBeat}>={
  arrival:{speaker:'narator',lang:'id',text:'Keranjang sudah disiapkan. Jam di atas kios berhenti; penjual menulis waktu pengambilan di secarik kertas.',next:'seller'},
  seller:{speaker:'penjual-pasar',lang:'de',text:'Komm bitte um halb neun wieder.',translation:'Tolong kembali pukul setengah sembilan.',next:'question'},
  question:{speaker:'mia',lang:'de',text:'Wann holen wir den Korb ab?',translation:'Kapan kita mengambil keranjang?',},
  retry:{speaker:'mia',lang:'de',text:'Moment … halb neun oder halb zehn?',translation:'Sebentar … setengah sembilan atau setengah sepuluh?'},
  tutor:{speaker:'tutor',lang:'id',text:'Halb neun berarti setengah jalan menuju pukul sembilan: 08.30. Halb zehn berarti setengah jalan menuju pukul sepuluh.'},
  correct:{speaker:'mia',lang:'de',text:'Gut, um halb neun!',translation:'Baik, pukul setengah sembilan!',next:'explain'},
  explain:{speaker:'tutor',lang:'id',text:'Halb neun berarti setengah jalan menuju pukul sembilan: 08.30. Angka yang disebut adalah jam berikutnya.',next:'note'},
  note:{speaker:'narator',lang:'id',text:p.events.some(e=>e.step==='clock' && !e.correct)?'Mia menghapus angka yang keliru dan menuliskan 08.30 pada catatan pengambilan.':'Mia menuliskan 08.30 pada catatan pengambilan.'},
  'new-intro':{speaker:'narator',lang:'id',text:'Pada kartu pesanan lain tertulis „halb zehn“. Mia ingin mencatat waktu yang berbeda tanpa menukar kedua pesanan.',next:'new-question'},
  'new-question':{speaker:'mia',lang:'de',text:'Und wann ist diese Bestellung fertig?',translation:'Dan kapan pesanan ini siap?'},
  'new-retry':{speaker:'mia',lang:'de',text:'Bist du sicher? Auf der Karte steht halb zehn.',translation:'Kamu yakin? Pada kartu tertulis setengah sepuluh.'},
  'new-tutor':{speaker:'tutor',lang:'id',text:'Mulai dari pukul sepuluh, lalu mundur setengah jam.'},
  'new-correct':{speaker:'mia',lang:'de',text:'Danke! Ich schreibe die Zeit auf die zweite Karte.',translation:'Terima kasih! Kutulis waktunya pada kartu kedua.'},
 };
 const current=beats[p.beat];const isChoice=p.beat==='question'||p.beat==='new-question';const retry=p.beat==='retry'||p.beat==='new-retry';const isTutor=p.beat==='tutor'||p.beat==='new-tutor';
 const set=(beat:ClockBeat,opts?:{help?:boolean;clear?:boolean})=>{setTranslation(false);p.setBeat(beat,opts);};
 const currentChar=current.speaker==='narator'?null:current.speaker;const right=currentChar==='penjual-pasar'||currentChar==='mia'||currentChar==='tutor'?currentChar:'mia';
 const stage:StageState={bg:'kios-pasar',chars:[{id:'player',side:'left'},{id:right,side:'right'}],overlay:null,ambience:'none'};
 const times=p.step==='clock'?[['08:30','08.30'],['09:30','09.30']]:[['09:30','09.30'],['10:30','10.30']];
 return <main className="relative h-full overflow-hidden bg-[#1f2740] text-[#f7efdd]"><Stage stage={stage} player={p.player} speakingChar={null} mouthOpen={false} reducedMotion={p.reducedMotion}/><header className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-1 p-2"><span className="mr-auto rounded bg-[#1b2033]/80 px-2 py-1 text-xs font-semibold">A1 · Bab 02 · {CHAPTER_TWO.title} · {sceneTitleForStep(p.step)} · {p.player.name}</span><button className="btn-top" onClick={()=>setPanel('journal')}>Jurnal</button><button className="btn-top" onClick={()=>setPanel('history')}>Riwayat</button><button className="btn-top" onClick={p.onBack}>Judul</button></header>
 <DialogPanel speaker={current.speaker} playerName={p.player.name} text={current.text} lang={current.lang} translation={current.translation} showTranslation={translation} onToggleTranslation={()=>setTranslation(x=>!x)} canListen={false} onListen={()=>{}} isSpeaking={false} audioStatus={current.lang==='de'?'Klip tepat belum tersedia · baca teks.':undefined}>
 {current.next && <NextButton onClick={()=>set(current.next!)}/>}
 {isChoice && <><details className="mb-2"><summary>Baca catatan</summary><p lang="de">{p.step==='clock'?"Komm bitte um halb neun wieder.":"halb zehn"}</p></details><fieldset><legend className="text-sm font-semibold">{p.step==='clock'?'Waktu pengambilan pada catatan':'Waktu pada kartu baru'}</legend><div className="flex flex-wrap gap-2">{times.map(([value,label])=><label className="btn-choice" key={value}><input name="time" type="radio" checked={p.draft===value} onChange={()=>p.setDraft(value)}/> {label}</label>)}</div></fieldset><div className="mt-2 flex flex-wrap gap-2"><button className="btn-primary" disabled={!p.draft} onClick={p.submit}>Periksa jawaban</button><button className="btn-secondary" onClick={()=>set(p.step==='clock'?'tutor':'new-tutor',{help:true})}>Minta bantuan</button></div></>}
 {retry && <div className="flex flex-wrap gap-2"><button className="btn-primary" onClick={()=>set(p.step==='clock'?'question':'new-question',{clear:true})}>Coba lagi</button><button className="btn-secondary" onClick={()=>set(p.step==='clock'?'tutor':'new-tutor',{help:true})}>Minta bantuan tutor</button></div>}
 {isTutor && <NextButton label="Coba lagi" onClick={()=>set(p.step==='clock'?'question':'new-question',{clear:true})}/>}
 {p.beat==='note' && <NextButton label="Lihat kartu berikutnya" onClick={p.advance}/>}{p.beat==='new-correct' && <NextButton label="Lanjutkan" onClick={p.advance}/>}
 </DialogPanel>
 {panel && <Modal title={panel==='journal'?'Jurnal Bab 02':'Riwayat percakapan'} onClose={()=>setPanel(null)} wide>{panel==='history' && <>{p.beat!=='arrival' && <p>Penjual: Komm bitte um halb neun wieder.</p>}{!['arrival','seller'].includes(p.beat) && <p>Mia: Wann holen wir den Korb ab?</p>}{p.events.some(e=>e.step==='clock'&&!e.correct) && <p>Mia: Moment … halb neun oder halb zehn?</p>}{p.events.some(e=>e.step==='clock'&&e.correct) && <p>Mia: Gut, um halb neun! Mia mencatat 08.30.</p>}{p.step==='clock-new' && <p>Kartu pesanan lain: halb zehn.</p>}</>}<p>Keranjang 8 euro sudah disiapkan. Jadwal pengambilan sedang dicatat.</p>{p.events.filter(e=>e.step==='clock'||e.step==='clock-new').length===0?<p>Belum ada respons untuk waktu.</p>:<ul>{p.events.filter(e=>e.step==='clock'||e.step==='clock-new').map((e,i)=><li key={i}>{e.step==='clock'?'Waktu pengambilan':'Kartu waktu baru'} · {e.value} · {e.first===undefined?'bantuan tidak tercatat':e.first?(e.help?'pertama berbantuan':'respons pertama tanpa bantuan'):(e.help?'revisi berbantuan':'ulangan')} · {e.correct?'sesuai':'perlu revisi'} · {e.mode ?? 'membaca'}</li>)}</ul>}<p>Jawaban pilihan adalah membaca, bukan menyimak atau berbicara. Bab selesai tidak berarti keterampilan dikuasai.</p></Modal>}
 </main>;
}
