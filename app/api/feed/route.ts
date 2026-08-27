import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureSchema();
  const events = await db()`
    with latest_events as (
      select e.*, row_number() over (partition by e.user_id, e.track_id order by e.played_at desc) as taste_rank
      from taste_events e
      where e.is_public = true
    )
    select e.id, e.track_id, e.title, e.artist, e.cover_url, e.spotify_url, e.played_at, e.author_note,
      u.handle, u.display_name, u.avatar_url, u.verified,
      (select count(*)::int from taste_events r where r.user_id = e.user_id and r.track_id = e.track_id and r.played_at > now() - interval '7 days') as repeat_count,
      (select max(prior.played_at) from taste_events prior where prior.user_id = e.user_id and prior.track_id = e.track_id and prior.played_at < e.played_at - interval '7 days') as previous_played_at,
      (select count(*)::int from taste_reactions r where r.event_id = e.id and r.kind = 'heart') as reaction_count,
      exists(select 1 from taste_reactions r where r.event_id = e.id and r.user_id = ${viewer.id} and r.kind = 'heart') as viewer_reacted
    from taste_follows f
    join taste_users u on u.id = f.followed_id
    join latest_events e on e.user_id = u.id and e.taste_rank = 1
    where f.follower_id = ${viewer.id}
      and u.share_enabled = true
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
      previousPlayedAt: event.previous_played_at,
      reactionCount: event.reaction_count,
      viewerReacted: event.viewer_reacted,
    })),
  });
}
