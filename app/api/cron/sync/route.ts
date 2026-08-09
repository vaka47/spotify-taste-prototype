import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { syncSpotifyUser } from "@/lib/server/sync";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await ensureSchema();
  const users = await db()`select id from taste_users order by last_synced_at asc nulls first limit 24`;
  const results: Array<{ id: string; ok: boolean }> = [];
  for (let index = 0; index < users.length; index += 3) {
    const batch = users.slice(index, index + 3);
    const settled = await Promise.allSettled(batch.map(user => syncSpotifyUser(user.id, { force: true })));
    settled.forEach((result, resultIndex) => results.push({ id: batch[resultIndex].id, ok: result.status === "fulfilled" }));
  }
  return NextResponse.json({ ok: true, users: results.length, synced: results.filter(result => result.ok).length });
}
