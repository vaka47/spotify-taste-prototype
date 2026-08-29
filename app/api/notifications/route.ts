import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureSchema();
  const notifications = await db()`
    select n.id, n.kind, n.body, n.event_id, n.read_at,
      case
        when n.kind in ('meaningful_signal', 'author_note') and e.id is not null
          then greatest(
            n.created_at,
            e.played_at + make_interval(hours => coalesce(owner.share_delay_hours, 0))
          )
        else n.created_at
      end as created_at,
      u.handle as actor_handle, u.display_name as actor_name, u.avatar_url as actor_avatar,
      owner.handle as event_owner_handle, e.title as event_title
    from taste_notifications n
    left join taste_users u on u.id = n.actor_id
    left join taste_events e on e.id = n.event_id
    left join taste_users owner on owner.id = e.user_id
    where n.user_id = ${viewer.id}
      and (
        n.kind not in ('meaningful_signal', 'author_note')
        or (
          e.id is not null
          and e.is_public = true
          and owner.share_enabled = true
          and e.played_at <= now() - make_interval(hours => coalesce(owner.share_delay_hours, 0))
        )
      )
    order by created_at desc
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
