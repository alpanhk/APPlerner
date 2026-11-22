/** A deliberately limited menu parser: no order is served until it is clear and confirmed. */
export const MENU = {Kaffee:3,Tee:2,Suppe:5,Brot:2,Wasser:2} as const;
export type Item=keyof typeof MENU;
export type Order=Item[];
const names=Object.keys(MENU) as Item[];
const normalize=(s:string)=>s.toLocaleLowerCase('de').normalize('NFC').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const found=(s:string):Item[]=>names.filter(n=>new RegExp(`\\b${n.toLowerCase()}\\b`,'u').test(s));
export type OrderResult={status:'clear'|'ambiguous';items:Order;grammar:'sesuai pola'|'perlu telaah';reason:string};
export function parseOrder(value:string,prior:Order=[]):OrderResult {
 const s=normalize(value);const unclear=(reason:string):OrderResult=>({status:'ambiguous',items:[],grammar:'perlu telaah',reason});
 if(/\b(?:oder|vielleicht|weiss nicht|eventuell)\b/.test(s))return unclear('Pilihan masih ambigu; pelayan belum menyiapkan barang.');
 // We do not silently drop unhandled amounts or words naming unavailable menu items.
 if(/\b(?:zwei|drei|vier|5|4|3|2|saft|milch|kuchen|wein|bier)\b/.test(s))return unclear('Jumlah atau barang belum dapat dipastikan pada menu ini.');
 const allowed=new Set(['ich','wir','möchte','moechte','mochte','hätte','haette','hatte','gern','gerne','nehme','nehmen','bestelle','bitte','für','fuer','den','gast','und','dazu','ein','eine','einen','dem','der','das','die','statt','lieber','kein','keine','keinen','nicht','sondern','1','kaffee','tee','suppe','brot','wasser']);
 if(s.split(' ').some(w=>!allowed.has(w)))return unclear('Ein Teil der Bestellung ist noch unklar oder nicht auf der Karte.');
 let items:Order;const correction=s.match(/\bstatt (?:einen |eine |ein |dem |der )?(kaffee|tee|suppe|brot|wasser) (?:lieber |bitte |mochte ich |mochte |nehme ich |nehmen wir )?(?:einen |eine |ein )?(kaffee|tee|suppe|brot|wasser)\b/)
   ??s.match(/\b(?:kein|keinen|keine|nicht) (kaffee|tee|suppe|brot|wasser) sondern (?:lieber |bitte |einen |eine |ein )*(kaffee|tee|suppe|brot|wasser)\b/);
 if(correction){const before=names.find(x=>x.toLowerCase()===correction[1])!,after=names.find(x=>x.toLowerCase()===correction[2])!;if(!prior.includes(before)||before===after||found(s).length!==2)return unclear('Perubahan belum jelas; sebutkan barang yang ada dan penggantinya.');items=names.filter(x=>(prior.includes(x)&&x!==before)||x===after);}
 else {if(/\b(?:nicht|kein|keine|keinen|sondern|statt|doch|ausser)\b/.test(s))return unclear('Ada penyangkalan atau perubahan yang belum jelas.');items=found(s);if(!items.length)return unclear('Barang belum dapat dikenali; pelayan meminta penjelasan.');}
 // Duplicate mentions can indicate quantities, alternatives or a correction we did not understand.
 if(!correction&&items.some(x=>(s.match(new RegExp(`\\b${x.toLowerCase()}\\b`,'gu'))||[]).length>1))return unclear('Barang disebut lebih dari sekali; jumlahnya perlu dikonfirmasi.');
 const wrong=/\b(?:ein|eine) kaffee\b|\b(?:ein|einen) suppe\b|\b(?:ein|eine) tee\b|\b(?:einen|eine) wasser\b|\b(?:einen|eine) brot\b/.test(s);
 const forms:Record<Item,string>={Kaffee:'einen kaffee',Tee:'einen tee',Suppe:'eine suppe',Brot:'ein brot',Wasser:'ein wasser'};
 const grammar=!correction&&!wrong&&/\bich (?:mochte|möchte|moechte)\b/.test(s)&&items.every(x=>s.includes(forms[x]))?'sesuai pola':'perlu telaah';
 return {status:'clear',items,grammar,reason:grammar==='perlu telaah'?'Barang dipahami; bentuk bahasa masih perlu telaah.':'Barang dipahami; pola terbatas, bukan penilaian tata bahasa penuh.'};
}
export const orderTotal=(items:Order)=>items.reduce((sum,x)=>sum+MENU[x],0);
export function assessCafe(value:string,task:string):boolean{
 const s=normalize(value);if(/\b(?:nicht|kein|keine|sondern|oder)\b/.test(s))return false;
 switch(task){
 case 'taste': return /\b(?:mia ist|du bist) durstig\b/.test(s)&&/\b(?:der )?kuchen ist lecker\b/.test(s)&&/\b(?:der gast|gast|ich) bin hungrig\b|\b(?:der )?gast ist hungrig\b/.test(s)&&/\bwasser\b/.test(s);
 case 'taste-new':return /\b(?:der )?gast ist hungrig\b/.test(s)&&/\b(?:die )?suppe ist lecker\b/.test(s);
 case 'menu':return /\bspeisekarte\b/.test(s)&&/\b(?:empfehlen|empfehlung)\b/.test(s);
 case 'bill':return /\brechnung\b/.test(s)&&/\bgetrennt\b/.test(s)&&/\bkarte\b/.test(s);
 case 'habits':return /fr(?:ü|u)hst(?:ü|u)ck.{0,30}\besse ich brot\b/.test(s)&&/\bmittagessen.{0,30}\bisst mia suppe\b/.test(s)&&/\b(?:abendessen|abend).{0,30}\btrinkt leon tee\b/.test(s);
 case 'guest-menu':return /\b(?:empfehlen|empfehlung)\b/.test(s);
 case 'guest-bill':return /\brechnung\b/.test(s)&&/\bgetrennt\b/.test(s);
 case 'guest-habit':return /fr(?:ü|u)hst(?:ü|u)ck/.test(s)&&/\b(?:isst der gast brot|der gast isst brot)\b/.test(s);
 default:return false;
 }
}

export function cafeSceneIndex(s:{step?:string;phase?:string}|null):number{const step=s?.step??'';if(s?.phase==='journal'||step==='close'||step==='journal')return 4;if(step.startsWith('guest'))return 3;if(['habits-explain','habits'].includes(step))return 2;if(['menu','order-explain','order','bill-explain','bill'].includes(step))return 1;return 0;}
