import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { eventId } = await context.params;
  const payload = await request.json().catch(() => ({})) as { authorNote?: string | null; isPublic?: boolean };
  const note = payload.authorNote === null ? null : payload.authorNote?.trim().slice(0, 500);
  await ensureSchema();
  const events = await db()`select id, title, author_note, is_public from taste_events where id = ${eventId} and user_id = ${viewer.id} limit 1`;
  const event = events[0];
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const nextNote = payload.authorNote === undefined ? event.author_note : note || null;
  const nextPublic = payload.isPublic === undefined ? event.is_public : payload.isPublic;
  await db()`update taste_events set author_note = ${nextNote}, is_public = ${nextPublic} where id = ${eventId}`;
  if (nextNote && nextNote !== event.author_note) {
    await db()`
      insert into taste_notifications (id, user_id, actor_id, kind, event_id, body)
      select ${randomUUID()} || '-' || follower_id, follower_id, ${viewer.id}, 'author_note', ${eventId}, ${`${viewer.displayName} added a note to ${event.title}: ${nextNote}`}
      from taste_follows where followed_id = ${viewer.id}
    `;
  }
  return NextResponse.json({ event: { id: eventId, authorNote: nextNote, isPublic: nextPublic } });
}
