export type Assessment = { ok:boolean; reason:string; partial?:boolean };
const norm=(s:string)=>s.toLocaleLowerCase('de').normalize('NFC').replace(/[ß]/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const has=(s:string,pattern:RegExp)=>pattern.test(s);
/** Deliberately narrow formative checks; cannot judge arbitrary German or mastery. */
export function assessChapter(goal:string,text:string,name:string,transfer=false):Assessment {
 const t=norm(text), n=norm(name); const word=(s:string)=>new RegExp(`(?:^| )${s}(?: |$)`);
 if(!t)return {ok:false,reason:'Tulis jawaban terlebih dahulu.'};
 if(/\b(?:nicht|kein|keine|keinen|aber|sondern)\b/.test(t))return {ok:false,reason:'Maksud belum dapat dipastikan otomatis karena ada penyangkalan atau pertentangan. Coba jelaskan lagi; tata bahasa tetap perlu telaah.'};
 if(goal==='a1-u1-o1'){const ok=has(t,transfer?/\bguten tag\b/:/\bguten morgen\b/);return {ok,reason:ok?'Sapaan sesuai situasi.':'Perhatikan waktu: pagi memakai Morgen; pertemuan siang memakai Tag.'};}
 if(goal==='a1-u1-o2'){
  const intro=(has(t,/\bich (?:heisse|bin)\b/)||has(t,/\bmein name ist\b/)) && !!n && has(t,word(n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  const question=has(t,/\bwie (?:heissen sie|ist ihr name)\b/);
  const nameOnly=t===n;
  if(nameOnly)return {ok:false,partial:true,reason:'Eva memahami namamu. Kalimat lengkap dan pertanyaan sopan masih perlu dilatih.'};
  if(!intro || !question)return {ok:false,reason:!intro?'Nama belum jelas dalam kalimat perkenalan.':'Tanyakan juga nama tamu dengan bentuk sopan Sie.'};
  return {ok:true,reason:'Nama dalam kalimat dan pertanyaan sopan terdeteksi; tata bahasa keseluruhan belum dinilai.'};
 }
 if(goal==='a1-u1-o3'){
  const [from,home]=transfer?['stuttgart','bonn']:['bandung','leipzig'];
  const origin=new RegExp(`\\b(?:komme|kommt|kommen) aus ${from}\\b`).test(t);
  const lives=new RegExp(`\\b(?:wohne|wohnt|wohnen) in ${home}\\b`).test(t);
  const swapped=new RegExp(`\\b(?:komme|kommt|kommen) aus ${home}\\b`).test(t)||new RegExp(`\\b(?:wohne|wohnt|wohnen) in ${from}\\b`).test(t);
  return {ok:origin&&lives&&!swapped,reason:origin&&lives&&!swapped?'Asal dan tempat tinggal sesuai kartu.':swapped?'Kota tertukar: woher menanyakan asal (aus), wo menanyakan tempat tinggal (in).':'Periksa dua keterangan: woher (asal, aus) dan wo (tinggal, in) sesuai kartu.'};
 }
 if(goal==='a1-u1-o4'){
  const person=transfer?/\b(?:mein freund amir|amir ist mein freund)\b/:/\b(?:meine freundin mia|mia ist meine freundin)\b/;
  const age=transfer?/\b(?:dreissig|30)\b/:/\b(?:zweiundzwanzig|22)\b/;
  const question=/\bwie alt (?:bist du|sind sie|ist (?:er|sie|dein freund|deine freundin))\b/;
  const ok=person.test(t)&&age.test(t)&&question.test(t);return {ok,reason:ok?'Teman, umur dan pertanyaan umur terdeteksi.':'Sebut teman dan umur sesuai kartu, lalu tanyakan umur dengan Wie alt …?'};
 }
 if(goal==='a1-u1-o5'){const missing=(transfer?['der freund','die freundin','das jahr','die länder','die jahre']:['der name','die frau','das land','die namen','die freunde']).filter(x=>!has(t,word(x)));return {ok:missing.length===0,reason:missing.length?`Periksa label yang belum terbaca: ${missing.length} dari lima. Pasangkan artikel dengan kata; dua terakhir jamak.`:'Tiga artikel tunggal dan dua label jamak terdeteksi.'};}
 return {ok:false,reason:'Respons memerlukan telaah manusia.'};
}
