/** Each profile owns its keys. Legacy keys are copied, never removed. */
export type Profile = { id:string; name:string; portrait?:string };
type Registry = { version:1; active:string | null; profiles:Profile[] };
const REGISTRY = 'lernen.profiles.v1';
function newId():string { const bytes=crypto.getRandomValues(new Uint8Array(16)); return Array.from(bytes, b=>b.toString(16).padStart(2,'0')).join(''); }
// Pin the active identity to this window so another tab cannot redirect its writes.
let windowActive:string | null | undefined;
const own = (key:string) => key === 'lernen.progress.v1' || key === 'lernen.chapter01.v1' || key === 'lernen.chapter02.kiosk.v1' || key === 'lernen.station.v1' || key === 'lernen.web-reading.v1' || key.startsWith('lernen.prolog.draft.') || key.startsWith('lernen:a1-story:v1');
function read():Registry {
  const raw=localStorage.getItem(REGISTRY);
  if (!raw) return {version:1,active:null,profiles:[]};
  const value=JSON.parse(raw) as Registry;
  if(value.version!==1 || !Array.isArray(value.profiles)) throw new Error('Daftar profil tidak dapat dibaca; data tidak diubah.');
  return value;
}
const write=(v:Registry)=>localStorage.setItem(REGISTRY,JSON.stringify(v));
function copyLegacy(id:string) {
  const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)!).filter(own);
  for(const key of keys)localStorage.setItem(`lernen.profile.${id}.${key}`,localStorage.getItem(key)!);
}
export function initProfiles():Registry {
  const r=read(); if(localStorage.getItem(REGISTRY)){windowActive=r.active;return r;}
  const raw=localStorage.getItem('lernen.progress.v1');
  if(!raw){windowActive=null;return r;}
  const p=JSON.parse(raw);if(!p?.player?.name){windowActive=null;return r;}
  const profile:Profile={id:newId(),name:p.player.name,portrait:p.player.portrait};
  // Registry is the commit marker: a failed copy cannot hide or delete legacy data.
  copyLegacy(profile.id);
  const result:Registry={version:1,active:profile.id,profiles:[profile]};write(result);windowActive=result.active;return result;
}
export function profileKey(key:string):string {const id=windowActive === undefined ? read().active : windowActive;return id?`lernen.profile.${id}.${key}`:key;}
export function profiles():Registry {return read();}
export function createProfile(name:string,portrait?:string):Registry {const r=read();const profile={id:newId(),name,portrait};if(r.profiles.length===0)copyLegacy(profile.id);const next:Registry={version:1,active:profile.id,profiles:[...r.profiles,profile]};write(next);windowActive=next.active;return next;}
export function selectProfile(id:string):Registry {const r=read();if(!r.profiles.some(p=>p.id===id))throw new Error('Profil tidak ditemukan');const next={...r,active:id};write(next);windowActive=next.active;return next;}
