// Peta kurikulum multi-level (A1 → B2). Nomor unit global agar
// `lesson_progress(unit_no, lesson_no)` tetap unik: A1 1–99, A2 101–199,
// B1 201–299, B2 301–399. Tampilan memakai nomor dua digit terakhir.
import a1 from "../data/lessons/units_a1.json";
import a2 from "../data/lessons/units_a2.json";
import b1 from "../data/lessons/units_b1.json";
import b2 from "../data/lessons/units_b2.json";
import type { DrillCode } from "../drills/items";

export type LessonSlide = {
  title: string;
  body: string[];
  example_de?: string;
  example_id?: string;
};

export type Lesson = {
  no: number;
  title: string;
  minutes: number;
  recap: string[];
  slides: LessonSlide[];
  drill: { code: DrillCode; count: number };
  vocab: string[];
};

export type UnitCheckpoint = {
  count: number;
  pass: number;
  codes: DrillCode[];
};

export type Unit = {
  unit: number;
  title: string;
  goals: string[];
  lessons: Lesson[];
  checkpoint?: UnitCheckpoint;
};

export type LevelCode = "A1" | "A2" | "B1" | "B2";

type UnitFile = { level: string; source: string; units: Unit[] };

export type LevelMeta = { code: LevelCode; source: string; units: Unit[] };

export const LEVEL_ORDER: LevelCode[] = ["A1", "A2", "B1", "B2"];

const FILES: Record<LevelCode, UnitFile> = {
  A1: a1 as unknown as UnitFile,
  A2: a2 as unknown as UnitFile,
  B1: b1 as unknown as UnitFile,
  B2: b2 as unknown as UnitFile,
};

export const LEVELS: Record<LevelCode, LevelMeta> = {
  A1: { code: "A1", source: FILES.A1.source, units: FILES.A1.units },
  A2: { code: "A2", source: FILES.A2.source, units: FILES.A2.units },
  B1: { code: "B1", source: FILES.B1.source, units: FILES.B1.units },
  B2: { code: "B2", source: FILES.B2.source, units: FILES.B2.units },
};

// Nomor khusus untuk checkpoint unit di lesson_progress.
export const CHECKPOINT_LESSON_NO = 99;

export const UNITS_ALL: Unit[] = LEVEL_ORDER.flatMap((code) => LEVELS[code].units);

// Kompatibilitas dengan layar lama.
export const UNITS_A1: Unit[] = LEVELS.A1.units;

export function unitsOf(level: LevelCode): Unit[] {
  return LEVELS[level].units;
}

export function levelOfUnit(unitNo: number): LevelCode | undefined {
  return LEVEL_ORDER.find((code) => LEVELS[code].units.some((u) => u.unit === unitNo));
}

export function getUnit(unitNo: number): Unit | undefined {
  return UNITS_ALL.find((u) => u.unit === unitNo);
}

export function displayUnitNo(unitNo: number): number {
  return unitNo % 100;
}

export function unitHasContent(unit: Unit): boolean {
  return unit.lessons.length > 0;
}

export function totalLessons(unit: Unit): number {
  return unit.lessons.length;
}

// Progres per level untuk ringkasan dashboard/statistik.
export function levelTotals(level: LevelCode): { units: number; lessons: number } {
  const units = LEVELS[level].units.filter(unitHasContent);
  return {
    units: units.length,
    lessons: units.reduce((n, u) => n + u.lessons.length, 0),
  };
}
