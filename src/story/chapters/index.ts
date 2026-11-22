import type { Chapter } from "../types";
import { prolog } from "./prolog";
import { bab01 } from "./bab01";
import { bab02 } from "./bab02";
import { bab03 } from "./bab03";
import { bab04 } from "./bab04";
import { bab05 } from "./bab05";
import { bab06 } from "./bab06";
import { bab07 } from "./bab07";
import { bab08 } from "./bab08";
import { bab09 } from "./bab09";
import { bab10 } from "./bab10";
import { bab11 } from "./bab11";
import { bab12 } from "./bab12";

/** Urutan perjalanan A1. Menambah bab = menambah satu berkas dan satu baris di sini. */
export const CHAPTERS: Chapter[] = [prolog, bab01, bab02, bab03, bab04, bab05, bab06, bab07, bab08, bab09, bab10, bab11, bab12];

export const CHAPTER_BY_ID: Record<string, Chapter> = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));

export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);

/** Kalimat contoh (buku catatan) dicari lewat id node. */
export function noteOf(nodeId: string): { chapter: Chapter; text: string; tr: string } | null {
  const chapter = CHAPTER_BY_ID[nodeId.split(".")[0]];
  const node = chapter?.nodes[nodeId];
  if (!chapter || !node || node.kind !== "line") return null;
  return { chapter, text: node.text, tr: node.tr ?? "" };
}
