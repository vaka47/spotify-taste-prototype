import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ handle: string }> }) {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { handle } = await context.params;
  await ensureSchema();
  const targets = await db()`select id, display_name from taste_users where handle = ${handle} limit 1`;
  const target = targets[0];
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (target.id === viewer.id) return NextResponse.json({ error: "self_follow" }, { status: 400 });
  const existing = await db()`select 1 from taste_follows where follower_id = ${viewer.id} and followed_id = ${target.id}`;
  if (existing.length) {
    await db()`delete from taste_follows where follower_id = ${viewer.id} and followed_id = ${target.id}`;
    return NextResponse.json({ following: false });
  }
  await db()`insert into taste_follows (follower_id, followed_id) values (${viewer.id}, ${target.id})`;
  await db()`
    insert into taste_notifications (id, user_id, actor_id, kind, body)
    values (${randomUUID()}, ${target.id}, ${viewer.id}, 'new_follower', ${`${viewer.displayName} followed your Taste`})
  `;
  return NextResponse.json({ following: true });
}
