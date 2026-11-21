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

/** One question followed by a separate description of the answer. No grammar mastery claim. */
export function assessNewFamilyQuestion(value:string):boolean {
 const s=normalize(value);return /\bwie viele geschwister\b/.test(s)&&/\b(?:hat|haben)\b/.test(s)&&!/\b(?:nicht|kein|keine|sondern|oder)\b/.test(s);
}
export function assessNewFamilyDescription(value:string):{count:boolean;relations:boolean} {
 const s=normalize(value);if(/\b(?:nicht|kein|keine|sondern|oder|aber)\b/.test(s))return {count:false,relations:false};
 const count=/\b(?:zwei|2) geschwister\b/.test(s)&&!/\b(?:eins|ein|drei|vier|1|3|4) geschwister\b/.test(s);
 const relations=/\b(?:ein|einen) bruder\b/.test(s)&&/\beine schwester\b/.test(s)&&!/\b(?:zwei|drei|2|3) (?:bruder|schwestern)\b/.test(s);
 return {count,relations};
}

/** Heuristics for chapter three; ambiguous or contradictory responses are not auto-approved. */
export type FollowSkill='status'|'status-new'|'status-divorced'|'visit'|'visit-question'|'owners'|'visit-new'|'independent-ask'|'independent-relations'|'independent-intro'|'independent-status'|'independent-visit';
export function assessFollow(value:string,skill:FollowSkill):boolean {
 const s=normalize(value);
 if(/\b(?:nicht|kein|keine|sondern|aber|oder|geschieden)\b/.test(s) && !['status-new','status-divorced'].includes(skill))return false;
 switch(skill){
  case 'status':return /\bzusammen\b/.test(s)&&/\bwohn(?:en|t)\b/.test(s)&&/\bverheiratet\b/.test(s)&&!/\bledig\b/.test(s);
  case 'status-new':return /\bzusammen\b/.test(s)&&/\bwohn(?:en|t)\b/.test(s)&&/\bledig\b/.test(s)&&!/\b(?:nicht|kein|keine|sondern|aber|oder|verheiratet|geschieden)\b/.test(s);
  case 'status-divorced':return /\bgeschieden\b/.test(s)&&/\bwohn(?:t|en)\b/.test(s)&&/\ballein\b/.test(s)&&!/\b(?:nicht|kein|keine|sondern|aber|oder|verheiratet|ledig)\b/.test(s);
  case 'visit':return /\bich besuche meinen onkel\b/.test(s);
  case 'visit-question':return /\bbesuchst du deinen onkel\b/.test(s);
  case 'owners':return /\bmia\b/.test(s)&&/\bihr bruder\b/.test(s)&&/\bleon\b/.test(s)&&/\bsein bruder\b/.test(s)&&!/\b(?:ihr bruder.*mia|sein bruder.*leon)\b/.test(s);
  case 'visit-new':return /\bmia besucht ihren bruder\b/.test(s);
  case 'independent-ask':return /\bwie viele kinder\b/.test(s)&&/\b(?:hat|haben)\b/.test(s);
  case 'independent-relations':return /\b(?:zwei|2) kinder\b/.test(s)&&/\b(?:ein|einen) sohn\b/.test(s)&&/\beine tochter\b/.test(s)&&!/\b(?:drei|vier|3|4) kinder\b/.test(s);
  case 'independent-intro':return /\bmein bruder\b/.test(s)&&/\bmeine schwester\b/.test(s)&&!/\b(?:meine bruder|mein schwester)\b/.test(s);
  case 'independent-status':return /\bwohn(?:en|t)\b/.test(s)&&/\bzusammen\b/.test(s)&&/\bverheiratet\b/.test(s)&&!/\bledig\b/.test(s);
  case 'independent-visit':return /\bmara besucht ihren onkel\b/.test(s);
 }
}
