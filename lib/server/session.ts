import "server-only";
import { cookies } from "next/headers";
import { db, ensureSchema } from "@/lib/server/db";
import { hashToken, randomToken } from "@/lib/server/crypto";

export const SESSION_COOKIE = "spotify_taste_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  bio: string;
  shareEnabled: boolean;
  shareDelayHours: number;
  selectedSessionsOnly: boolean;
  lastSyncedAt: string | null;
};

export async function createSession(userId: string) {
  await ensureSchema();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db()`insert into taste_sessions (token_hash, user_id, expires_at) values (${hashToken(token)}, ${userId}, ${expiresAt})`;
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await ensureSchema();
    await db()`delete from taste_sessions where token_hash = ${hashToken(token)}`;
  }
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  await ensureSchema();
  const rows = await db()`
    select u.id, u.handle, u.display_name, u.avatar_url, u.role, u.bio,
      u.share_enabled, u.share_delay_hours, u.selected_sessions_only, u.last_synced_at
    from taste_sessions s
    join taste_users u on u.id = s.user_id
    where s.token_hash = ${hashToken(token)} and s.expires_at > now()
    limit 1
  `;
  const user = rows[0];
  if (!user) return null;
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    role: user.role,
    bio: user.bio,
    shareEnabled: user.share_enabled,
    shareDelayHours: user.share_delay_hours,
    selectedSessionsOnly: user.selected_sessions_only,
    lastSyncedAt: user.last_synced_at?.toISOString?.() || user.last_synced_at || null,
  };
}
