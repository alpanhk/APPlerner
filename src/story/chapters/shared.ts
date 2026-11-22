// Pola jawaban yang dipakai lintas bab (lihat match.ts untuk sintaksnya).
export const INTRO_FULL = ["((nein|ja) )?(ich heisse|ich bin|mein name ist) {name}"];
export const INTRO_OTHER = ["((nein|ja) )?(ich heisse|ich bin|mein name ist) ~"];
export const NAME_ONLY = ["((nein|ja) )?{name}"];
export const GREET = ["(hallo|hi|hey|moin|servus|guten morgen|guten tag|guten abend)( ~)?"];
export const JA = ["ja( ~)?"];
export const NEIN = ["nein( ~)?"];
export const WELL = [
  "((mir geht (es|s)|mir gehts|es geht mir) )?(sehr )?(gut|super|prima|toll)( danke)?( und (dir|ihnen))?",
  "danke (sehr )?gut( und (dir|ihnen))?",
  "(es geht|nicht so gut|na ja)( danke)?( und (dir|ihnen))?",
];
export const ORIGIN = ["((nein|ja|doch) )?ich komme aus ~"];
