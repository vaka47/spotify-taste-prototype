import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { syncSpotifyUser } from "@/lib/server/sync";

export const runtime = "nodejs";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await syncSpotifyUser(user.id, { force: true }));
  } catch (caught) {
    const status = (caught as Error & { status?: number }).status;
    console.error("Spotify sync failed", caught);
    return NextResponse.json({ error: status === 429 ? "rate_limit" : status === 403 ? "allowlist" : "spotify" }, { status: status || 500 });
  }
}
