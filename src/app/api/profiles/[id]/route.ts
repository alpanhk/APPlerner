import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { attempts, profiles, progress } from "@/db/schema";
import { bad, isUuid } from "@/lib/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return bad("Profil tidak ditemukan.", 404);
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
  if (!profile) return bad("Profil tidak ditemukan.", 404);
  const [rows, tries] = await Promise.all([
    db.select().from(progress).where(eq(progress.profileId, id)),
    db.select().from(attempts).where(eq(attempts.profileId, id)).orderBy(asc(attempts.id)),
  ]);
  return NextResponse.json({
    profile,
    progress: rows.map((r) => ({ chapterId: r.chapterId, status: r.status, state: r.state, notes: r.notes })),
    attempts: tries.map((a) => ({ objective: a.objective, chapterId: a.chapterId, who: a.who, text: a.text, hintsUsed: a.hintsUsed, full: a.full, guided: a.guided })),
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return bad("Profil tidak ditemukan.", 404);
  await db.delete(profiles).where(eq(profiles.id, id));
  return NextResponse.json({ ok: true });
}
