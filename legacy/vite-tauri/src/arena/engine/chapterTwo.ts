export type Assessment = { correct:boolean; reason:string; day?:boolean; time?:boolean };
const clean=(s:string)=>s.toLocaleLowerCase('de').normalize('NFC').replace(/ß/g,'ss').replace(/\s+/g,' ').trim();
/** Conservative matching of the intended day and time, not a general German parser. */
export function assessMessage(value:string):Assessment {
 const s=clean(value);const days=['montag','dienstag','mittwoch','donnerstag','freitag','samstag','sonntag'].filter(d=>new RegExp(`\\b${d}\\b`).test(s));
 const day=days.length===1 && days[0]==='samstag';
 const negation=/\b(?:nicht|kein|keine|sondern|aber)\b/.test(s);
 const matches=s.match(/\b(?:0?[0-9]|1[0-9]|2[0-3])\s*[:.]\s*[0-5][0-9]\b/g) || [];
 const numeric=matches.map(x=>x.replace(/\s/g,'').replace('.',':'));
 const target=/\bhalb neun\b/.test(s)||/\b(?:acht uhr dreissig|acht uhr 30|8 uhr 30)\b/.test(s)||numeric.some(x=>/^0?8:30$/.test(x));
 const clockWords=s.match(/\b(?:[01]?\d|2[0-3]|eins|zwei|drei|vier|fünf|funf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf)\s+uhr(?:\s+(?:dreissig|30))?\b/g) ?? [];
 const otherTime=numeric.some(x=>!/^0?8:30$/.test(x)) || clockWords.some(x=>! /^(?:acht|0?8) uhr (?:dreissig|30)$/.test(x)) || /\bhalb (?:acht|zehn|elf|zwölf|zwoelf)\b/.test(s);
 const time=target && !otherTime;
 if(negation||days.length>1||otherTime&&target)return {correct:false,day:false,time:false,reason:'Beberapa waktu atau penyangkalan belum dapat dipastikan otomatis. Tulis satu hari dan satu jam atau minta telaah.'};
 if(!day && !time)return {correct:false,day,time,reason:'Hari dan jam belum cocok. Pesanan siap Sabtu pukul halb neun.'};
 if(!day)return {correct:false,day,time,reason:'Jam sudah terbaca benar. Periksa harinya: Kamis ditambah dua hari.'};
 if(!time)return {correct:false,day,time,reason:'Sabtu sudah benar. Periksa hanya jam: halb neun adalah 08.30, bukan 09.30.'};
 return {correct:true,day,time,reason:'Sabtu dan 08.30 tersampaikan. Tata bahasa lengkap masih perlu telaah.'};
}
export function assessTransferQuestion(value:string):boolean {
 const s=clean(value);return /\b(?:wie viel|was)\s+(?:kostet|kosten)\b/.test(s) && /\b(?:wann|uhrzeit)\b/.test(s) && !/\b(?:nicht|kein|sondern)\b/.test(s);
}

/** A fresh Friday appointment. Only clear, non-contradictory day and time are scored. */
export function assessFridayMessage(value:string):Assessment {
 const s=clean(value);
 if (/\b(?:nicht|kein|keine|sondern|aber)\b/.test(s)) return {correct:false,reason:'Maksud belum dapat dipastikan otomatis; jelaskan satu hari dan satu jam.'};
 const day=/\bam freitag\b/.test(s) && !/\b(?:montag|dienstag|mittwoch|donnerstag|samstag|sonntag)\b/.test(s);
 const time=/\bum (?:neun|9|09) uhr\b/.test(s) || /\bum 0?9[:.]00\b/.test(s);
 const numeric=s.match(/\b(?:0?[0-9]|1[0-9]|2[0-3])\s*[:.]\s*[0-5][0-9]\b/g) ?? [];
 const words=s.match(/\b(?:[01]?\d|2[0-3]|eins|zwei|drei|vier|fünf|funf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf)\s+uhr(?:\s+(?:dreissig|30))?\b/g) ?? [];
 const other=numeric.some(x=>!/^0?9[:.]00$/.test(x.replace(/\s/g,''))) || words.some(x=>!/^(?:neun|0?9) uhr$/.test(x)) || /\b(?:halb|viertel)\b/.test(s);
 if(day && time && !other) return {correct:true,day,time,reason:'Hari Jumat dan jam sembilan tersampaikan; tulisan masih perlu telaah.'};
 return {correct:false,day,time,reason:day?'Hari sudah sesuai; periksa jam dan gunakan um.':'Periksa hari dan jam pada kartu; gunakan am untuk hari dan um untuk jam.'};
}
