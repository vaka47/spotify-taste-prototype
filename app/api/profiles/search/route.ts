import { NextRequest, NextResponse } from "next/server";
import { databaseConfigured, db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!databaseConfigured()) return NextResponse.json({ profiles: [] });

  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) || "";
  if (query.length < 2) return NextResponse.json({ profiles: [] });

  await ensureSchema();
  const viewer = await getSessionUser();
  const pattern = `%${query}%`;
  const profiles = await db()`
    select u.handle, u.display_name, u.avatar_url, u.role, u.verified,
      exists(
        select 1 from taste_follows f
        where f.follower_id = ${viewer?.id || ""} and f.followed_id = u.id
      ) as viewer_follows,
      (select count(*)::int from taste_follows f where f.followed_id = u.id) as followers
    from taste_users u
    where u.share_enabled = true
      and (u.display_name ilike ${pattern} or u.handle ilike ${pattern})
    order by
      case when lower(u.handle) = lower(${query}) then 0 else 1 end,
      u.verified desc,
      followers desc,
      u.display_name asc
    limit 12
  `;

  return NextResponse.json({
    profiles: profiles.map(profile => ({
      handle: profile.handle,
      name: profile.display_name,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      verified: profile.verified,
      following: profile.viewer_follows,
      followers: profile.followers,
    })),
  });
}
