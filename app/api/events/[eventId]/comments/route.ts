import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST() {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "author_notes_only" }, { status: 403 });
}
