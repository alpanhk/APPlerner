import { NextResponse } from "next/server";
import { auditAll } from "@/story/audit";
import { CHAPTERS } from "@/story/chapters";

export function GET() {
  const chapters = auditAll(CHAPTERS);
  return NextResponse.json({ ok: chapters.every((c) => c.ok), chapters });
}
