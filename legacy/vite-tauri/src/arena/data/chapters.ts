// Daftar Bab Visual Novel — Bab 01–12 (lanjutan prolog).
import type { StoryNode } from "../types";
import { PROLOG_START, PROLOG_NODES, PROLOG_META } from "./story/prolog";
import { NODES as B01, META as M01, CTX as C01 } from "./story/bab-01";
import { NODES as B02, META as M02, CTX as C02 } from "./story/bab-02";
import { NODES as B11, META as M11, CTX as C11 } from "./story/bab-11";
import { NODES as B12, META as M12, CTX as C12 } from "./story/bab-12";

export interface ChapterEntry {
  id: string;          // "bab-01"
  chapterId: string;   // "a1-ch01"
  title: string;
  startId: string;     // entry node di chapter
  nodes: StoryNode[];
  exitId: string | null; // node exit chapter -> start chapter berikutnya (null = ujung katalog)
  endId: string;       // node akhir chapter
}

export const PRO_LOG_END = "e_end";

export const CHAPTER_ENTRIES: ChapterEntry[] = [
  { id: "bab-01", chapterId: "a1-ch01", title: M01.title, startId: C01.entryId, nodes: B01, exitId: C01.exitId, endId: "bab01-end" },
  { id: "bab-02", chapterId: "a1-ch02", title: M02.title, startId: C02.entryId, nodes: B02, exitId: C02.exitId, endId: "b02-end" },
  { id: "bab-11", chapterId: "a1-ch11", title: M11.title, startId: C11.entryId, nodes: B11, exitId: C11.exitId, endId: "b11-end" },
  { id: "bab-12", chapterId: "a1-ch12", title: M12.title, startId: C12.entryId, nodes: B12, exitId: C12.exitId, endId: "b12-end" },
];

// Hanya sambungan yang memang merupakan urutan produksi. Bab 01 -> 02,
// Bab 11 -> 12. Prolog selesai tetap menampilkan hasil, tidak memaksa masuk
// Bab 01; misi 11-12 dapat dipilih dari jalur latihan.
export const CHAPTER_EXITS: Record<string, string> = {
  "bab01-end": "bab02a",
  "b11-end": "c12a",
};

export const PRO_LOG_META = PROLOG_META;
export const PRO_LOG_NODES = PROLOG_NODES;
export const PRO_LOG_START = PROLOG_START;
export function chapterForNodeId(nodeId: string): ChapterEntry | null {
  return CHAPTER_ENTRIES.find((c) => c.startId === nodeId) ?? null;
}
export function chapterByChapterId(chapterId: string): ChapterEntry | null {
  return CHAPTER_ENTRIES.find((c) => c.chapterId === chapterId) ?? null;
}
