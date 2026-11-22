import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, progress } from "@/db/schema";
import { bad, isUuid, readJson, str } from "@/lib/server";
import { CHAPTER_BY_ID } from "@/story/chapters";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return bad("Profil tidak ditemukan.", 404);
  const body = await readJson(req);
  const chapterId = str(body?.chapterId, 16);
  const chapter = chapterId ? CHAPTER_BY_ID[chapterId] : undefined;
  if (!chapterId || !chapter) return bad("Bab tidak dikenal.");

  const state = body?.state && typeof body.state === "object" ? (body.state as Record<string, unknown>) : null;
  if (state && (typeof state.nodeId !== "string" || !chapter.nodes[state.nodeId])) return bad("Keadaan cerita tidak sah.");
  if (JSON.stringify(state ?? {}).length > 200_000) return bad("Keadaan cerita terlalu besar.");
  const notes = Array.isArray(body?.notes) ? [...new Set(body.notes.filter((x): x is string => typeof x === "string" && !!chapter.nodes[x]))] : [];
  const done = body?.done === true;

  const [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, id));
  if (!profile) return bad("Profil tidak ditemukan.", 404);

  const [existing] = await db
    .select()
    .from(progress)
    .where(and(eq(progress.profileId, id), eq(progress.chapterId, chapterId)));
  // Bab yang pernah tamat tetap tamat, walau sedang dimainkan ulang.
  const status = done || existing?.status === "selesai" ? "selesai" : "aktif";
  const merged = [...new Set([...(existing?.notes ?? []), ...notes])];
  const values = {
    status,
    state: done ? null : state,
    notes: merged,
    completedAt: done ? new Date() : (existing?.completedAt ?? null),
    updatedAt: new Date(),
  };
  await db
    .insert(progress)
    .values({ profileId: id, chapterId, ...values })
    .onConflictDoUpdate({ target: [progress.profileId, progress.chapterId], set: values });
  return NextResponse.json({ ok: true, status, notes: merged });
}
