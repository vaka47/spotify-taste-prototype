import { tracks } from "@/lib/mock-data";

export type PublicTasteTrack = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  fallbackCoverUrl?: string;
  spotifyUrl: string;
  spotifyEmbedUrl: string;
};

export type PublicTasteEvent = {
  id: string;
  track: PublicTasteTrack;
  listenedAt: string;
  signal: string;
  authorComment: string;
  influenceStreams: string;
  discoverySaves: string;
  repeatRate: string;
};

export type PublicTasteProfile = {
  id: string;
  handle: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  fallbackAvatarUrl?: string;
  verified: boolean;
  tasteFollowers: string;
  influenceStreams: string;
  discoverySaves: string;
  commentRate: string;
  events: PublicTasteEvent[];
  source: "seeded" | "snapshot";
};

export type TasteNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
};

export type TasteSnapshot = {
  version: 1;
  handle: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl?: string;
  tasteNote: string;
  generatedAt: string;
  events: PublicTasteEvent[];
};

export const SOCIAL_FOLLOW_KEY = "spotify_taste.social_following";
export const SOCIAL_COMMENTS_KEY = "spotify_taste.social_comments";
export const SOCIAL_NOTIFICATIONS_KEY = "spotify_taste.notifications";

export const seededTasteProfiles: Record<string, PublicTasteProfile> = {
  ivan: {
    id: "public_taste_ivan",
    handle: "ivan",
    name: "Ivan Safonov",
    role: "Product taste curator",
    bio: "Opt-in listening signal for the Spotify Taste pitch. Fans follow the music, the context and the influence graph.",
    avatarUrl: "/avatars/travis_demo.jpg",
    verified: true,
    tasteFollowers: "18.4K",
    influenceStreams: "842K",
    discoverySaves: "96K",
    commentRate: "31%",
    source: "seeded",
    events: [
      {
        id: "ivan_ev_euphoria",
        track: tracks.euphoria,
        listenedAt: "4 min ago",
        signal: "Live taste signal",
        authorComment: "This is the kind of track where the context matters as much as the play.",
        influenceStreams: "214K",
        discoverySaves: "29K",
        repeatRate: "42%",
      },
      {
        id: "ivan_ev_chamber",
        track: tracks.chamber,
        listenedAt: "28 min ago",
        signal: "Recently discovered",
        authorComment: "Soft left turn after rap-heavy listening. Great example of taste expansion.",
        influenceStreams: "118K",
        discoverySaves: "17K",
        repeatRate: "36%",
      },
      {
        id: "ivan_ev_lvbag",
        track: tracks.lvbag,
        listenedAt: "1h ago",
        signal: "Saved after first listen",
        authorComment: "This one is a perfect notification moment: short note plus immediate play.",
        influenceStreams: "96K",
        discoverySaves: "12K",
        repeatRate: "28%",
      },
      {
        id: "ivan_ev_fein",
        track: tracks.fein,
        listenedAt: "Yesterday",
        signal: "On repeat",
        authorComment: "A mainstream track can still be useful as an anchor in a taste graph.",
        influenceStreams: "402K",
        discoverySaves: "38K",
        repeatRate: "57%",
      },
    ],
  },
  maya: {
    id: "public_taste_maya",
    handle: "maya",
    name: "Maya Chen",
    role: "DJ and selector",
    bio: "A seeded second profile showing how non-celebrity tastemakers can monetize influence.",
    avatarUrl: "/covers/chamber.jpg",
    verified: true,
    tasteFollowers: "82K",
    influenceStreams: "3.1M",
    discoverySaves: "410K",
    commentRate: "44%",
    source: "seeded",
    events: [
      {
        id: "maya_ev_nissan",
        track: tracks.nissan,
        listenedAt: "7 min ago",
        signal: "Club follow-up",
        authorComment: "This has enough bite to cut through a late set without feeling obvious.",
        influenceStreams: "731K",
        discoverySaves: "88K",
        repeatRate: "49%",
      },
      {
        id: "maya_ev_likehim",
        track: tracks.likehim,
        listenedAt: "52 min ago",
        signal: "Private session surfaced",
        authorComment: "A quieter save. I would not post this as a playlist, but Taste makes it natural.",
        influenceStreams: "286K",
        discoverySaves: "41K",
        repeatRate: "33%",
      },
    ],
  },
};

export const seededNotifications: TasteNotification[] = [
  {
    id: "seed_note_1",
    title: "Ivan added a note",
    body: "This one is a perfect notification moment: short note plus immediate play.",
    href: "/taste/ivan",
    createdAt: "2 min ago",
    read: false,
  },
  {
    id: "seed_note_2",
    title: "Maya is on repeat",
    body: "NISSAN ALTIMA is generating high repeat velocity from her Taste followers.",
    href: "/taste/maya",
    createdAt: "16 min ago",
    read: false,
  },
  {
    id: "seed_note_3",
    title: "Influence Stream milestone",
    body: "Your follow graph generated 7 new Taste-sourced saves in this browser session.",
    href: "/hub",
    createdAt: "Today",
    read: true,
  },
];

export function profileFromSnapshot(snapshot: TasteSnapshot): PublicTasteProfile {
  return {
    id: `snapshot_${snapshot.handle}`,
    handle: snapshot.handle,
    name: snapshot.name,
    role: snapshot.role,
    bio: snapshot.bio,
    avatarUrl: snapshot.avatarUrl || "/avatars/travis_demo.jpg",
    fallbackAvatarUrl: "/avatars/travis_demo.jpg",
    verified: false,
    tasteFollowers: "share link",
    influenceStreams: "live preview",
    discoverySaves: `${snapshot.events.length} tracks`,
    commentRate: "opt-in",
    source: "snapshot",
    events: snapshot.events,
  };
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function readFollowingProfiles() {
  return readJson<string[]>(SOCIAL_FOLLOW_KEY, []);
}

export function writeFollowingProfiles(handles: string[]) {
  writeJson(SOCIAL_FOLLOW_KEY, handles);
}

export function readNotifications() {
  const local = readJson<TasteNotification[]>(SOCIAL_NOTIFICATIONS_KEY, []);
  const knownIds = new Set(local.map(item => item.id));
  return [...seededNotifications.filter(item => !knownIds.has(item.id)), ...local];
}

export function pushNotification(notification: Omit<TasteNotification, "id" | "createdAt" | "read">) {
  const current = readJson<TasteNotification[]>(SOCIAL_NOTIFICATIONS_KEY, []);
  const next: TasteNotification = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: "just now",
    read: false,
  };
  writeJson(SOCIAL_NOTIFICATIONS_KEY, [next, ...current].slice(0, 24));
  window.dispatchEvent(new CustomEvent("spotify_taste.notifications_updated"));
  return next;
}

export function markNotificationsRead() {
  const current = readNotifications().map(item => ({ ...item, read: true }));
  writeJson(SOCIAL_NOTIFICATIONS_KEY, current);
  window.dispatchEvent(new CustomEvent("spotify_taste.notifications_updated"));
}

export function encodeSnapshot(snapshot: TasteSnapshot) {
  const json = JSON.stringify(snapshot);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeSnapshot(encoded: string | null) {
  if (!encoded) return null;
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as TasteSnapshot;
  } catch {
    return null;
  }
}
