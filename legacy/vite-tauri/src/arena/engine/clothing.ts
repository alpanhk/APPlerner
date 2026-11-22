const norm=(s:string)=>s.toLocaleLowerCase('de').normalize('NFC').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
export type ShopTask='search'|'search-new'|'size'|'too-small'|'fits'|'ask-size'|'room'|'try'|'try-new'|'price'|'pay'|'receipt'|'exchange';
/** Conservative content checks, not a full grammar assessor. */
export function assessShop(value:string,task:ShopTask):boolean{
 const s=norm(value);if(/\b(?:nicht|kein|keine|keinen|sondern|oder|aber)\b/.test(s))return false;
 switch(task){
 case 'search':return /\b(?:ich suche|suche ich) einen mantel\b/.test(s)&&/\bhaben sie eine jacke\b/.test(s)&&/\bein hemd\b/.test(s)&&/\bdie schuhe\b/.test(s);
 case 'search-new':return /\b(?:ich suche|suche ich) einen pullover\b/.test(s);
 case 'size':return /\b(?:trage|habe)\b/.test(s)&&/\bgr(?:ö|oe|o)sse m\b/.test(s)&&!/\bgr(?:ö|oe|o)sse [sl]\b/.test(s);
 case 'too-small':return /\b(?:sie|die jacke) ist zu klein\b/.test(s);
 case 'fits':return /\b(?:sie|die jacke) passt\b/.test(s);
 case 'ask-size':return /\bwelche gr(?:ö|oe|o)sse\b/.test(s)&&/\b(?:tragen|hast|haben)\b/.test(s);
 case 'room':return /\bwo ist (?:die )?umkleidekabine\b/.test(s);
 case 'try':return /\bich probiere die jacke an\b/.test(s);
 case 'try-new':return /\bich probiere das hemd an\b/.test(s);
 case 'price':return /\b(?:was kostet|wie viel kostet) die jacke\b/.test(s);
 case 'pay':return /\b(?:ich zahle|ich bezahle) bar\b/.test(s);
 case 'receipt':return /\b(?:quittung|kassenzettel)\b/.test(s)&&/\bbitte\b/.test(s);
 case 'exchange':return /\b(?:umtauschen|tauschen|umtausch)\b/.test(s)&&/\bjacke\b/.test(s)&&/\bgr(?:ö|oe|o)sse s\b/.test(s)&&/\bgr(?:ö|oe|o)sse m\b/.test(s)&&/\b(?:habe|bekommen|erhalten)\b.{0,45}\bgr(?:ö|oe|o)sse s\b/.test(s)&&/\b(?:brauche|möchte|moechte|mochte|will)\b.{0,30}\bgr(?:ö|oe|o)sse m\b/.test(s);
 }
}
export function shopSceneIndex(s:{step?:string;phase?:string}|null):number{const x=s?.step??'';if(s?.phase==='journal'||x==='close'||x==='journal')return 4;if(x==='bag'||x==='exchange'||x==='exchange-reply')return 3;if(['price-explain','price','pay','receipt'].includes(x))return 2;if(['size-explain','size','too-small','fits','ask-size','room-explain','room','try','try-new'].includes(x))return 1;return 0;}
