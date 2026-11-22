// BERKAS TER-GENERATE oleh scripts/gen_pilot_novel_media.cjs — jangan sunting tangan.
// PILOT-AGENT-1: aset produksi yang benar-benar dipakai kandidat, salinan
// berlisensi dari lernen-design/outputs + public/a1-story/audio (MP3 runtime).
// Menjalankan ulang generator idempoten; sumber tidak diubah.

import c_player_01_neutral from "../assets/characters/player-01/neutral.webp";
import c_player_01_smile from "../assets/characters/player-01/smile.webp";
import c_player_01_question from "../assets/characters/player-01/question.webp";
import c_player_01_speakOpen from "../assets/characters/player-01/speakOpen.webp";
import c_player_01_speakSmall from "../assets/characters/player-01/speakSmall.webp";
import c_player_02_neutral from "../assets/characters/player-02/neutral.webp";
import c_player_02_smile from "../assets/characters/player-02/smile.webp";
import c_player_02_question from "../assets/characters/player-02/question.webp";
import c_player_02_speakOpen from "../assets/characters/player-02/speakOpen.webp";
import c_player_02_speakSmall from "../assets/characters/player-02/speakSmall.webp";
import c_player_03_neutral from "../assets/characters/player-03/neutral.webp";
import c_player_03_smile from "../assets/characters/player-03/smile.webp";
import c_player_03_question from "../assets/characters/player-03/question.webp";
import c_player_03_speakOpen from "../assets/characters/player-03/speakOpen.webp";
import c_player_03_speakSmall from "../assets/characters/player-03/speakSmall.webp";
import c_player_04_neutral from "../assets/characters/player-04/neutral.webp";
import c_player_04_smile from "../assets/characters/player-04/smile.webp";
import c_player_04_question from "../assets/characters/player-04/question.webp";
import c_player_04_speakOpen from "../assets/characters/player-04/speakOpen.webp";
import c_player_04_speakSmall from "../assets/characters/player-04/speakSmall.webp";
import c_mia_neutral from "../assets/characters/mia/neutral.webp";
import c_mia_smile from "../assets/characters/mia/smile.webp";
import c_mia_question from "../assets/characters/mia/question.webp";
import c_mia_speakOpen from "../assets/characters/mia/speakOpen.webp";
import c_mia_speakSmall from "../assets/characters/mia/speakSmall.webp";
import c_tutor_neutral from "../assets/characters/tutor/neutral.webp";
import c_tutor_smile from "../assets/characters/tutor/smile.webp";
import c_tutor_question from "../assets/characters/tutor/question.webp";
import c_tutor_speakOpen from "../assets/characters/tutor/speakOpen.webp";
import c_tutor_speakSmall from "../assets/characters/tutor/speakSmall.webp";
import c_tetangga_neutral from "../assets/characters/tetangga/neutral.webp";
import c_tetangga_smile from "../assets/characters/tetangga/smile.webp";
import c_tetangga_question from "../assets/characters/tetangga/question.webp";
import c_tetangga_speakOpen from "../assets/characters/tetangga/speakOpen.webp";
import c_tetangga_speakSmall from "../assets/characters/tetangga/speakSmall.webp";
import c_pos_neutral from "../assets/characters/pos/neutral.webp";
import c_pos_smile from "../assets/characters/pos/smile.webp";
import c_pos_question from "../assets/characters/pos/question.webp";
import c_pos_speakOpen from "../assets/characters/pos/speakOpen.webp";
import c_pos_speakSmall from "../assets/characters/pos/speakSmall.webp";
import c_petugas_stasiun_neutral from "../assets/characters/petugas-stasiun/neutral.webp";
import c_petugas_stasiun_smile from "../assets/characters/petugas-stasiun/smile.webp";
import c_petugas_stasiun_question from "../assets/characters/petugas-stasiun/question.webp";
import c_petugas_stasiun_speakOpen from "../assets/characters/petugas-stasiun/speakOpen.webp";
import c_petugas_stasiun_speakSmall from "../assets/characters/petugas-stasiun/speakSmall.webp";
import c_eva_neutral from "../assets/characters/eva/neutral.webp";
import c_eva_smile from "../assets/characters/eva/smile.webp";
import c_eva_question from "../assets/characters/eva/question.webp";
import c_eva_speakOpen from "../assets/characters/eva/speakOpen.webp";
import c_eva_speakSmall from "../assets/characters/eva/speakSmall.webp";
import c_pendatang_baru_neutral from "../assets/characters/pendatang-baru/neutral.webp";
import c_pendatang_baru_smile from "../assets/characters/pendatang-baru/smile.webp";
import c_pendatang_baru_question from "../assets/characters/pendatang-baru/question.webp";
import c_pendatang_baru_speakOpen from "../assets/characters/pendatang-baru/speakOpen.webp";
import c_pendatang_baru_speakSmall from "../assets/characters/pendatang-baru/speakSmall.webp";
import bg_ruang_warga from "../assets/bg-story/ruang-warga.webp";
import bg_peron from "../assets/bg-story/peron.webp";
import bg_stasiun from "../assets/bg-story/stasiun.webp";
import bg_ambang_rumah from "../assets/bg-story/ambang-rumah.webp";
import sfx_peron_chime from "../assets/sfx-story/a1-sfx-peron-chime.opus";
import sfx_telepon from "../assets/sfx-story/a1-sfx-telepon.opus";
import sfx_kertas from "../assets/sfx-story/a1-sfx-kertas-surat.opus";
import hallo_player_01 from "../assets/voices/avatar/player-01/respons-hallo.mp3";
import hallo_player_02 from "../assets/voices/avatar/player-02/respons-hallo.mp3";
import hallo_player_03 from "../assets/voices/avatar/player-03/respons-hallo.mp3";
import hallo_player_04 from "../assets/voices/avatar/player-04/respons-hallo.mp3";

export interface CharFrames {
  neutral: string; smile: string; question: string; speakOpen: string; speakSmall: string;
}

export const CHAR_FRAMES: Record<string, CharFrames> = {
  "player-01": {
    neutral: c_player_01_neutral, smile: c_player_01_smile, question: c_player_01_question,
    speakOpen: c_player_01_speakOpen, speakSmall: c_player_01_speakSmall,
  },
  "player-02": {
    neutral: c_player_02_neutral, smile: c_player_02_smile, question: c_player_02_question,
    speakOpen: c_player_02_speakOpen, speakSmall: c_player_02_speakSmall,
  },
  "player-03": {
    neutral: c_player_03_neutral, smile: c_player_03_smile, question: c_player_03_question,
    speakOpen: c_player_03_speakOpen, speakSmall: c_player_03_speakSmall,
  },
  "player-04": {
    neutral: c_player_04_neutral, smile: c_player_04_smile, question: c_player_04_question,
    speakOpen: c_player_04_speakOpen, speakSmall: c_player_04_speakSmall,
  },
  "mia": {
    neutral: c_mia_neutral, smile: c_mia_smile, question: c_mia_question,
    speakOpen: c_mia_speakOpen, speakSmall: c_mia_speakSmall,
  },
  "tutor": {
    neutral: c_tutor_neutral, smile: c_tutor_smile, question: c_tutor_question,
    speakOpen: c_tutor_speakOpen, speakSmall: c_tutor_speakSmall,
  },
  "tetangga": {
    neutral: c_tetangga_neutral, smile: c_tetangga_smile, question: c_tetangga_question,
    speakOpen: c_tetangga_speakOpen, speakSmall: c_tetangga_speakSmall,
  },
  "pos": {
    neutral: c_pos_neutral, smile: c_pos_smile, question: c_pos_question,
    speakOpen: c_pos_speakOpen, speakSmall: c_pos_speakSmall,
  },
  "petugas-stasiun": {
    neutral: c_petugas_stasiun_neutral, smile: c_petugas_stasiun_smile, question: c_petugas_stasiun_question,
    speakOpen: c_petugas_stasiun_speakOpen, speakSmall: c_petugas_stasiun_speakSmall,
  },
  "eva": {
    neutral: c_eva_neutral, smile: c_eva_smile, question: c_eva_question,
    speakOpen: c_eva_speakOpen, speakSmall: c_eva_speakSmall,
  },
  "pendatang-baru": {
    neutral: c_pendatang_baru_neutral, smile: c_pendatang_baru_smile, question: c_pendatang_baru_question,
    speakOpen: c_pendatang_baru_speakOpen, speakSmall: c_pendatang_baru_speakSmall,
  },
};

export const STORY_BG: Record<string, string> = {
  "ruang-warga": bg_ruang_warga,
  "peron": bg_peron,
  "stasiun": bg_stasiun,
  "ambang-rumah": bg_ambang_rumah,
};

export const STORY_SFX: Record<string, string> = {
  "peron-chime": sfx_peron_chime,
  "telepon": sfx_telepon,
  "kertas": sfx_kertas,
};

/** "Hallo!" produksi per avatar — pratinjau "Dengar suara" (Mandat §4). */
export const AVATAR_HALLO: Record<string, string> = {
  "player-01": hallo_player_01,
  "player-02": hallo_player_02,
  "player-03": hallo_player_03,
  "player-04": hallo_player_04,
};

/** Respons tetap pemain (guten-morgen/ja/nein) per avatar. */
export const PLAYER_RESPONSE: Record<string, string> = {
  "player-01:guten-morgen": "../assets/voices/avatar/player-01/respons-guten-morgen.mp3",
  "player-01:ja": "../assets/voices/avatar/player-01/respons-ja.mp3",
  "player-01:nein": "../assets/voices/avatar/player-01/respons-nein.mp3",
  "player-02:guten-morgen": "../assets/voices/avatar/player-02/respons-guten-morgen.mp3",
  "player-02:ja": "../assets/voices/avatar/player-02/respons-ja.mp3",
  "player-02:nein": "../assets/voices/avatar/player-02/respons-nein.mp3",
  "player-03:guten-morgen": "../assets/voices/avatar/player-03/respons-guten-morgen.mp3",
  "player-03:ja": "../assets/voices/avatar/player-03/respons-ja.mp3",
  "player-03:nein": "../assets/voices/avatar/player-03/respons-nein.mp3",
  "player-04:guten-morgen": "../assets/voices/avatar/player-04/respons-guten-morgen.mp3",
  "player-04:ja": "../assets/voices/avatar/player-04/respons-ja.mp3",
  "player-04:nein": "../assets/voices/avatar/player-04/respons-nein.mp3",
};

/** Klip prolog berlisensi, kunci = nama berkas (mis. c_mia1-s01). */
export const PROLOG_AUDIO: Record<string, { src: string; char: string }> = {
  "c_bye-s01": { src: "../assets/voices/prolog/mia/c_bye-s01.mp3", char: "mia" },
  "c_bye-s02": { src: "../assets/voices/prolog/mia/c_bye-s02.mp3", char: "mia" },
  "c_greet-s01": { src: "../assets/voices/prolog/mia/c_greet-s01.mp3", char: "mia" },
  "c_greet-s02": { src: "../assets/voices/prolog/mia/c_greet-s02.mp3", char: "mia" },
  "c_janein-s01": { src: "../assets/voices/prolog/mia/c_janein-s01.mp3", char: "mia" },
  "c_janein-s02": { src: "../assets/voices/prolog/mia/c_janein-s02.mp3", char: "mia" },
  "c_mia1-s01": { src: "../assets/voices/prolog/mia/c_mia1-s01.mp3", char: "mia" },
  "c_mia1-s02": { src: "../assets/voices/prolog/mia/c_mia1-s02.mp3", char: "mia" },
  "c_mia1-s03": { src: "../assets/voices/prolog/mia/c_mia1-s03.mp3", char: "mia" },
  "c_wrongname-s01": { src: "../assets/voices/prolog/mia/c_wrongname-s01.mp3", char: "mia" },
  "c_wrongname-s02": { src: "../assets/voices/prolog/mia/c_wrongname-s02.mp3", char: "mia" },
  "c_wrongname-s03": { src: "../assets/voices/prolog/mia/c_wrongname-s03.mp3", char: "mia" },
  "d_post_again-s01": { src: "../assets/voices/prolog/pos/d_post_again-s01.mp3", char: "pos" },
  "d_post_already-s02": { src: "../assets/voices/prolog/pos/d_post_already-s02.mp3", char: "pos" },
  "d_post_already-s03": { src: "../assets/voices/prolog/pos/d_post_already-s03.mp3", char: "pos" },
  "d_post_give-s02": { src: "../assets/voices/prolog/pos/d_post_give-s02.mp3", char: "pos" },
  "d_post_greet-s01": { src: "../assets/voices/prolog/pos/d_post_greet-s01.mp3", char: "pos" },
  "d_post_greet-s02": { src: "../assets/voices/prolog/pos/d_post_greet-s02.mp3", char: "pos" },
  "d_post_ja-s01": { src: "../assets/voices/prolog/pos/d_post_ja-s01.mp3", char: "pos" },
  "d_post_ja-s03": { src: "../assets/voices/prolog/pos/d_post_ja-s03.mp3", char: "pos" },
  "d_post_ja_mia-s01": { src: "../assets/voices/prolog/pos/d_post_ja_mia-s01.mp3", char: "pos" },
  "d_post_ja_mia-s02": { src: "../assets/voices/prolog/pos/d_post_ja_mia-s02.mp3", char: "pos" },
  "d_post_ja_mia-s03": { src: "../assets/voices/prolog/pos/d_post_ja_mia-s03.mp3", char: "pos" },
  "d_post_nein-s01": { src: "../assets/voices/prolog/pos/d_post_nein-s01.mp3", char: "pos" },
  "d_post_nein-s02": { src: "../assets/voices/prolog/pos/d_post_nein-s02.mp3", char: "pos" },
  "d_post_other-s01": { src: "../assets/voices/prolog/pos/d_post_other-s01.mp3", char: "pos" },
  "d_post_q-s01": { src: "../assets/voices/prolog/pos/d_post_q-s01.mp3", char: "pos" },
  "d_post_q-s02": { src: "../assets/voices/prolog/pos/d_post_q-s02.mp3", char: "pos" },
  "d_nb1-s01": { src: "../assets/voices/prolog/tetangga/d_nb1-s01.mp3", char: "tetangga" },
  "d_nb_hm-s01": { src: "../assets/voices/prolog/tetangga/d_nb_hm-s01.mp3", char: "tetangga" },
  "d_nb_hm-s02": { src: "../assets/voices/prolog/tetangga/d_nb_hm-s02.mp3", char: "tetangga" },
  "d_nb_ok-s01": { src: "../assets/voices/prolog/tetangga/d_nb_ok-s01.mp3", char: "tetangga" },
  "a_tutor1-s02": { src: "../assets/voices/prolog/tutor/a_tutor1-s02.mp3", char: "tutor" },
  "a_tutor1-s03": { src: "../assets/voices/prolog/tutor/a_tutor1-s03.mp3", char: "tutor" },
  "a_tutor2-s01": { src: "../assets/voices/prolog/tutor/a_tutor2-s01.mp3", char: "tutor" },
  "a_tutor3-s01": { src: "../assets/voices/prolog/tutor/a_tutor3-s01.mp3", char: "tutor" },
  "b_contoh1-s01": { src: "../assets/voices/prolog/tutor/b_contoh1-s01.mp3", char: "tutor" },
  "b_contoh2-s01": { src: "../assets/voices/prolog/tutor/b_contoh2-s01.mp3", char: "tutor" },
  "b_greetonly-s01": { src: "../assets/voices/prolog/tutor/b_greetonly-s01.mp3", char: "tutor" },
  "b_hallo-s01": { src: "../assets/voices/prolog/tutor/b_hallo-s01.mp3", char: "tutor" },
  "b_intro-s01": { src: "../assets/voices/prolog/tutor/b_intro-s01.mp3", char: "tutor" },
  "b_intro-s02": { src: "../assets/voices/prolog/tutor/b_intro-s02.mp3", char: "tutor" },
  "b_nameonly-s01": { src: "../assets/voices/prolog/tutor/b_nameonly-s01.mp3", char: "tutor" },
  "b_ok-s01": { src: "../assets/voices/prolog/tutor/b_ok-s01.mp3", char: "tutor" },
  "b_ok-s02": { src: "../assets/voices/prolog/tutor/b_ok-s02.mp3", char: "tutor" },
  "b_tip-s02": { src: "../assets/voices/prolog/tutor/b_tip-s02.mp3", char: "tutor" },
  "b_tip-s03": { src: "../assets/voices/prolog/tutor/b_tip-s03.mp3", char: "tutor" },
  "b_wrongname-s01": { src: "../assets/voices/prolog/tutor/b_wrongname-s01.mp3", char: "tutor" },
  "b_wrongname-s02": { src: "../assets/voices/prolog/tutor/b_wrongname-s02.mp3", char: "tutor" },
  "c_tutor-s01": { src: "../assets/voices/prolog/tutor/c_tutor-s01.mp3", char: "tutor" },
  "c_tutor-s02": { src: "../assets/voices/prolog/tutor/c_tutor-s02.mp3", char: "tutor" },
};

/** Klip bab 11-12; kunci = assetId jalur a1-story. */
export const STORY_AUDIO: Record<string, { src: string; char: string; scene: string; transcript: string }> = {
  "a1-ch11.s01.umum.dialog-01.mia": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-umum-dialog-01-mia.mp3", char: "mia", scene: "s01", transcript: "Die Tickets habe ich. Hast du das Buch?" },
  "a1-ch11.s01.a1-u11-o1.tutor-id-01.tutor": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o1-tutor-id-01-tutor.mp3", char: "tutor", scene: "s01", transcript: "Untuk kota dan negara tanpa artikel gunakan nach. Untuk tujuan negara berartikel seperti Swiss gunakan in die Schweiz." },
  "a1-ch11.s01.a1-u11-o1.dialog-01.mia": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o1-dialog-01-mia.mp3", char: "mia", scene: "s01", transcript: "Wohin fahren wir heute? Und wohin fährt Herr Bauer im Sommer?" },
  "a1-ch11.s01.a1-u11-o1.pemain-baku-01.player-01": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o1-pemain-baku-01-player-01.mp3", char: "player-01", scene: "s01", transcript: "Wir fahren nach Leipzig. Herr Bauer fährt in die Schweiz." },
  "a1-ch11.s01.a1-u11-o1.pemain-baku-01.player-02": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o1-pemain-baku-01-player-02.mp3", char: "player-02", scene: "s01", transcript: "Wir fahren nach Leipzig. Herr Bauer fährt in die Schweiz." },
  "a1-ch11.s01.a1-u11-o1.pemain-baku-01.player-03": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o1-pemain-baku-01-player-03.mp3", char: "player-03", scene: "s01", transcript: "Wir fahren nach Leipzig. Herr Bauer fährt in die Schweiz." },
  "a1-ch11.s01.a1-u11-o1.pemain-baku-01.player-04": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o1-pemain-baku-01-player-04.mp3", char: "player-04", scene: "s01", transcript: "Wir fahren nach Leipzig. Herr Bauer fährt in die Schweiz." },
  "a1-ch11.s01.a1-u11-o1.pemain-baku-02.player-01": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o1-pemain-baku-02-player-01.mp3", char: "player-01", scene: "s01", transcript: "nach Deutschland" },
  "a1-ch11.s01.a1-u11-o1.pemain-baku-02.player-02": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o1-pemain-baku-02-player-02.mp3", char: "player-02", scene: "s01", transcript: "nach Deutschland" },
  "a1-ch11.s01.a1-u11-o1.pemain-baku-02.player-03": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o1-pemain-baku-02-player-03.mp3", char: "player-03", scene: "s01", transcript: "nach Deutschland" },
  "a1-ch11.s01.a1-u11-o1.pemain-baku-02.player-04": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o1-pemain-baku-02-player-04.mp3", char: "player-04", scene: "s01", transcript: "nach Deutschland" },
  "a1-ch11.s01.a1-u11-o2.tutor-id-01.tutor": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o2-tutor-id-01-tutor.mp3", char: "tutor", scene: "s01", transcript: "Abfahrt ialah keberangkatan, Ankunft ialah kedatangan. Pada «Wann kommt der Zug an?» bagian an terdengar paling akhir." },
  "a1-ch11.s01.a1-u11-o2.tutor-de-01.tutor": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o2-tutor-de-01-tutor.mp3", char: "tutor", scene: "s01", transcript: "Wann kommt der Zug an?" },
  "a1-ch11.s01.a1-u11-o2.dialog-01.mia": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o2-dialog-01-mia.mp3", char: "mia", scene: "s01", transcript: "Wann fährt unser Zug ab? Wann kommt er an?" },
  "a1-ch11.s01.a1-u11-o2.pemain-baku-01.player-01": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o2-pemain-baku-01-player-01.mp3", char: "player-01", scene: "s01", transcript: "Er fährt um neun Uhr zehn ab. Er kommt um zehn Uhr fünfundzwanzig an." },
  "a1-ch11.s01.a1-u11-o2.pemain-baku-01.player-02": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o2-pemain-baku-01-player-02.mp3", char: "player-02", scene: "s01", transcript: "Er fährt um neun Uhr zehn ab. Er kommt um zehn Uhr fünfundzwanzig an." },
  "a1-ch11.s01.a1-u11-o2.pemain-baku-01.player-03": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o2-pemain-baku-01-player-03.mp3", char: "player-03", scene: "s01", transcript: "Er fährt um neun Uhr zehn ab. Er kommt um zehn Uhr fünfundzwanzig an." },
  "a1-ch11.s01.a1-u11-o2.pemain-baku-01.player-04": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o2-pemain-baku-01-player-04.mp3", char: "player-04", scene: "s01", transcript: "Er fährt um neun Uhr zehn ab. Er kommt um zehn Uhr fünfundzwanzig an." },
  "a1-ch11.s01.a1-u11-o3.tutor-id-01.tutor": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o3-tutor-id-01-tutor.mp3", char: "tutor", scene: "s01", transcript: "mitnehmen terpisah menjadi nehme … mit. Kenali der Koffer, der Rucksack, der Reisepass." },
  "a1-ch11.s01.a1-u11-o3.dialog-01.mia": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o3-dialog-01-mia.mp3", char: "mia", scene: "s01", transcript: "Was nimmst du auf die Reise mit?" },
  "a1-ch11.s01.a1-u11-o3.pemain-baku-01.player-01": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o3-pemain-baku-01-player-01.mp3", char: "player-01", scene: "s01", transcript: "Ich nehme den Rucksack und den Reisepass mit." },
  "a1-ch11.s01.a1-u11-o3.pemain-baku-01.player-02": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o3-pemain-baku-01-player-02.mp3", char: "player-02", scene: "s01", transcript: "Ich nehme den Rucksack und den Reisepass mit." },
  "a1-ch11.s01.a1-u11-o3.pemain-baku-01.player-03": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o3-pemain-baku-01-player-03.mp3", char: "player-03", scene: "s01", transcript: "Ich nehme den Rucksack und den Reisepass mit." },
  "a1-ch11.s01.a1-u11-o3.pemain-baku-01.player-04": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o3-pemain-baku-01-player-04.mp3", char: "player-04", scene: "s01", transcript: "Ich nehme den Rucksack und den Reisepass mit." },
  "a1-ch11.s01.a1-u11-o3.bantuan-01.tutor": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-a1-u11-o3-bantuan-01-tutor.mp3", char: "tutor", scene: "s01", transcript: "Wir nehmen den Koffer mit." },
  "a1-ch11.s02.a1-u11-o4.tutor-id-01.tutor": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-tutor-id-01-tutor.mp3", char: "tutor", scene: "s02", transcript: "Auf welchem Gleis meminta peron/jalur. Verspätung berarti terlambat; Anschluss adalah sambungan berikutnya." },
  "a1-ch11.s02.a1-u11-o4.dialog-01.petugas-stasiun": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-dialog-01-petugas-stasiun.mp3", char: "petugas-stasiun", scene: "s02", transcript: "Der Zug hat zehn Minuten Verspätung. Er fährt heute von Gleis vier ab." },
  "a1-ch11.s02.a1-u11-o4.pemain-baku-01.player-01": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-pemain-baku-01-player-01.mp3", char: "player-01", scene: "s02", transcript: "Auf welchem Gleis fährt der Zug ab?" },
  "a1-ch11.s02.a1-u11-o4.pemain-baku-01.player-02": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-pemain-baku-01-player-02.mp3", char: "player-02", scene: "s02", transcript: "Auf welchem Gleis fährt der Zug ab?" },
  "a1-ch11.s02.a1-u11-o4.pemain-baku-01.player-03": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-pemain-baku-01-player-03.mp3", char: "player-03", scene: "s02", transcript: "Auf welchem Gleis fährt der Zug ab?" },
  "a1-ch11.s02.a1-u11-o4.pemain-baku-01.player-04": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-pemain-baku-01-player-04.mp3", char: "player-04", scene: "s02", transcript: "Auf welchem Gleis fährt der Zug ab?" },
  "a1-ch11.s02.a1-u11-o4.pemain-baku-02.player-01": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-pemain-baku-02-player-01.mp3", char: "player-01", scene: "s02", transcript: "Erreiche ich meinen Anschluss?" },
  "a1-ch11.s02.a1-u11-o4.pemain-baku-02.player-02": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-pemain-baku-02-player-02.mp3", char: "player-02", scene: "s02", transcript: "Erreiche ich meinen Anschluss?" },
  "a1-ch11.s02.a1-u11-o4.pemain-baku-02.player-03": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-pemain-baku-02-player-03.mp3", char: "player-03", scene: "s02", transcript: "Erreiche ich meinen Anschluss?" },
  "a1-ch11.s02.a1-u11-o4.pemain-baku-02.player-04": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-pemain-baku-02-player-04.mp3", char: "player-04", scene: "s02", transcript: "Erreiche ich meinen Anschluss?" },
  "a1-ch11.s02.a1-u11-o4.transisi-01.petugas-stasiun": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-transisi-01-petugas-stasiun.mp3", char: "petugas-stasiun", scene: "s02", transcript: "Achtung, der Zug fährt heute von Gleis vier ab." },
  "a1-ch11.s03.a1-u11-o5.tutor-id-01.tutor": { src: "../assets/voices/story/a1-ch11/speech/s03/a1-ch11-s03-a1-u11-o5-tutor-id-01-tutor.mp3", char: "tutor", scene: "s03", transcript: "Pesan tempat duduk dengan reservieren. Di loket minta informasi dan sambungan, di mesin pilih tiket." },
  "a1-ch11.s03.a1-u11-o5.dialog-01.petugas-stasiun": { src: "../assets/voices/story/a1-ch11/speech/s03/a1-ch11-s03-a1-u11-o5-dialog-01-petugas-stasiun.mp3", char: "petugas-stasiun", scene: "s03", transcript: "Sie möchten nach Leipzig. Brauchen Sie auch einen Sitzplatz?" },
  "a1-ch11.s03.a1-u11-o5.pemain-baku-01.player-01": { src: "../assets/voices/story/a1-ch11/speech/s03/a1-ch11-s03-a1-u11-o5-pemain-baku-01-player-01.mp3", char: "player-01", scene: "s03", transcript: "Ja, ich möchte einen Sitzplatz reservieren. Können Sie mir eine Auskunft geben? Welche Verbindung gibt es?" },
  "a1-ch11.s03.a1-u11-o5.pemain-baku-01.player-02": { src: "../assets/voices/story/a1-ch11/speech/s03/a1-ch11-s03-a1-u11-o5-pemain-baku-01-player-02.mp3", char: "player-02", scene: "s03", transcript: "Ja, ich möchte einen Sitzplatz reservieren. Können Sie mir eine Auskunft geben? Welche Verbindung gibt es?" },
  "a1-ch11.s03.a1-u11-o5.pemain-baku-01.player-03": { src: "../assets/voices/story/a1-ch11/speech/s03/a1-ch11-s03-a1-u11-o5-pemain-baku-01-player-03.mp3", char: "player-03", scene: "s03", transcript: "Ja, ich möchte einen Sitzplatz reservieren. Können Sie mir eine Auskunft geben? Welche Verbindung gibt es?" },
  "a1-ch11.s03.a1-u11-o5.pemain-baku-01.player-04": { src: "../assets/voices/story/a1-ch11/speech/s03/a1-ch11-s03-a1-u11-o5-pemain-baku-01-player-04.mp3", char: "player-04", scene: "s03", transcript: "Ja, ich möchte einen Sitzplatz reservieren. Können Sie mir eine Auskunft geben? Welche Verbindung gibt es?" },
  "a1-ch11.s03.a1-u11-o5.konfirmasi-01.petugas-stasiun": { src: "../assets/voices/story/a1-ch11/speech/s03/a1-ch11-s03-a1-u11-o5-konfirmasi-01-petugas-stasiun.mp3", char: "petugas-stasiun", scene: "s03", transcript: "Also, ein Sitzplatz nach Leipzig. Wann kommen wir an?" },
  "a1-ch11.s03.a1-u11-o5.transisi-01.mia": { src: "../assets/voices/story/a1-ch11/speech/s03/a1-ch11-s03-a1-u11-o5-transisi-01-mia.mp3", char: "mia", scene: "s03", transcript: "Schreib Eva bitte, wann wir wieder zu Hause sind." },
  "a1-ch11.s02.a1-u11-o4.klarifikasi-01.petugas-stasiun": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-klarifikasi-01-petugas-stasiun.mp3", char: "petugas-stasiun", scene: "s02", transcript: "Das war das alte Gleis. Hören Sie bitte noch einmal zu." },
  "a1-ch11.s01.umum.tutor-slide-01.tutor": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-umum-tutor-slide-01-tutor.mp3", char: "tutor", scene: "s01", transcript: "Wir fahren nach Hamburg." },
  "a1-ch11.s01.umum.tutor-slide-02.tutor": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-umum-tutor-slide-02-tutor.mp3", char: "tutor", scene: "s01", transcript: "Die Abfahrt ist um Viertel nach acht." },
  "a1-ch11.s01.umum.tutor-slide-03.tutor": { src: "../assets/voices/story/a1-ch11/speech/s01/a1-ch11-s01-umum-tutor-slide-03-tutor.mp3", char: "tutor", scene: "s01", transcript: "Hast du deinen Reisepass dabei?" },
  "a1-ch11.s02.umum.tutor-slide-01.tutor": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-umum-tutor-slide-01-tutor.mp3", char: "tutor", scene: "s02", transcript: "Der Zug nach Köln fährt von Gleis drei ab." },
  "a1-ch11.s02.umum.tutor-slide-02.tutor": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-umum-tutor-slide-02-tutor.mp3", char: "tutor", scene: "s02", transcript: "Wegen einer Verspätung verpasse ich den Anschluss." },
  "a1-ch11.s02.umum.tutor-slide-03.tutor": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-umum-tutor-slide-03-tutor.mp3", char: "tutor", scene: "s02", transcript: "Ich möchte einen Sitzplatz am Fenster reservieren." },
  "a1-ch11.s03.umum.tutor-slide-01.tutor": { src: "../assets/voices/story/a1-ch11/speech/s03/a1-ch11-s03-umum-tutor-slide-01-tutor.mp3", char: "tutor", scene: "s03", transcript: "Die Auskunft ist neben dem Eingang." },
  "a1-ch11.s03.umum.tutor-slide-02.tutor": { src: "../assets/voices/story/a1-ch11/speech/s03/a1-ch11-s03-umum-tutor-slide-02-tutor.mp3", char: "tutor", scene: "s03", transcript: "Wir brauchen eine Verbindung nach Dresden." },
  "a1-ch11.s03.umum.tutor-slide-03.tutor": { src: "../assets/voices/story/a1-ch11/speech/s03/a1-ch11-s03-umum-tutor-slide-03-tutor.mp3", char: "tutor", scene: "s03", transcript: "Im Reiseplan steht die Ankunft um vier Uhr." },
  "a1-ch11.s02.a1-u11-o4.pengumuman-variasi-01.petugas-stasiun": { src: "../assets/voices/story/a1-ch11/speech/s02/a1-ch11-s02-a1-u11-o4-pengumuman-variasi-01-petugas-stasiun.mp3", char: "petugas-stasiun", scene: "s02", transcript: "Achtung, der Zug fährt heute von Gleis fünf ab." },
  "a1-ch12.s01.umum.dialog-01.mia": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-umum-dialog-01-mia.mp3", char: "mia", scene: "s01", transcript: "Erinnerst du dich an deinen ersten Brief?" },
  "a1-ch12.s01.a1-u12-o1.tutor-id-01.tutor": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o1-tutor-id-01-tutor.mp3", char: "tutor", scene: "s01", transcript: "einladen dan mitkommen dapat dipisah. Untuk waktu bersama tanyakan «Um wie viel Uhr treffen wir uns?»" },
  "a1-ch12.s01.a1-u12-o1.tutor-de-01.tutor": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o1-tutor-de-01-tutor.mp3", char: "tutor", scene: "s01", transcript: "Um wie viel Uhr treffen wir uns?" },
  "a1-ch12.s01.a1-u12-o1.dialog-01.mia": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o1-dialog-01-mia.mp3", char: "mia", scene: "s01", transcript: "Wir öffnen morgen den Raum. Wen lädst du ein?" },
  "a1-ch12.s01.a1-u12-o1.pemain-baku-01.player-01": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o1-pemain-baku-01-player-01.mp3", char: "player-01", scene: "s01", transcript: "Ich lade dich ein. Kommst du mit?" },
  "a1-ch12.s01.a1-u12-o1.pemain-baku-01.player-02": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o1-pemain-baku-01-player-02.mp3", char: "player-02", scene: "s01", transcript: "Ich lade dich ein. Kommst du mit?" },
  "a1-ch12.s01.a1-u12-o1.pemain-baku-01.player-03": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o1-pemain-baku-01-player-03.mp3", char: "player-03", scene: "s01", transcript: "Ich lade dich ein. Kommst du mit?" },
  "a1-ch12.s01.a1-u12-o1.pemain-baku-01.player-04": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o1-pemain-baku-01-player-04.mp3", char: "player-04", scene: "s01", transcript: "Ich lade dich ein. Kommst du mit?" },
  "a1-ch12.s01.a1-u12-o1.pemain-baku-02.player-01": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o1-pemain-baku-02-player-01.mp3", char: "player-01", scene: "s01", transcript: "Wir treffen uns um vier Uhr." },
  "a1-ch12.s01.a1-u12-o1.pemain-baku-02.player-02": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o1-pemain-baku-02-player-02.mp3", char: "player-02", scene: "s01", transcript: "Wir treffen uns um vier Uhr." },
  "a1-ch12.s01.a1-u12-o1.pemain-baku-02.player-03": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o1-pemain-baku-02-player-03.mp3", char: "player-03", scene: "s01", transcript: "Wir treffen uns um vier Uhr." },
  "a1-ch12.s01.a1-u12-o1.pemain-baku-02.player-04": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o1-pemain-baku-02-player-04.mp3", char: "player-04", scene: "s01", transcript: "Wir treffen uns um vier Uhr." },
  "a1-ch12.s01.a1-u12-o2.tutor-id-01.tutor": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o2-tutor-id-01-tutor.mp3", char: "tutor", scene: "s01", transcript: "Jika bentrok, tolak dengan sopan dan usulkan satu waktu konkret. Jika cocok, respons singkat sudah wajar." },
  "a1-ch12.s01.a1-u12-o2.dialog-01.eva": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o2-dialog-01-eva.mp3", char: "eva", scene: "s01", transcript: "Hast du am Samstag Zeit?" },
  "a1-ch12.s01.a1-u12-o2.pemain-baku-01.player-01": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o2-pemain-baku-01-player-01.mp3", char: "player-01", scene: "s01", transcript: "Leider kann ich nicht. Können wir uns am Sonntag treffen?" },
  "a1-ch12.s01.a1-u12-o2.pemain-baku-01.player-02": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o2-pemain-baku-01-player-02.mp3", char: "player-02", scene: "s01", transcript: "Leider kann ich nicht. Können wir uns am Sonntag treffen?" },
  "a1-ch12.s01.a1-u12-o2.pemain-baku-01.player-03": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o2-pemain-baku-01-player-03.mp3", char: "player-03", scene: "s01", transcript: "Leider kann ich nicht. Können wir uns am Sonntag treffen?" },
  "a1-ch12.s01.a1-u12-o2.pemain-baku-01.player-04": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o2-pemain-baku-01-player-04.mp3", char: "player-04", scene: "s01", transcript: "Leider kann ich nicht. Können wir uns am Sonntag treffen?" },
  "a1-ch12.s01.a1-u12-o2.pemain-baku-02.player-01": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o2-pemain-baku-02-player-01.mp3", char: "player-01", scene: "s01", transcript: "Gern, ich komme." },
  "a1-ch12.s01.a1-u12-o2.pemain-baku-02.player-02": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o2-pemain-baku-02-player-02.mp3", char: "player-02", scene: "s01", transcript: "Gern, ich komme." },
  "a1-ch12.s01.a1-u12-o2.pemain-baku-02.player-03": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o2-pemain-baku-02-player-03.mp3", char: "player-03", scene: "s01", transcript: "Gern, ich komme." },
  "a1-ch12.s01.a1-u12-o2.pemain-baku-02.player-04": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-a1-u12-o2-pemain-baku-02-player-04.mp3", char: "player-04", scene: "s01", transcript: "Gern, ich komme." },
  "a1-ch12.s02.a1-u12-o3.tutor-id-01.tutor": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o3-tutor-id-01-tutor.mp3", char: "tutor", scene: "s02", transcript: "Saat menelepon, kenalkan diri dengan hier ist …; minta bicara memakai mit dan tangguhkan dengan Einen Moment bitte." },
  "a1-ch12.s02.a1-u12-o3.dialog-01.eva": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o3-dialog-01-eva.mp3", char: "eva", scene: "s02", transcript: "Guten Tag, hier ist Eva. Kann ich bitte mit Mia sprechen?" },
  "a1-ch12.s02.a1-u12-o3.bantuan-01.tutor": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o3-bantuan-01-tutor.mp3", char: "tutor", scene: "s02", transcript: "mit Herrn Bauer" },
  "a1-ch12.s02.a1-u12-o4.tutor-id-01.tutor": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-tutor-id-01-tutor.mp3", char: "tutor", scene: "s02", transcript: "anrufen terpisah. Jika orangnya tidak ada, tawarkan atau minta meninggalkan pesan." },
  "a1-ch12.s02.a1-u12-o4.dialog-01.eva": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-dialog-01-eva.mp3", char: "eva", scene: "s02", transcript: "Mia ist nicht da? Kann ich eine Nachricht hinterlassen?" },
  "a1-ch12.s02.a1-u12-o4.pemain-baku-01.player-01": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-pemain-baku-01-player-01.mp3", char: "player-01", scene: "s02", transcript: "Ja, gern." },
  "a1-ch12.s02.a1-u12-o4.pemain-baku-01.player-02": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-pemain-baku-01-player-02.mp3", char: "player-02", scene: "s02", transcript: "Ja, gern." },
  "a1-ch12.s02.a1-u12-o4.pemain-baku-01.player-03": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-pemain-baku-01-player-03.mp3", char: "player-03", scene: "s02", transcript: "Ja, gern." },
  "a1-ch12.s02.a1-u12-o4.pemain-baku-01.player-04": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-pemain-baku-01-player-04.mp3", char: "player-04", scene: "s02", transcript: "Ja, gern." },
  "a1-ch12.s02.a1-u12-o4.pesan-suara-01.eva": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-pesan-suara-01-eva.mp3", char: "eva", scene: "s02", transcript: "Bitte ruf mich am Sonntag an." },
  "a1-ch12.s02.a1-u12-o4.pemain-baku-02.player-01": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-pemain-baku-02-player-01.mp3", char: "player-01", scene: "s02", transcript: "Ich rufe dich am Sonntag an." },
  "a1-ch12.s02.a1-u12-o4.pemain-baku-02.player-02": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-pemain-baku-02-player-02.mp3", char: "player-02", scene: "s02", transcript: "Ich rufe dich am Sonntag an." },
  "a1-ch12.s02.a1-u12-o4.pemain-baku-02.player-03": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-pemain-baku-02-player-03.mp3", char: "player-03", scene: "s02", transcript: "Ich rufe dich am Sonntag an." },
  "a1-ch12.s02.a1-u12-o4.pemain-baku-02.player-04": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-pemain-baku-02-player-04.mp3", char: "player-04", scene: "s02", transcript: "Ich rufe dich am Sonntag an." },
  "a1-ch12.s02.a1-u12-o4.transisi-01.eva": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o4-transisi-01-eva.mp3", char: "eva", scene: "s02", transcript: "Danke. Dann höre ich am Sonntag von euch." },
  "a1-ch12.s03.a1-u12-o5.tutor-id-01.tutor": { src: "../assets/voices/story/a1-ch12/speech/s03/a1-ch12-s03-a1-u12-o5-tutor-id-01-tutor.mp3", char: "tutor", scene: "s03", transcript: "Pesan singkat perlu penerima, waktu, tempat dan penutup. Gunakan Briefumschlag untuk amplop, Briefmarke untuk prangko." },
  "a1-ch12.s03.a1-u12-o5.dialog-01.mia": { src: "../assets/voices/story/a1-ch12/speech/s03/a1-ch12-s03-a1-u12-o5-dialog-01-mia.mp3", char: "mia", scene: "s03", transcript: "Unser Gast kennt den neuen Termin noch nicht. Schreibst du ihm?" },
  "a1-ch12.s03.a1-u12-o5.klarifikasi-01.eva": { src: "../assets/voices/story/a1-ch12/speech/s03/a1-ch12-s03-a1-u12-o5-klarifikasi-01-eva.mp3", char: "eva", scene: "s03", transcript: "In meiner Nachricht steht ein anderer Tag. Wann treffen wir uns denn?" },
  "a1-ch12.penutup.umum.penutup-01.pendatang-baru": { src: "../assets/voices/story/a1-ch12/speech/penutup/a1-ch12-penutup-umum-penutup-01-pendatang-baru.mp3", char: "pendatang-baru", scene: "penutup", transcript: "Hallo! Ich bin neu hier. Wie heißt du?" },
  "a1-ch12.s01.umum.tutor-slide-01.tutor": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-umum-tutor-slide-01-tutor.mp3", char: "tutor", scene: "s01", transcript: "Ich möchte dich zum Essen einladen." },
  "a1-ch12.s01.umum.tutor-slide-02.tutor": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-umum-tutor-slide-02-tutor.mp3", char: "tutor", scene: "s01", transcript: "Treffen wir uns am Freitag um sechs Uhr?" },
  "a1-ch12.s01.umum.tutor-slide-03.tutor": { src: "../assets/voices/story/a1-ch12/speech/s01/a1-ch12-s01-umum-tutor-slide-03-tutor.mp3", char: "tutor", scene: "s01", transcript: "Danke für die Einladung. Ich komme gern." },
  "a1-ch12.s02.umum.tutor-slide-01.tutor": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-umum-tutor-slide-01-tutor.mp3", char: "tutor", scene: "s02", transcript: "Guten Tag, hier ist Rani." },
  "a1-ch12.s02.umum.tutor-slide-02.tutor": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-umum-tutor-slide-02-tutor.mp3", char: "tutor", scene: "s02", transcript: "Ruf mich bitte nach der Arbeit an." },
  "a1-ch12.s02.umum.tutor-slide-03.tutor": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-umum-tutor-slide-03-tutor.mp3", char: "tutor", scene: "s02", transcript: "Ich hinterlasse eine kurze Sprachnachricht." },
  "a1-ch12.s03.umum.tutor-slide-01.tutor": { src: "../assets/voices/story/a1-ch12/speech/s03/a1-ch12-s03-umum-tutor-slide-01-tutor.mp3", char: "tutor", scene: "s03", transcript: "Hallo, ich komme heute zehn Minuten später." },
  "a1-ch12.s03.umum.tutor-slide-02.tutor": { src: "../assets/voices/story/a1-ch12/speech/s03/a1-ch12-s03-umum-tutor-slide-02-tutor.mp3", char: "tutor", scene: "s03", transcript: "Ich schicke dir eine Postkarte aus Berlin." },
  "a1-ch12.s03.umum.tutor-slide-03.tutor": { src: "../assets/voices/story/a1-ch12/speech/s03/a1-ch12-s03-umum-tutor-slide-03-tutor.mp3", char: "tutor", scene: "s03", transcript: "Danke für die Einladung. Meine Antwort kommt morgen." },
  "a1-ch12.s02.a1-u12-o3.pemain-baku-01-tunggu.player-01": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o3-pemain-baku-01-tunggu-player-01.mp3", char: "player-01", scene: "s02", transcript: "Einen Moment bitte." },
  "a1-ch12.s02.a1-u12-o3.pemain-baku-01-tunggu.player-02": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o3-pemain-baku-01-tunggu-player-02.mp3", char: "player-02", scene: "s02", transcript: "Einen Moment bitte." },
  "a1-ch12.s02.a1-u12-o3.pemain-baku-01-tunggu.player-03": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o3-pemain-baku-01-tunggu-player-03.mp3", char: "player-03", scene: "s02", transcript: "Einen Moment bitte." },
  "a1-ch12.s02.a1-u12-o3.pemain-baku-01-tunggu.player-04": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o3-pemain-baku-01-tunggu-player-04.mp3", char: "player-04", scene: "s02", transcript: "Einen Moment bitte." },
  "a1-ch12.s02.a1-u12-o3.pemain-baku-01-tukar-peran.player-01": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o3-pemain-baku-01-tukar-peran-player-01.mp3", char: "player-01", scene: "s02", transcript: "Kann ich bitte mit Mia sprechen?" },
  "a1-ch12.s02.a1-u12-o3.pemain-baku-01-tukar-peran.player-02": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o3-pemain-baku-01-tukar-peran-player-02.mp3", char: "player-02", scene: "s02", transcript: "Kann ich bitte mit Mia sprechen?" },
  "a1-ch12.s02.a1-u12-o3.pemain-baku-01-tukar-peran.player-03": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o3-pemain-baku-01-tukar-peran-player-03.mp3", char: "player-03", scene: "s02", transcript: "Kann ich bitte mit Mia sprechen?" },
  "a1-ch12.s02.a1-u12-o3.pemain-baku-01-tukar-peran.player-04": { src: "../assets/voices/story/a1-ch12/speech/s02/a1-ch12-s02-a1-u12-o3-pemain-baku-01-tukar-peran-player-04.mp3", char: "player-04", scene: "s02", transcript: "Kann ich bitte mit Mia sprechen?" },
};

export const STORY_MEDIA_COUNTS = {
  characters: 11,
  frames: 55,
  bg: 4,
  sfx: 3,
  prologClips: 51,
  storyClips: 113,
};
