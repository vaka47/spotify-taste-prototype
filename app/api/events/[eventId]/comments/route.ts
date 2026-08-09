import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { eventId } = await context.params;
  const payload = await request.json().catch(() => ({})) as { body?: string };
  const body = payload.body?.trim().slice(0, 500);
  if (!body || body.length < 2) return NextResponse.json({ error: "invalid_comment" }, { status: 400 });
  await ensureSchema();
  const events = await db()`select id, user_id, title from taste_events where id = ${eventId} and is_public = true limit 1`;
  const event = events[0];
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const id = randomUUID();
  await db()`insert into taste_comments (id, event_id, author_id, body) values (${id}, ${eventId}, ${viewer.id}, ${body})`;
  if (event.user_id !== viewer.id) {
    await db()`
      insert into taste_notifications (id, user_id, actor_id, kind, event_id, body)
      values (${randomUUID()}, ${event.user_id}, ${viewer.id}, 'comment', ${eventId}, ${`${viewer.displayName}: ${body}`})
    `;
  }
  return NextResponse.json({
    comment: { id, eventId, body, authorHandle: viewer.handle, authorName: viewer.displayName, authorAvatar: viewer.avatarUrl, createdAt: new Date().toISOString() },
  });
}
