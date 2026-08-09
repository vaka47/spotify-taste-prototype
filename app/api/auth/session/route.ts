import { NextResponse } from "next/server";
import { databaseConfigured, db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  if (!databaseConfigured()) return NextResponse.json({ configured: false, user: null });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ configured: true, user: null });
  await ensureSchema();
  const [stats] = await db()`
    select
      (select count(*)::int from taste_follows where followed_id = ${user.id}) as followers,
      (select count(*)::int from taste_follows where follower_id = ${user.id}) as following,
      (select count(*)::int from taste_events where user_id = ${user.id}) as events,
      (select coalesce(sum(duration_ms), 0)::bigint from taste_events where user_id = ${user.id} and played_at > now() - interval '7 days') as duration_ms_7d,
      (select count(distinct track_id)::int from taste_events where user_id = ${user.id} and played_at > now() - interval '30 days') as unique_tracks_30d
  `;
  const [tasteData] = await db()`select top_tracks, top_artists from taste_users where id = ${user.id}`;
  return NextResponse.json({ configured: true, user: { ...user, stats, topTracks: tasteData.top_tracks, topArtists: tasteData.top_artists } });
}
