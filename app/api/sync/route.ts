import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";
import { spotifyApi, userAccessToken } from "@/lib/server/spotify";

export const runtime = "nodejs";

type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  artists: Array<{ id: string; name: string }>;
  album?: { name?: string; images?: Array<{ url: string }> };
  external_urls?: { spotify?: string };
};
type RecentlyPlayed = { items: Array<{ track: SpotifyTrack; played_at: string }> };
type TopItems<T> = { items: T[] };

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    await ensureSchema();
    const accessToken = await userAccessToken(user.id);
    const [recent, topTracks, topArtists, privacyRows] = await Promise.all([
      spotifyApi<RecentlyPlayed>(accessToken, "/me/player/recently-played?limit=50"),
      spotifyApi<TopItems<SpotifyTrack>>(accessToken, "/me/top/tracks?time_range=short_term&limit=12"),
      spotifyApi<TopItems<{ id: string; name: string; images?: Array<{ url: string }>; genres?: string[] }>>(accessToken, "/me/top/artists?time_range=short_term&limit=12"),
      db()`select share_enabled, selected_sessions_only, hidden_track_ids, hidden_artist_ids from taste_users where id = ${user.id}`,
    ]);
    const privacy = privacyRows[0];
    const hiddenTracks = new Set<string>(privacy.hidden_track_ids || []);
    const hiddenArtists = new Set<string>(privacy.hidden_artist_ids || []);
    let inserted = 0;
    let newestEventId: string | null = null;
    let newestTitle = "";

    for (const item of recent.items) {
      const eventId = createHash("sha256").update(`${user.id}:${item.track.id}:${item.played_at}`).digest("hex").slice(0, 32);
      const artistIds = item.track.artists.map(artist => artist.id);
      const isPublic = Boolean(privacy.share_enabled) && !privacy.selected_sessions_only && !hiddenTracks.has(item.track.id) && !artistIds.some(id => hiddenArtists.has(id));
      const result = await db()`
        insert into taste_events (
          id, user_id, track_id, title, artist, artist_ids, album_name, cover_url,
          spotify_url, duration_ms, played_at, is_public
        ) values (
          ${eventId}, ${user.id}, ${item.track.id}, ${item.track.name},
          ${item.track.artists.map(artist => artist.name).join(", ")}, ${db().json(artistIds)},
          ${item.track.album?.name || null}, ${item.track.album?.images?.[0]?.url || null},
          ${item.track.external_urls?.spotify || `https://open.spotify.com/track/${item.track.id}`},
          ${item.track.duration_ms || 0}, ${new Date(item.played_at)}, ${isPublic}
        ) on conflict (id) do nothing
        returning id
      `;
      if (result.length) {
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
        updated_at = now()
      where id = ${user.id}
    `;

    if (inserted && newestEventId && privacy.share_enabled && !privacy.selected_sessions_only) {
      await db()`
        insert into taste_notifications (id, user_id, actor_id, kind, event_id, body)
        select md5(follower_id || ${newestEventId} || clock_timestamp()::text), follower_id, ${user.id}, 'new_listen', ${newestEventId}, ${`${user.displayName} listened to ${newestTitle}`}
        from taste_follows where followed_id = ${user.id}
      `;
    }
    return NextResponse.json({ ok: true, inserted, total: recent.items.length, syncedAt: new Date().toISOString() });
  } catch (caught) {
    const status = (caught as Error & { status?: number }).status;
    console.error("Spotify sync failed", caught);
    return NextResponse.json({ error: status === 429 ? "rate_limit" : status === 403 ? "allowlist" : "spotify" }, { status: status || 500 });
  }
}
