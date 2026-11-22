import { NextResponse } from "next/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (s: string) => UUID.test(s);

export const bad = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const str = (v: unknown, max: number): string | null => (typeof v === "string" && v.trim().length > 0 && v.length <= max ? v.trim() : null);
