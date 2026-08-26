import { NextRequest, NextResponse } from "next/server";
import { appOrigin, getServerConfig } from "@/lib/server/config";
import { databaseConfigured } from "@/lib/server/db";
import { randomToken, signPayload } from "@/lib/server/crypto";
import { pkcePair } from "@/lib/server/spotify";

export const runtime = "nodejs";

function safeReturnTo(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/my-taste";
}

export async function GET(request: NextRequest) {
  if (!databaseConfigured()) return NextResponse.redirect(new URL("/my-taste?error=database", request.url));
  const origin = appOrigin(request.url);
  const redirectUri = `${origin}/api/auth/spotify/callback`;
  const { verifier, challenge } = pkcePair();
  const state = randomToken(20);
  const oauthCookie = signPayload({
    verifier,
    state,
    returnTo: safeReturnTo(request.nextUrl.searchParams.get("returnTo")),
    expiresAt: Date.now() + 10 * 60_000,
  });
  const params = new URLSearchParams({
    client_id: getServerConfig().spotifyClientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "user-read-recently-played user-top-read user-read-private user-read-email streaming user-read-playback-state user-modify-playback-state",
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  });
  const response = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
  response.cookies.set("spotify_taste_oauth", oauthCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
