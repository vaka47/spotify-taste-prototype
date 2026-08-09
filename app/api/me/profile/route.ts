import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as { handle?: string; bio?: string; role?: string };
  const handle = payload.handle?.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
  if (payload.handle !== undefined && (!handle || handle.length < 3)) return NextResponse.json({ error: "invalid_handle" }, { status: 400 });
  await ensureSchema();
  try {
    const rows = await db()`
      update taste_users set
        handle = coalesce(${handle || null}, handle),
        bio = coalesce(${payload.bio?.trim().slice(0, 280) ?? null}, bio),
        role = coalesce(${payload.role?.trim().slice(0, 80) ?? null}, role),
        updated_at = now()
      where id = ${viewer.id}
      returning handle, bio, role
    `;
    return NextResponse.json({ profile: rows[0] });
  } catch (caught) {
    if ((caught as { code?: string }).code === "23505") return NextResponse.json({ error: "handle_taken" }, { status: 409 });
    throw caught;
  }
}
