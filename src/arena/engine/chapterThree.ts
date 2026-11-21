// Conservative checks for content, not a general German grammar evaluator.
const normalize=(s:string)=>s.toLocaleLowerCase('de').normalize('NFC').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
export function assessFamilyPossessive(value:string,kind:'task'|'new-task'):boolean{
 const s=normalize(value);if(/\b(?:nicht|kein|keine|sondern|aber|oder)\b/.test(s))return false;
 const required=kind==='task'?['mein bruder','meine schwester','meine eltern']:['mein kind','meine kinder','meine tante'];
 const contradictory=kind==='task'?['meine bruder','mein schwester','mein eltern']:['meine kind','mein kinder','mein tante'];
 const has=(v:string)=>new RegExp(`\\b${v}\\b`,'u').test(s);
 return required.every(has)&&!contradictory.some(has);
}

export function assessCount(value:string,kind:'task'|'new-task'):boolean{
 const s=normalize(value);if(/\b(?:nicht|kein|keine|sondern|aber|oder)\b/.test(s))return false;
 if(kind==='task')return /\b(?:zwei|2) geschwister\b/.test(s)&&/\beinen bruder\b/.test(s)&&/\beine schwester\b/.test(s)&&/\bwie viele kinder\b/.test(s)&&!(/\b(?:drei|3|vier|4) geschwister\b/.test(s));
 return /\b(?:drei|3) kinder\b/.test(s)&&!/\b(?:zwei|2|vier|4) kinder\b/.test(s);
}
