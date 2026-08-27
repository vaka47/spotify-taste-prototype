import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { eventId } = await context.params;
  await ensureSchema();
  const events = await db()`select id, user_id, title from taste_events where id = ${eventId} and is_public = true limit 1`;
  const event = events[0];
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (event.user_id === viewer.id) return NextResponse.json({ error: "own_event" }, { status: 409 });

  const removed = await db()`
    delete from taste_reactions
    where event_id = ${eventId} and user_id = ${viewer.id} and kind = 'heart'
    returning event_id
  `;
  let reacted = false;
  if (!removed.length) {
    const inserted = await db()`
      insert into taste_reactions (event_id, user_id, kind)
      values (${eventId}, ${viewer.id}, 'heart')
      on conflict do nothing
      returning event_id
    `;
    reacted = inserted.length > 0;
    if (reacted) {
      await db()`
        insert into taste_notifications (id, user_id, actor_id, kind, event_id, body)
        values (${randomUUID()}, ${event.user_id}, ${viewer.id}, 'reaction', ${eventId}, ${`${viewer.displayName} liked the track ${event.title} from your Taste`})
      `;
    }
  }

  const counts = await db()`select count(*)::int as count from taste_reactions where event_id = ${eventId} and kind = 'heart'`;
  return NextResponse.json({ reacted, count: Number(counts[0]?.count || 0) });
}
