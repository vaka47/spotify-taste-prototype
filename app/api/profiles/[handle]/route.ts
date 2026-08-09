import { NextRequest, NextResponse } from "next/server";
import { databaseConfigured, db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ handle: string }> }) {
  if (!databaseConfigured()) return NextResponse.json({ error: "database_not_configured" }, { status: 503 });
  const { handle } = await context.params;
  await ensureSchema();
  const viewer = await getSessionUser();
  const profiles = await db()`
    select u.id, u.handle, u.display_name, u.avatar_url, u.role, u.bio, u.verified,
      u.share_enabled, u.share_delay_hours, u.last_synced_at,
      (select count(*)::int from taste_follows where followed_id = u.id) as followers,
      (select count(*)::int from taste_follows where follower_id = u.id) as following,
      (select count(*)::int from taste_events where user_id = u.id) as total_events,
      (select coalesce(sum(duration_ms), 0)::bigint from taste_events where user_id = u.id and played_at > now() - interval '7 days') as duration_ms_7d,
      (select count(distinct track_id)::int from taste_events where user_id = u.id and played_at > now() - interval '30 days') as unique_tracks_30d,
      exists(select 1 from taste_follows where follower_id = ${viewer?.id || ""} and followed_id = u.id) as viewer_follows
    from taste_users u where u.handle = ${handle} limit 1
  `;
  const profile = profiles[0];
  if (!profile) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const isOwner = viewer?.id === profile.id;
  if (!profile.share_enabled && !isOwner) return NextResponse.json({ error: "private" }, { status: 403 });

  const events = await db()`
    select e.id, e.track_id, e.title, e.artist, e.album_name, e.cover_url, e.spotify_url,
      e.duration_ms, e.played_at, e.author_note, e.is_public,
      (select count(*)::int from taste_events r where r.user_id = e.user_id and r.track_id = e.track_id and r.played_at > now() - interval '30 days') as repeat_count,
      (select count(*)::int from taste_comments c where c.event_id = e.id) as comment_count
    from taste_events e
    where e.user_id = ${profile.id}
      and (${isOwner} or (e.is_public and e.played_at <= now() - make_interval(hours => ${profile.share_delay_hours})))
    order by e.played_at desc
    limit 50
  `;
  const eventIds = events.map(event => event.id);
  const comments = eventIds.length ? await db()`
    select c.id, c.event_id, c.body, c.created_at, u.handle as author_handle,
      u.display_name as author_name, u.avatar_url as author_avatar
    from taste_comments c join taste_users u on u.id = c.author_id
    where c.event_id in ${db()(eventIds)}
    order by c.created_at asc
  ` : [];
  return NextResponse.json({
    profile: {
      id: profile.id,
      handle: profile.handle,
      name: profile.display_name,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      bio: profile.bio,
      verified: profile.verified,
      followers: profile.followers,
      following: profile.following,
      totalEvents: profile.total_events,
      durationMs7d: Number(profile.duration_ms_7d),
      uniqueTracks30d: profile.unique_tracks_30d,
      lastSyncedAt: profile.last_synced_at,
      viewerFollows: profile.viewer_follows,
      isOwner,
      source: "spotify_authorized",
    },
    events: events.map(event => ({
      id: event.id,
      track: {
        id: event.track_id,
        title: event.title,
        artist: event.artist,
        albumName: event.album_name,
        coverUrl: event.cover_url,
        spotifyUrl: event.spotify_url,
        spotifyEmbedUrl: `https://open.spotify.com/embed/track/${event.track_id}?utm_source=generator&theme=0`,
        durationMs: event.duration_ms,
      },
      playedAt: event.played_at,
      authorNote: event.author_note,
      isPublic: event.is_public,
      repeatCount: event.repeat_count,
      commentCount: event.comment_count,
      comments: comments.filter(comment => comment.event_id === event.id),
    })),
  });
}
