import { NextRequest, NextResponse } from "next/server";
import { appOrigin } from "@/lib/server/config";
import { encryptSecret, verifyPayload } from "@/lib/server/crypto";
import { db, ensureSchema } from "@/lib/server/db";
import { createSession } from "@/lib/server/session";
import { availableSpotifyHandle, exchangeCode, spotifyApi, type SpotifyProfile } from "@/lib/server/spotify";

export const runtime = "nodejs";

type OAuthPayload = { verifier: string; state: string; returnTo: string; expiresAt: number };

export async function GET(request: NextRequest) {
  const origin = appOrigin(request.url);
  const error = request.nextUrl.searchParams.get("error");
  if (error) return NextResponse.redirect(`${origin}/my-taste?error=${encodeURIComponent(error)}`);
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const payload = verifyPayload<OAuthPayload>(request.cookies.get("spotify_taste_oauth")?.value);
  if (!code || !payload || payload.expiresAt < Date.now() || payload.state !== returnedState) {
    return NextResponse.redirect(`${origin}/my-taste?error=state`);
  }

  try {
    const token = await exchangeCode(code, payload.verifier, `${origin}/api/auth/spotify/callback`);
    const profile = await spotifyApi<SpotifyProfile>(token.access_token, "/me");
    await ensureSchema();
    const previous = await db()`select handle from taste_users where id = ${profile.id} limit 1`;
    const handle = await availableSpotifyHandle(profile.display_name, profile.id);
    await db()`
      insert into taste_users (
        id, handle, display_name, avatar_url, country, spotify_url, product,
        access_token_encrypted, refresh_token_encrypted, token_expires_at, spotify_scope
      ) values (
        ${profile.id}, ${handle}, ${profile.display_name || "Spotify listener"}, ${profile.images?.[0]?.url || null},
        ${profile.country || null}, ${profile.external_urls?.spotify || null}, ${profile.product || null},
        ${encryptSecret(token.access_token)}, ${token.refresh_token ? encryptSecret(token.refresh_token) : null},
        ${new Date(Date.now() + token.expires_in * 1000)}, ${token.scope || ""}
      )
      on conflict (id) do update set
        handle = excluded.handle,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        country = excluded.country,
        spotify_url = excluded.spotify_url,
        product = excluded.product,
        access_token_encrypted = excluded.access_token_encrypted,
        refresh_token_encrypted = coalesce(excluded.refresh_token_encrypted, taste_users.refresh_token_encrypted),
        token_expires_at = excluded.token_expires_at,
        spotify_scope = excluded.spotify_scope,
        updated_at = now()
    `;
    if (previous[0]?.handle && previous[0].handle !== handle) {
      await db()`insert into taste_handle_aliases (alias, user_id) values (${previous[0].handle}, ${profile.id}) on conflict (alias) do nothing`;
    }
    await createSession(profile.id);
    const response = NextResponse.redirect(`${origin}${payload.returnTo}?connected=1`);
    response.cookies.delete("spotify_taste_oauth");
    return response;
  } catch (caught) {
    console.error("Spotify callback failed", caught);
    const status = (caught as Error & { status?: number }).status;
    const reason = status === 403 ? "allowlist" : status === 429 ? "rate_limit" : "spotify";
    return NextResponse.redirect(`${origin}/my-taste?error=${reason}`);
  }
}
