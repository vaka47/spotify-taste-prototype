import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";
import { userAccessToken } from "@/lib/server/spotify";

export const runtime = "nodejs";

const requiredScopes = ["streaming", "user-modify-playback-state"];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureSchema();
  const [account] = await db()`select product, spotify_scope from taste_users where id = ${user.id}`;
  const scopes = new Set(String(account?.spotify_scope || "").split(/\s+/).filter(Boolean));
  if (requiredScopes.some(scope => !scopes.has(scope))) {
    return NextResponse.json({ error: "reauthorization_required" }, { status: 409 });
  }
  if (account?.product !== "premium") {
    return NextResponse.json({ error: "premium_required" }, { status: 403 });
  }
  const accessToken = await userAccessToken(user.id);
  return NextResponse.json(
    { accessToken },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
