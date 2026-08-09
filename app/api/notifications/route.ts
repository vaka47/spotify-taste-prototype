import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureSchema();
  const notifications = await db()`
    select n.id, n.kind, n.body, n.event_id, n.read_at, n.created_at,
      u.handle as actor_handle, u.display_name as actor_name, u.avatar_url as actor_avatar,
      owner.handle as event_owner_handle
    from taste_notifications n
    left join taste_users u on u.id = n.actor_id
    left join taste_events e on e.id = n.event_id
    left join taste_users owner on owner.id = e.user_id
    where n.user_id = ${viewer.id}
    order by n.created_at desc
    limit 80
  `;
  return NextResponse.json({ notifications });
}

export async function PATCH() {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureSchema();
  await db()`update taste_notifications set read_at = now() where user_id = ${viewer.id} and read_at is null`;
  return NextResponse.json({ ok: true });
}
