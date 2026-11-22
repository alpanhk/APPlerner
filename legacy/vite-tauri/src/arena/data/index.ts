// ===== Akses kurikulum & bacaan yang bertipe =====
import curriculumJson from "./curriculum.json";
import readingsJson from "./readings.json";
import coverMapJson from "./cover-map.json";
import objectivesJson from "./a1_objectives.json";

export interface Lesson {
  no: number;
  title: string;
  minutes?: number;
}
export interface Unit {
  level: "A1" | "A2" | "B1" | "B2";
  unit: number;
  title: string;
  goals: string[];
  lessons: Lesson[];
}
export interface Sentence {
  de: string;
  id: string;
}
export interface Reading {
  textId: number;
  title: string;
  level: string;
  tags: string;
  sentences: Sentence[];
}
export interface CoverEntry {
  textId: number;
  title: string;
  level: string;
  label: string;
  src: string;
  kind: string;
}
export interface ObjectiveRef {
  id: string;
  unit: number;
  title: string;
  canDo: string;
  lessonNos: number[];
}

export const UNITS: Unit[] = (curriculumJson as { units: Unit[] }).units;
export const READINGS: Reading[] = (readingsJson as { texts: Reading[] }).texts;
export const COVERS: CoverEntry[] = (coverMapJson as { covers: CoverEntry[] }).covers;
export const OBJECTIVES_A1: ObjectiveRef[] = (objectivesJson as { objectives: ObjectiveRef[] }).objectives;
