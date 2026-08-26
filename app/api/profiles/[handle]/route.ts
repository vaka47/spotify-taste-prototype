import { NextRequest, NextResponse } from "next/server";
import { databaseConfigured, db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";
import { syncSpotifyUser } from "@/lib/server/sync";

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
      exists(select 1 from taste_follows where follower_id = ${viewer?.id || ""} and followed_id = u.id) as viewer_follows
    from taste_users u
    where u.handle = ${handle}
      or exists(select 1 from taste_handle_aliases a where a.alias = ${handle} and a.user_id = u.id)
    order by case when u.handle = ${handle} then 0 else 1 end
    limit 1
  `;
  const profile = profiles[0];
  if (!profile) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const isOwner = viewer?.id === profile.id;
  if (!profile.share_enabled && !isOwner) return NextResponse.json({ error: "private" }, { status: 403 });

  try {
    await syncSpotifyUser(profile.id, { staleMinutes: 10 });
  } catch (error) {
    console.error("Background profile sync failed", error);
  }

  const [freshProfile] = await db()`
    select handle, display_name, avatar_url, role, bio, verified, last_synced_at
    from taste_users where id = ${profile.id} limit 1
  `;

  const [stats] = await db()`
    select
      (select count(*)::int from taste_events e where e.user_id = ${profile.id}
        and (${isOwner} or (e.is_public and e.played_at <= now() - make_interval(hours => ${profile.share_delay_hours})))) as total_events,
      (select coalesce(sum(e.duration_ms), 0)::bigint from taste_events e where e.user_id = ${profile.id}
        and e.played_at > now() - interval '7 days'
        and (${isOwner} or (e.is_public and e.played_at <= now() - make_interval(hours => ${profile.share_delay_hours})))) as duration_ms_7d,
      (select count(distinct e.track_id)::int from taste_events e where e.user_id = ${profile.id}
        and e.played_at > now() - interval '7 days'
        and (${isOwner} or (e.is_public and e.played_at <= now() - make_interval(hours => ${profile.share_delay_hours})))) as unique_tracks_7d,
      (select last_synced_at from taste_users where id = ${profile.id}) as last_synced_at
  `;

  const events = await db()`
    select e.id, e.track_id, e.title, e.artist, e.album_name, e.cover_url, e.spotify_url,
      e.duration_ms, e.popularity, e.played_at, e.author_note, e.is_public,
      (select count(*)::int from taste_events r where r.user_id = e.user_id and r.track_id = e.track_id
        and r.played_at > now() - interval '7 days'
        and (${isOwner} or (r.is_public and r.played_at <= now() - make_interval(hours => ${profile.share_delay_hours})))) as repeat_count,
      (select count(*)::int from taste_comments c where c.event_id = e.id) as comment_count
    from taste_events e
    where e.user_id = ${profile.id}
      and (${isOwner} or (e.is_public and e.played_at <= now() - make_interval(hours => ${profile.share_delay_hours})))
    order by e.played_at desc
    limit 100
  `;

  const weeklyHistory = await db()`
    with visible as (
      select * from taste_events e
      where e.user_id = ${profile.id}
        and e.played_at > now() - interval '7 days'
        and (${isOwner} or (e.is_public and e.played_at <= now() - make_interval(hours => ${profile.share_delay_hours})))
    ), ranked as (
      select track_id, count(*)::int as play_count, max(popularity)::int as popularity,
        max(played_at) as last_played_at, sum(duration_ms)::bigint as total_duration_ms
      from visible group by track_id
    )
    select ranked.*, latest.id as event_id, latest.title, latest.artist, latest.album_name,
      latest.cover_url, latest.spotify_url, latest.duration_ms
      , (select max(prior.played_at) from taste_events prior
          where prior.user_id = ${profile.id} and prior.track_id = ranked.track_id
            and prior.played_at <= now() - interval '7 days'
            and (${isOwner} or (prior.is_public and prior.played_at <= now() - make_interval(hours => ${profile.share_delay_hours})))
        ) as previous_played_at
    from ranked
    join lateral (
      select id, title, artist, album_name, cover_url, spotify_url, duration_ms
      from visible where visible.track_id = ranked.track_id
      order by played_at desc limit 1
    ) latest on true
    order by ranked.play_count desc, ranked.popularity desc, ranked.last_played_at desc
    limit 100
  `;

  const eventIds = events.map(event => event.id);
  const comments = eventIds.length ? await db()`
    select c.id, c.event_id, c.body, c.created_at, u.handle as author_handle,
      u.display_name as author_name, u.avatar_url as author_avatar
    from taste_comments c join taste_users u on u.id = c.author_id
    where c.event_id in ${db()(eventIds)}
    order by c.created_at asc
  ` : [];

  const trackPayload = (row: Record<string, unknown>) => ({
    id: row.track_id,
    title: row.title,
    artist: row.artist,
    albumName: row.album_name,
    coverUrl: row.cover_url,
    spotifyUrl: row.spotify_url,
    spotifyEmbedUrl: `https://open.spotify.com/embed/track/${row.track_id}?utm_source=generator&theme=0`,
    durationMs: Number(row.duration_ms || 0),
    popularity: Number(row.popularity || 0),
  });

  return NextResponse.json({
    profile: {
      id: profile.id,
      handle: freshProfile?.handle || profile.handle,
      name: freshProfile?.display_name || profile.display_name,
      avatarUrl: freshProfile?.avatar_url || profile.avatar_url,
      role: freshProfile?.role || profile.role,
      bio: freshProfile?.bio || profile.bio,
      verified: freshProfile?.verified ?? profile.verified,
      followers: profile.followers,
      following: profile.following,
      totalEvents: stats.total_events,
      durationMs7d: Number(stats.duration_ms_7d),
      uniqueTracks7d: stats.unique_tracks_7d,
      lastSyncedAt: freshProfile?.last_synced_at || stats.last_synced_at,
      viewerFollows: profile.viewer_follows,
      isOwner,
      source: "spotify_authorized",
    },
    weeklyHistory: weeklyHistory.map(row => ({
      eventId: row.event_id,
      track: trackPayload(row),
      playCount: row.play_count,
      popularity: row.popularity,
      lastPlayedAt: row.last_played_at,
      previousPlayedAt: row.previous_played_at,
      totalDurationMs: Number(row.total_duration_ms),
    })),
    events: events.map(event => ({
      id: event.id,
      track: trackPayload(event),
      playedAt: event.played_at,
      authorNote: event.author_note,
      isPublic: event.is_public,
      repeatCount: event.repeat_count,
      commentCount: event.comment_count,
      comments: comments.filter(comment => comment.event_id === event.id),
    })),
  });
}
