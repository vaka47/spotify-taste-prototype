export type DataOrigin = "illustrative" | "spotify";

export type TrackRef = {
  id: string;
  slug: string;
  spotifyId: string;
  spotifyUri: string;
  spotifyUrl: string;
  spotifyEmbedUrl: string;
  title: string;
  artist: string;
  coverUrl: string;
  fallbackCoverUrl?: string;
  externalUrl?: string;
  origin: DataOrigin;
};

export type Tastemaker = {
  id: string;
  slug: string;
  name: string;
  role: string;
  avatarUrl: string;
  fallbackAvatarUrl?: string;
  spotifyArtistId?: string;
  spotifyUrl?: string;
  spotifyEmbedUrl?: string;
  verified: boolean;
  origin: DataOrigin;
};

export type TasteEventKind = "now_playing" | "on_repeat" | "new_discovery" | "deep_cut";

export type TasteFeedEvent = {
  id: string;
  tastemaker: Tastemaker;
  track: TrackRef;
  kind: TasteEventKind;
  timestampLabel: string;
  humanSignal: string;
  secondarySignal?: string;
  origin: DataOrigin;
};

export type TrackSignal = {
  track: TrackRef;
  signal: string;
  metric: string;
};

export type WeeklyTrackSignal = {
  track: TrackRef;
  plays: number;
  popularity: number;
  lastPlayed: string;
};

export type InspiredMix = {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  fallbackCoverUrl?: string;
  href: string;
  externalUrl?: string;
  origin: DataOrigin;
};

export type HubInfluencedTrack = {
  track: TrackRef;
  influenceStreams: string;
  share: number;
};

export type PrototypeAttributionEvent = {
  id: string;
  eventType: "impression" | "track_open" | "save_intent" | "repeat_intent" | "artist_follow_intent";
  tastemakerId: string;
  trackId: string;
  occurredAt: string;
};
