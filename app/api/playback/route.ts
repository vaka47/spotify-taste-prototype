import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { userAccessToken } from "@/lib/server/spotify";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => null) as { deviceId?: string; uri?: string } | null;
  if (!payload?.deviceId || !/^[a-zA-Z0-9]+$/.test(payload.deviceId) || !payload.uri || !/^spotify:track:[a-zA-Z0-9]+$/.test(payload.uri)) {
    return NextResponse.json({ error: "invalid_playback_request" }, { status: 400 });
  }
  const accessToken = await userAccessToken(user.id);
  const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(payload.deviceId)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: [payload.uri] }),
    cache: "no-store",
  });
  if (!response.ok) {
    return NextResponse.json({ error: "spotify_playback_failed", status: response.status }, { status: response.status });
  }
  return new NextResponse(null, { status: 204 });
}
