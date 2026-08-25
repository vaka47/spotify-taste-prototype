import { NextRequest, NextResponse } from "next/server";
import { databaseConfigured, db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ handle: string }> }) {
  if (!databaseConfigured()) return NextResponse.json({ error: "database_not_configured" }, { status: 503 });

  const { handle } = await context.params;
  const type = request.nextUrl.searchParams.get("type") === "following" ? "following" : "followers";
  await ensureSchema();

  const viewer = await getSessionUser();
  const [profile] = await db()`select id, share_enabled from taste_users where handle = ${handle} limit 1`;
  if (!profile) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!profile.share_enabled && viewer?.id !== profile.id) return NextResponse.json({ error: "private" }, { status: 403 });

  const profiles = type === "followers"
    ? await db()`
        select u.handle, u.display_name, u.avatar_url, u.role, u.verified,
          exists(select 1 from taste_follows mine where mine.follower_id = ${viewer?.id || ""} and mine.followed_id = u.id) as viewer_follows
        from taste_follows f
        join taste_users u on u.id = f.follower_id
        where f.followed_id = ${profile.id}
        order by f.created_at desc
        limit 100
      `
    : await db()`
        select u.handle, u.display_name, u.avatar_url, u.role, u.verified,
          exists(select 1 from taste_follows mine where mine.follower_id = ${viewer?.id || ""} and mine.followed_id = u.id) as viewer_follows
        from taste_follows f
        join taste_users u on u.id = f.followed_id
        where f.follower_id = ${profile.id}
        order by f.created_at desc
        limit 100
      `;

  return NextResponse.json({
    type,
    profiles: profiles.map(item => ({
      handle: item.handle,
      name: item.display_name,
      avatarUrl: item.avatar_url,
      role: item.role,
      verified: item.verified,
      following: item.viewer_follows,
    })),
  });
}
