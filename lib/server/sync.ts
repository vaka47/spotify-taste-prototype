import "server-only";
import { createHash } from "node:crypto";
import { db, ensureSchema } from "@/lib/server/db";
import { spotifyApi, userAccessToken } from "@/lib/server/spotify";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_RECENT_PAGES = 12;

type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  popularity?: number;
  artists: Array<{ id: string; name: string }>;
  album?: { name?: string; images?: Array<{ url: string }> };
  external_urls?: { spotify?: string };
};

type PlayHistoryItem = { track: SpotifyTrack; played_at: string };
type RecentlyPlayed = { items: PlayHistoryItem[]; next?: string | null };
type TopItems<T> = { items: T[] };

function apiPath(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname !== "api.spotify.com" || !parsed.pathname.startsWith("/v1/")) return null;
  return `${parsed.pathname.replace(/^\/v1/, "")}${parsed.search}`;
}

async function recentlyPlayedForWeek(accessToken: string) {
  const cutoff = Date.now() - WEEK_MS;
  let path: string | null = `/me/player/recently-played?limit=50&after=${cutoff}`;
  const seen = new Set<string>();
  const items: PlayHistoryItem[] = [];

  for (let page = 0; path && page < MAX_RECENT_PAGES; page += 1) {
    const result: RecentlyPlayed = await spotifyApi<RecentlyPlayed>(accessToken, path);
    let reachedCutoff = false;
    for (const item of result.items) {
      if (new Date(item.played_at).getTime() < cutoff) {
        reachedCutoff = true;
        continue;
      }
      const key = `${item.track.id}:${item.played_at}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push(item);
      }
    }
    path = reachedCutoff || !result.next ? null : apiPath(result.next);
  }

  return items.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime());
}

export async function syncSpotifyUser(userId: string, options: { force?: boolean; staleMinutes?: number } = {}) {
  await ensureSchema();
  const staleMinutes = Math.max(1, options.staleMinutes ?? 10);
  const lease = await db()`
    update taste_users set sync_locked_until = now() + interval '3 minutes'
    where id = ${userId}
      and (sync_locked_until is null or sync_locked_until < now())
      and (${Boolean(options.force)} or last_synced_at is null or last_synced_at < now() - (${staleMinutes} * interval '1 minute'))
    returning id, display_name
  `;
  if (!lease.length) return { ok: true, skipped: true, inserted: 0, total: 0 };

  try {
    const accessToken = await userAccessToken(userId);
    const [recentItems, topTracks, topArtists, privacyRows] = await Promise.all([
      recentlyPlayedForWeek(accessToken),
      spotifyApi<TopItems<SpotifyTrack>>(accessToken, "/me/top/tracks?time_range=short_term&limit=12"),
      spotifyApi<TopItems<{ id: string; name: string; images?: Array<{ url: string }>; genres?: string[] }>>(accessToken, "/me/top/artists?time_range=short_term&limit=12"),
      db()`select share_enabled, selected_sessions_only, hidden_track_ids, hidden_artist_ids from taste_users where id = ${userId}`,
    ]);
    const privacy = privacyRows[0];
    const hiddenTracks = new Set<string>(privacy.hidden_track_ids || []);
    const hiddenArtists = new Set<string>(privacy.hidden_artist_ids || []);
    let inserted = 0;
    let newestEventId: string | null = null;
    let newestTitle = "";

    for (const item of recentItems) {
      if (!item.track.id) continue;
      const eventId = createHash("sha256").update(`${userId}:${item.track.id}:${item.played_at}`).digest("hex").slice(0, 32);
      const artistIds = item.track.artists.map(artist => artist.id);
      const isPublic = Boolean(privacy.share_enabled) && !privacy.selected_sessions_only && !hiddenTracks.has(item.track.id) && !artistIds.some(id => hiddenArtists.has(id));
      const result = await db()`
        insert into taste_events (
          id, user_id, track_id, title, artist, artist_ids, album_name, cover_url,
          spotify_url, duration_ms, popularity, played_at, is_public
        ) values (
          ${eventId}, ${userId}, ${item.track.id}, ${item.track.name},
          ${item.track.artists.map(artist => artist.name).join(", ")}, ${db().json(artistIds)},
          ${item.track.album?.name || null}, ${item.track.album?.images?.[0]?.url || null},
          ${item.track.external_urls?.spotify || `https://open.spotify.com/track/${item.track.id}`},
          ${item.track.duration_ms || 0}, ${Math.max(0, Math.min(100, item.track.popularity || 0))},
          ${new Date(item.played_at)}, ${isPublic}
        ) on conflict (id) do update set popularity = excluded.popularity
        returning (xmax = 0) as inserted
      `;
      if (result[0]?.inserted) {
        inserted += 1;
        if (!newestEventId) {
          newestEventId = eventId;
          newestTitle = item.track.name;
        }
      }
    }

    await db()`
      update taste_users set
        top_tracks = ${db().json(topTracks.items)},
        top_artists = ${db().json(topArtists.items)},
        last_synced_at = now(),
        sync_locked_until = null,
        updated_at = now()
      where id = ${userId}
    `;

    if (inserted && newestEventId && privacy.share_enabled && !privacy.selected_sessions_only) {
      await db()`
        insert into taste_notifications (id, user_id, actor_id, kind, event_id, body)
        select md5(follower_id || ${newestEventId} || clock_timestamp()::text), follower_id, ${userId}, 'new_listen', ${newestEventId}, ${`${lease[0].display_name} listened to ${newestTitle}`}
        from taste_follows where followed_id = ${userId}
      `;
    }

    return { ok: true, skipped: false, inserted, total: recentItems.length, syncedAt: new Date().toISOString() };
  } catch (error) {
    await db()`update taste_users set sync_locked_until = null where id = ${userId}`.catch(() => undefined);
    throw error;
  }
}
