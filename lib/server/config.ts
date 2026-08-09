import "server-only";

export function getServerConfig() {
  const sessionSecret = process.env.SESSION_SECRET;
  const spotifyClientId = process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

  if (!sessionSecret) throw new Error("SESSION_SECRET is not configured");
  if (!spotifyClientId) throw new Error("SPOTIFY_CLIENT_ID is not configured");

  return {
    sessionSecret,
    spotifyClientId,
    tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || sessionSecret,
  };
}

export function appOrigin(requestUrl?: string) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (requestUrl) return new URL(requestUrl).origin;
  return "http://localhost:3000";
}
