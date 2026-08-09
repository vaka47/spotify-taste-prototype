import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureSchema();
  const rows = await db()`
    select share_enabled, share_delay_hours, selected_sessions_only, hidden_track_ids, hidden_artist_ids
    from taste_users where id = ${viewer.id}
  `;
  return NextResponse.json({ privacy: rows[0] });
}

export async function PATCH(request: NextRequest) {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as {
    shareEnabled?: boolean;
    shareDelayHours?: number;
    selectedSessionsOnly?: boolean;
    hiddenTrackIds?: string[];
    hiddenArtistIds?: string[];
  };
  const delay = payload.shareDelayHours === undefined ? null : Math.max(0, Math.min(168, Math.round(payload.shareDelayHours)));
  await ensureSchema();
  await db()`
    update taste_users set
      share_enabled = coalesce(${payload.shareEnabled ?? null}, share_enabled),
      share_delay_hours = coalesce(${delay}, share_delay_hours),
      selected_sessions_only = coalesce(${payload.selectedSessionsOnly ?? null}, selected_sessions_only),
      hidden_track_ids = coalesce(${payload.hiddenTrackIds ? db().json(payload.hiddenTrackIds.slice(0, 100)) : null}, hidden_track_ids),
      hidden_artist_ids = coalesce(${payload.hiddenArtistIds ? db().json(payload.hiddenArtistIds.slice(0, 100)) : null}, hidden_artist_ids),
      updated_at = now()
    where id = ${viewer.id}
  `;
  return GET();
}
