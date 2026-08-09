import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureSchema();
  const events = await db()`
    select e.id, e.track_id, e.title, e.artist, e.cover_url, e.spotify_url, e.played_at, e.author_note,
      u.handle, u.display_name, u.avatar_url, u.verified,
      (select count(*)::int from taste_events r where r.user_id = e.user_id and r.track_id = e.track_id and r.played_at > now() - interval '7 days') as repeat_count,
      (select count(*)::int from taste_comments c where c.event_id = e.id) as comment_count
    from taste_follows f
    join taste_users u on u.id = f.followed_id
    join taste_events e on e.user_id = u.id
    where f.follower_id = ${viewer.id}
      and u.share_enabled = true
      and e.is_public = true
      and e.played_at <= now() - make_interval(hours => u.share_delay_hours)
    order by e.played_at desc
    limit 80
  `;
  return NextResponse.json({
    events: events.map(event => ({
      id: event.id,
      profile: { handle: event.handle, name: event.display_name, avatarUrl: event.avatar_url, verified: event.verified },
      track: { id: event.track_id, title: event.title, artist: event.artist, coverUrl: event.cover_url, spotifyUrl: event.spotify_url },
      playedAt: event.played_at,
      authorNote: event.author_note,
      repeatCount: event.repeat_count,
      commentCount: event.comment_count,
    })),
  });
}
