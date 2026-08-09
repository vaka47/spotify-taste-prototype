import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db, ensureSchema } from "@/lib/server/db";
import { decryptSecret, encryptSecret } from "@/lib/server/crypto";
import { getServerConfig } from "@/lib/server/config";

export type SpotifyProfile = {
  id: string;
  display_name?: string;
  country?: string;
  product?: string;
  images?: Array<{ url: string }>;
  external_urls?: { spotify?: string };
};

type StoredTokenUser = {
  id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  token_expires_at: Date | string;
};

export function pkcePair() {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export async function exchangeCode(code: string, verifier: string, redirectUri: string) {
  const body = new URLSearchParams({
    client_id: getServerConfig().spotifyClientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Spotify token exchange failed (${response.status})`);
  return response.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number; scope?: string }>;
}

async function refreshToken(user: StoredTokenUser) {
  if (!user.refresh_token_encrypted) throw new Error("Spotify refresh token is missing");
  const body = new URLSearchParams({
    client_id: getServerConfig().spotifyClientId,
    grant_type: "refresh_token",
    refresh_token: decryptSecret(user.refresh_token_encrypted),
  });
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Spotify refresh failed (${response.status})`);
  const token = await response.json() as { access_token: string; refresh_token?: string; expires_in: number; scope?: string };
  const expiresAt = new Date(Date.now() + token.expires_in * 1000);
  await db()`
    update taste_users set
      access_token_encrypted = ${encryptSecret(token.access_token)},
      refresh_token_encrypted = ${token.refresh_token ? encryptSecret(token.refresh_token) : user.refresh_token_encrypted},
      token_expires_at = ${expiresAt},
      spotify_scope = coalesce(${token.scope || null}, spotify_scope),
      updated_at = now()
    where id = ${user.id}
  `;
  return token.access_token;
}

export async function userAccessToken(userId: string) {
  await ensureSchema();
  const rows = await db()`select id, access_token_encrypted, refresh_token_encrypted, token_expires_at from taste_users where id = ${userId} limit 1`;
  const user = rows[0] as StoredTokenUser | undefined;
  if (!user) throw new Error("Spotify user is not connected");
  if (new Date(user.token_expires_at).getTime() > Date.now() + 60_000) return decryptSecret(user.access_token_encrypted);
  return refreshToken(user);
}

export async function spotifyApi<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const error = new Error(`Spotify API ${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
}

export function normalizedHandle(displayName: string | undefined, spotifyId: string) {
  const base = (displayName || "listener")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28) || "listener";
  return `${base}-${spotifyId.slice(0, 6).toLowerCase()}`;
}
