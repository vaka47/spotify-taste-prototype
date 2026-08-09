"use client";

const VERIFIER_KEY = "spotify_taste.pkce_verifier";
const STATE_KEY = "spotify_taste.oauth_state";
const TOKEN_KEY = "spotify_taste.spotify_token";

export type SpotifyToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  expires_at: number;
};

export type SpotifyError = Error & { status?: number };

export function getSpotifyConfig() {
  return {
    clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
  };
}

function base64Url(input: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function randomString(length = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, b => chars[b % chars.length]).join("");
}

async function sha256(value: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
}

export async function beginSpotifyLogin() {
  const { clientId, redirectUri } = getSpotifyConfig();
  if (!clientId || !redirectUri) throw new Error("Spotify OAuth environment is not configured");

  const verifier = randomString(72);
  const state = randomString(24);
  const challenge = base64Url(await sha256(verifier));
  localStorage.setItem(VERIFIER_KEY, verifier);
  localStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "user-read-recently-played user-top-read user-read-private",
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeSpotifyCode(code: string, returnedState: string | null) {
  const { clientId, redirectUri } = getSpotifyConfig();
  if (!clientId || !redirectUri) throw new Error("Spotify OAuth environment is not configured");
  const verifier = localStorage.getItem(VERIFIER_KEY);
  const expectedState = localStorage.getItem(STATE_KEY);
  if (!verifier) throw new Error("Missing PKCE verifier");
  if (!returnedState || returnedState !== expectedState) throw new Error("OAuth state mismatch");

  const body = new URLSearchParams({ client_id: clientId, grant_type: "authorization_code", code, redirect_uri: redirectUri, code_verifier: verifier });
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const error = new Error(`Spotify token exchange failed (${response.status})`) as SpotifyError;
    error.status = response.status;
    throw error;
  }
  const raw = await response.json();
  const token: SpotifyToken = { ...raw, expires_at: Date.now() + raw.expires_in * 1000 };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  localStorage.removeItem(VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);
  return token;
}

export function getStoredSpotifyToken(): SpotifyToken | null {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null"); } catch { return null; }
}

export async function getValidSpotifyToken() {
  let token = getStoredSpotifyToken();
  if (!token) throw new Error("Spotify is not connected");
  if (Date.now() < token.expires_at - 30_000) return token;
  if (!token.refresh_token) throw new Error("Spotify session expired");

  return refreshStoredSpotifyToken(token);
}

async function refreshStoredSpotifyToken(token: SpotifyToken) {
  const { clientId } = getSpotifyConfig();
  if (!clientId) throw new Error("Spotify OAuth environment is not configured");
  if (!token.refresh_token) throw new Error("Spotify session expired");
  const body = new URLSearchParams({ client_id: clientId, grant_type: "refresh_token", refresh_token: token.refresh_token });
  const response = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) {
    const error = new Error(`Spotify refresh failed (${response.status})`) as SpotifyError;
    error.status = response.status;
    throw error;
  }
  const raw = await response.json();
  const refreshed = { ...token, ...raw, refresh_token: raw.refresh_token || token.refresh_token, expires_at: Date.now() + raw.expires_in * 1000 };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(refreshed));
  return refreshed;
}

export async function spotifyApi<T>(path: string): Promise<T> {
  let token = await getValidSpotifyToken();
  let response = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (response.status === 401 && token.refresh_token) {
    token = await refreshStoredSpotifyToken(token);
    response = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${token.access_token}` } });
  }
  if (!response.ok) {
    const error = new Error(`Spotify API ${response.status}`) as SpotifyError;
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export function disconnectSpotify() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);
}
