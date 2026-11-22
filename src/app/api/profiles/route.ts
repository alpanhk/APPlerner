import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { bad, readJson, str } from "@/lib/server";
import { AVATARS } from "@/story/cast";
import { norm } from "@/story/match";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  const name = str(body?.name, 20)?.replace(/\s+/g, " ");
  const avatar = str(body?.avatar, 16);
  // Nama dipakai di dalam kalimat Jerman dan dicocokkan dengan jawaban, jadi harus huruf Latin.
  if (!name || !/^[\p{L}][\p{L} '\-]*$/u.test(name) || norm(name).replace(/ /g, "").length < 2) {
    return bad("Nama panggilan berisi 2–20 huruf Latin.");
  }
  if (!avatar || !(AVATARS as readonly string[]).includes(avatar)) return bad("Pilih salah satu tokoh.");
  const [profile] = await db.insert(profiles).values({ name, avatar }).returning();
  return NextResponse.json({ profile }, { status: 201 });
}
