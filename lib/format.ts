import type { TasteEventKind, TrackRef } from "@/types/taste";

export const kindLabels: Record<TasteEventKind, string> = {
  now_playing: "Now playing",
  on_repeat: "On repeat",
  new_discovery: "New discovery",
  deep_cut: "Deep cut",
};

export function getTrackBySlug(tracks: Record<string, TrackRef>, slug: string) {
  const fallback = Object.values(tracks)[0];
  if (!fallback) throw new Error("No demo tracks configured");
  return Object.values(tracks).find(track => track.slug === slug) ?? tracks.euphoria ?? fallback;
}

export function spotifyErrorMessage(status: number) {
  if (status === 401) return "Spotify session expired. Disconnect and connect again.";
  if (status === 403) return "Spotify returned 403. In Development Mode, only allowlisted test users can authorize this app.";
  if (status === 429) return "Spotify rate limit reached. Wait a moment before trying again.";
  return `Spotify request failed (${status}).`;
}
