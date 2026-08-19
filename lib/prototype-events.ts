import type { PrototypeAttributionEvent } from "@/types/taste";

const KEY = "spotify_taste.attribution_events";
export const PROTOTYPE_EVENTS_UPDATED = "spotify_taste.events_updated";

export function readPrototypeEvents(): PrototypeAttributionEvent[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function recordTrackOpen(tastemakerId: string, trackId: string) {
  return recordAttributionEvent("track_open", tastemakerId, trackId);
}

export function recordAttributionEvent(
  eventType: PrototypeAttributionEvent["eventType"],
  tastemakerId: string,
  trackId: string,
) {
  const events = readPrototypeEvents();
  const event: PrototypeAttributionEvent = {
    id: crypto.randomUUID(),
    eventType,
    tastemakerId,
    trackId,
    occurredAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify([...events, event]));
  window.dispatchEvent(new CustomEvent(PROTOTYPE_EVENTS_UPDATED));
  return event;
}

export function clearPrototypeEvents() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(PROTOTYPE_EVENTS_UPDATED));
  }
}
