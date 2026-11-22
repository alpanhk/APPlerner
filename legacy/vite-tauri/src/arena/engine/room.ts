export type Room = 'wohnzimmer'|'küche';
export type RoomGoal = 'o1'|'o2'|'o3'|'o4'|'o5';
export const ROOM_KEY='lernen.chapter06.room.v1';
export type RoomStep = 'intro'|'tutor1'|'labels'|'plural'|'tutor2'|'contents'|'tutor3'|'location'|'tutor4'|'move'|'position'|'tutor5'|'tasks'|'independent-intro'|'ind-label'|'ind-contents'|'ind-location'|'ind-move'|'ind-position'|'ind-tasks'|'close'|'journal';
export const sceneForRoomStep=(step:RoomStep|undefined)=>!step||['intro','tutor1','labels','plural','tutor2','contents'].includes(step)?0:['tutor3','location','tutor4','move','position'].includes(step)?1:['tutor5','tasks'].includes(step)?2:step.startsWith('ind')?3:4;
const norm=(v:string)=>v.toLocaleLowerCase('de').normalize('NFC').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const kitchen=(s:string)=>/\b(?:in die küche|in die kueche)\b/.test(s);
const living=(s:string)=>/\b(?:ins wohnzimmer|in das wohnzimmer)\b/.test(s);
const loc=(s:string,r:Room)=>r==='küche'?/\b(?:in der küche|in der kueche)\b/.test(s):/\b(?:im wohnzimmer|in dem wohnzimmer)\b/.test(s);
export type Assessment={ok:boolean;destination?:Room};
/** Conservative patterns; reject uncertainty rather than moving furniture. */
export function assessRoom(step:RoomStep,value:string,table:Room,chair:Room):Assessment{
 const s=norm(value);if(/\b(?:nicht|kein|keine|keinen|oder|vielleicht|sondern|aber)\b/.test(s))return {ok:false};
 switch(step){
 case 'labels':return {ok:['das wohnzimmer','die küche','der tisch','der stuhl','das sofa'].every(x=>s.includes(x))};
 case 'plural':return {ok:['die tische','die stühle','die sofas'].every(x=>s.includes(x))};
 case 'contents':return {ok:/\bes gibt\b/.test(s)&&['einen tisch','eine lampe','ein sofa','zwei stühle'].every(x=>s.includes(x))};
 case 'location':return {ok:/\bdas buch liegt auf dem tisch\b/.test(s)&&/\bdie lampe steht\b/.test(s)&&loc(s,'wohnzimmer')};
 case 'move':case 'ind-move':{const item=step==='move'?'tisch':'stuhl';const destination=kitchen(s)?'küche':living(s)?'wohnzimmer':undefined;const current=step==='move'?table:chair;return {ok:!!destination&&destination!==current&&/\b(?:wir stellen|ich stelle)\b/.test(s)&&s.includes(`den ${item}`)&&!(kitchen(s)&&living(s)),destination};}
 case 'position':return {ok:/\b(?:er|der tisch) steht\b/.test(s)&&loc(s,table)};
 case 'tasks':return {ok:/\bich muss die fenster putzen\b/.test(s)&&/\b(?:ich|wir) räum(?:e|en) die küche auf\b/.test(s)};
 case 'ind-label':return {ok:s.includes('der stuhl')&&s.includes('die stühle')};
 case 'ind-contents':return {ok:/\bes gibt\b/.test(s)&&s.includes('einen stuhl')&&s.includes('eine lampe')};
 case 'ind-location':return {ok:/\b(?:der stuhl|er) steht\b/.test(s)&&loc(s,chair)};
 case 'ind-position':return {ok:/\b(?:der stuhl|er) steht\b/.test(s)&&loc(s,chair)};
 case 'ind-tasks':return {ok:/\bich muss die handtücher waschen\b/.test(s)&&/\b(?:ich|wir) räum(?:e|en) das zimmer auf\b/.test(s)};
 default:return {ok:false};
 }
}
