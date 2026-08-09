import type {
  HubInfluencedTrack,
  InspiredMix,
  TasteFeedEvent,
  Tastemaker,
  TrackRef,
  TrackSignal,
} from "@/types/taste";

export const travis: Tastemaker = {
  id: "spotify_artist_0Y5tJX1MQlPlqiwlOH1tJY",
  slug: "travis-scott",
  name: "Travis Scott",
  role: "Artist - cultural tastemaker",
  avatarUrl: "https://image-cdn-fa.spotifycdn.com/image/ab6761610000517419c2790744c792d05570bb71",
  fallbackAvatarUrl: "https://image-cdn-fa.spotifycdn.com/image/ab6761610000517419c2790744c792d05570bb71",
  spotifyArtistId: "0Y5tJX1MQlPlqiwlOH1tJY",
  spotifyUrl: "https://open.spotify.com/artist/0Y5tJX1MQlPlqiwlOH1tJY",
  spotifyEmbedUrl: "https://open.spotify.com/embed/artist/0Y5tJX1MQlPlqiwlOH1tJY?utm_source=oembed",
  verified: true,
  origin: "spotify",
};

function spotifyTrack({
  spotifyId,
  slug,
  title,
  artist,
  coverUrl,
  fallbackCoverUrl,
}: {
  spotifyId: string;
  slug: string;
  title: string;
  artist: string;
  coverUrl: string;
  fallbackCoverUrl: string;
}): TrackRef {
  const spotifyUrl = `https://open.spotify.com/track/${spotifyId}`;
  return {
    id: `spotify_track_${spotifyId}`,
    slug,
    spotifyId,
    spotifyUri: `spotify:track:${spotifyId}`,
    spotifyUrl,
    spotifyEmbedUrl: `https://open.spotify.com/embed/track/${spotifyId}?utm_source=oembed`,
    title,
    artist,
    coverUrl,
    fallbackCoverUrl,
    externalUrl: spotifyUrl,
    origin: "spotify",
  };
}

export const tracks: Record<string, TrackRef> = {
  euphoria: spotifyTrack({
    spotifyId: "77DRzu7ERs0TX3roZcre7Q",
    slug: "euphoria",
    title: "euphoria",
    artist: "Kendrick Lamar",
    coverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02bdc727cfc07ddbabf925bb2f",
    fallbackCoverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02bdc727cfc07ddbabf925bb2f",
  }),
  gone: spotifyTrack({
    spotifyId: "1hz7SRTGUNAtIQ46qiNv2p",
    slug: "gone",
    title: "GONE, GONE / THANK YOU",
    artist: "Tyler, The Creator",
    coverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0230a635de2bb0caa4e26f6abb",
    fallbackCoverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0230a635de2bb0caa4e26f6abb",
  }),
  chamber: spotifyTrack({
    spotifyId: "5oeOWXjH8NZFOWP0SpSXqV",
    slug: "chamber",
    title: "Chamber of Reflection",
    artist: "Mac DeMarco",
    coverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e028b221f2ccf777ae0d4b0db50",
    fallbackCoverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e028b221f2ccf777ae0d4b0db50",
  }),
  iykyk: spotifyTrack({
    spotifyId: "6bGwKHXHNLmTy6yt147FPh",
    slug: "iykyk",
    title: "If You Know You Know",
    artist: "Pusha T",
    coverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e029eef4d0de1fb61ac8e6ad50c",
    fallbackCoverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e029eef4d0de1fb61ac8e6ad50c",
  }),
  nissan: spotifyTrack({
    spotifyId: "53z0OoN3wkWZW73OtjsuHJ",
    slug: "nissan-altima",
    title: "NISSAN ALTIMA",
    artist: "Doechii",
    coverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e022513ae79437fb2204c4115c3",
    fallbackCoverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e022513ae79437fb2204c4115c3",
  }),
  lvbag: spotifyTrack({
    spotifyId: "4mOfeGMIe82IXH7zJ5Dga9",
    slug: "lv-bag",
    title: "LV Bag",
    artist: "Don Toliver, Speedy, j-hope, Pharrell Williams",
    coverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e028e53d91ae9735b67c78c8c3f",
    fallbackCoverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e028e53d91ae9735b67c78c8c3f",
  }),
  likehim: spotifyTrack({
    spotifyId: "1O4HGh8H0drMByM6psjp8y",
    slug: "like-him",
    title: "Like Him",
    artist: "Tyler, The Creator",
    coverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02c5a1610726a08f3892e4dca9",
    fallbackCoverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02c5a1610726a08f3892e4dca9",
  }),
  fein: spotifyTrack({
    spotifyId: "42VsgItocQwOQC3XWZ8JNA",
    slug: "fein",
    title: "FE!N",
    artist: "Travis Scott, Playboi Carti",
    coverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0204481c826dd292e5e4983b3f",
    fallbackCoverUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0204481c826dd292e5e4983b3f",
  }),
};

export const feedEvents: TasteFeedEvent[] = [
  {
    id: "ev_now_playing",
    tastemaker: travis,
    track: tracks.euphoria,
    kind: "now_playing",
    timestampLabel: "2 min ago",
    humanSignal: "Live - 17K fans are also here",
    secondarySignal: "Track metadata and playback are real Spotify embeds",
    origin: "illustrative",
  },
  {
    id: "ev_on_repeat",
    tastemaker: travis,
    track: tracks.gone,
    kind: "on_repeat",
    timestampLabel: "20 min ago",
    humanSignal: "Played 11 times this week",
    secondarySignal: "Repeated listening becomes a trusted signal",
    origin: "illustrative",
  },
  {
    id: "ev_new_discovery",
    tastemaker: travis,
    track: tracks.chamber,
    kind: "new_discovery",
    timestampLabel: "5h ago",
    humanSignal: "First saved by Travis today",
    secondarySignal: "First-save signal shown as proposed product behavior",
    origin: "illustrative",
  },
  {
    id: "ev_deep_cut",
    tastemaker: travis,
    track: tracks.iykyk,
    kind: "deep_cut",
    timestampLabel: "Yesterday",
    humanSignal: "Resurfaced after 4 months",
    secondarySignal: "Deep cuts can re-enter discovery through taste",
    origin: "illustrative",
  },
];

export const onRepeatTracks: TrackSignal[] = [
  { track: tracks.euphoria, signal: "Travis listened to this 14 times this week", metric: "14 plays" },
  { track: tracks.gone, signal: "Kept returning after late-night sessions", metric: "11 plays" },
  { track: tracks.nissan, signal: "High repeat velocity in the last 7 days", metric: "8 plays" },
  { track: tracks.iykyk, signal: "Deep cut resurfaced from older saves", metric: "6 plays" },
];

export const recentlyDiscoveredTracks: TrackSignal[] = [
  { track: tracks.chamber, signal: "First appeared in the Taste signal today", metric: "new" },
  { track: tracks.lvbag, signal: "Saved after one listen", metric: "saved" },
  { track: tracks.likehim, signal: "Added to a private session", metric: "private" },
  { track: tracks.nissan, signal: "Fast repeat curve after first save", metric: "rising" },
  { track: tracks.fein, signal: "Inspired-by mix source material", metric: "mix" },
];

export const inspiredMixes: InspiredMix[] = [
  {
    id: "mix_rodeo",
    title: "Rodeo Radio",
    subtitle: "A living mix from Travis's opt-in taste signal",
    coverUrl: tracks.fein.coverUrl,
    fallbackCoverUrl: tracks.fein.coverUrl,
    href: "/player/fein",
    externalUrl: tracks.fein.spotifyUrl,
    origin: "illustrative",
  },
  {
    id: "mix_astroworld",
    title: "Astroworld Vibes",
    subtitle: "With melodic rap, Houston textures and left-field discoveries",
    coverUrl: tracks.fein.coverUrl,
    fallbackCoverUrl: tracks.fein.coverUrl,
    href: "/player/fein",
    externalUrl: tracks.fein.spotifyUrl,
    origin: "illustrative",
  },
];

export const hubMetrics = {
  tasteFollowers: "4.2M",
  tasteFollowersDelta: "+24% this month",
  influenceStreams: "38.1M",
  influenceStreamsDelta: "+18% this month",
  discoverySaves: "6.8M",
  discoverySavesNote: "High-intent signal",
  estimatedEarnings: "$18,420",
  origin: "illustrative" as const,
};

export const topInfluencedTracks: HubInfluencedTrack[] = [
  { track: tracks.nissan, influenceStreams: "2.8M", share: 94 },
  { track: tracks.fein, influenceStreams: "2.2M", share: 73 },
  { track: tracks.lvbag, influenceStreams: "1.7M", share: 54 },
  { track: tracks.likehim, influenceStreams: "1.4M", share: 43 },
];

export const privacyControls = [
  {
    id: "share",
    title: "Opt-in sharing",
    description: "No listening is public until Taste is explicitly enabled.",
    enabled: true,
  },
  {
    id: "hide-track",
    title: "Hide track",
    description: "Remove an individual track from your public Taste profile.",
    enabled: true,
  },
  {
    id: "hide-artist",
    title: "Hide artist",
    description: "Never publish listening activity for selected artists.",
    enabled: false,
  },
  {
    id: "delay",
    title: "Delay by 24h",
    description: "Publish activity after a delay instead of in real time.",
    enabled: true,
  },
  {
    id: "selected",
    title: "Selected sessions only",
    description: "Show only listening sessions explicitly marked for Taste.",
    enabled: false,
  },
  {
    id: "sponsor",
    title: "Sponsor labeling",
    description: "Paid or promoted Taste placements must be labeled.",
    enabled: true,
  },
];
