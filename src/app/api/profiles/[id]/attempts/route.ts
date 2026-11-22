import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { attempts, profiles } from "@/db/schema";
import { bad, isUuid, readJson, str } from "@/lib/server";
import { CHAPTER_BY_ID } from "@/story/chapters";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return bad("Profil tidak ditemukan.", 404);
  const body = await readJson(req);
  const chapterId = str(body?.chapterId, 16);
  const objective = str(body?.objective, 32);
  const who = str(body?.who, 32);
  const text = str(body?.text, 200);
  const hintsUsed = typeof body?.hintsUsed === "number" && Number.isInteger(body.hintsUsed) ? Math.max(0, Math.min(99, body.hintsUsed)) : 0;
  if (!chapterId || !CHAPTER_BY_ID[chapterId] || !objective || !who || !text) return bad("Bukti jawaban tidak lengkap.");

  const [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, id));
  if (!profile) return bad("Profil tidak ditemukan.", 404);

  await db.insert(attempts).values({ profileId: id, chapterId, objective, who, text, hintsUsed, full: body?.full === true, guided: body?.guided === true });
  return NextResponse.json({ ok: true }, { status: 201 });
}
