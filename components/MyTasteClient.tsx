"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { spotifyErrorMessage } from "@/lib/format";
import { tracks } from "@/lib/mock-data";
import { encodeSnapshot, type PublicTasteEvent, type TasteSnapshot } from "@/lib/social-taste";
import {
  beginSpotifyLogin,
  disconnectSpotify,
  getSpotifyConfig,
  getStoredSpotifyToken,
  spotifyApi,
  type SpotifyError,
} from "@/lib/spotify-pkce";

type SpotifyImage = {
  url: string;
  height?: number;
  width?: number;
};

type SpotifyArtistRef = {
  id: string;
  name: string;
  external_urls?: { spotify?: string };
};

type SpotifyTrack = {
  id: string;
  name: string;
  artists: SpotifyArtistRef[];
  album?: { images?: SpotifyImage[]; name?: string };
  external_urls?: { spotify?: string };
};

type SpotifyProfile = {
  id: string;
  display_name?: string;
  product?: string;
  country?: string;
  images?: SpotifyImage[];
};

type RecentlyPlayedResponse = {
  items: Array<{ track: SpotifyTrack; played_at: string }>;
};

type TopTracksResponse = {
  items: SpotifyTrack[];
};

type TopArtistsResponse = {
  items: SpotifyArtistRef[];
};

type LoadState = "disconnected" | "loading" | "connected" | "error";

function imageForTrack(track: SpotifyTrack) {
  return track.album?.images?.[1]?.url ?? track.album?.images?.[0]?.url;
}

function artists(track: SpotifyTrack) {
  return track.artists.map(artist => artist.name).join(", ");
}

function SpotifyRow({ track, label }: { track: SpotifyTrack; label: string }) {
  return (
    <div className="spotifyRow">
      <TrackArtwork src={imageForTrack(track)} alt={`${track.name} album cover from Spotify`} className="spotifyThumb" />
      <div style={{ minWidth: 0 }}>
        <div className="trackTitle">{track.name}</div>
        <div className="trackArtist">{artists(track) || "Spotify artist"}</div>
      </div>
      {track.external_urls?.spotify ? (
        <a className="iconButton" href={track.external_urls.spotify} target="_blank" rel="noreferrer" aria-label={`Open ${track.name} in Spotify`}>
          <Icon name="external" />
        </a>
      ) : (
        <span className="dataPill">{label}</span>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="spotifyList" aria-label="Loading Spotify rows">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="spotifyRow" key={index}>
          <div className="spotifyThumb skeleton" />
          <div>
            <div className="skeleton" style={{ width: 180, height: 16 }} />
            <div className="skeleton" style={{ width: 128, height: 12, marginTop: 8 }} />
          </div>
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 42 }} />
        </div>
      ))}
    </div>
  );
}

export function MyTasteClient() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [state, setState] = useState<LoadState>("disconnected");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [recentTracks, setRecentTracks] = useState<SpotifyTrack[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [topArtists, setTopArtists] = useState<SpotifyArtistRef[]>([]);
  const [tasteNote, setTasteNote] = useState("Worth sharing because this is what I actually listened to, not a hand-picked playlist.");
  const [shareUrl, setShareUrl] = useState("");
  const notifiedConnected = useRef(false);

  const config = useMemo(() => getSpotifyConfig(), []);
  const configured = Boolean(config.clientId && config.redirectUri);

  async function loadSpotify() {
    setState("loading");
    setError("");
    try {
      const [me, recent, top] = await Promise.all([
        spotifyApi<SpotifyProfile>("/me"),
        spotifyApi<RecentlyPlayedResponse>("/me/player/recently-played?limit=20"),
        spotifyApi<TopTracksResponse>("/me/top/tracks?time_range=short_term&limit=20"),
      ]);
      setProfile(me);
      setRecentTracks(recent.items.map(item => item.track).filter(Boolean));
      setTopTracks(top.items);
      setState("connected");
      try {
        const artistsResponse = await spotifyApi<TopArtistsResponse>("/me/top/artists?time_range=short_term&limit=12");
        setTopArtists(artistsResponse.items);
      } catch {
        setTopArtists([]);
      }
    } catch (caught) {
      const spotifyError = caught as SpotifyError;
      setState("error");
      setError(spotifyError.status ? spotifyErrorMessage(spotifyError.status) : spotifyError.message);
    }
  }

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) {
      setState("error");
      setError(
        authError === "access_denied"
          ? "Spotify authorization was denied. Demo mode still works without login."
          : `Spotify authorization failed: ${authError}`,
      );
      return;
    }
    if (getStoredSpotifyToken()) {
      void loadSpotify();
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("connected") === "1" && !notifiedConnected.current) {
      notifiedConnected.current = true;
      showToast("Spotify connected. Showing your authorized listening data.");
    }
  }, [searchParams, showToast]);

  async function connect() {
    if (!configured) {
      setState("error");
      setError("Spotify OAuth environment is not configured. Set NEXT_PUBLIC_SPOTIFY_CLIENT_ID and NEXT_PUBLIC_SPOTIFY_REDIRECT_URI.");
      return;
    }
    try {
      await beginSpotifyLogin();
    } catch (caught) {
      const err = caught as Error;
      setState("error");
      setError(err.message);
    }
  }

  function disconnect() {
    disconnectSpotify();
    setProfile(null);
    setRecentTracks([]);
    setTopTracks([]);
    setTopArtists([]);
    setShareUrl("");
    setError("");
    setState("disconnected");
    showToast("Spotify disconnected. Local token bundle cleared.");
  }

  function handleFromProfile(user: SpotifyProfile | null) {
    const raw = user?.display_name || user?.id || "my-taste";
    const safe = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return safe || "my-taste";
  }

  function toPublicEvent(track: SpotifyTrack, index: number, source: "recent" | "top"): PublicTasteEvent {
    const spotifyUrl = track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`;
    return {
      id: `published_${source}_${track.id}_${index}`,
      track: {
        id: `spotify_track_${track.id}`,
        title: track.name,
        artist: artists(track) || "Spotify artist",
        coverUrl: imageForTrack(track) || tracks.euphoria.coverUrl,
        fallbackCoverUrl: tracks.euphoria.fallbackCoverUrl,
        spotifyUrl,
        spotifyEmbedUrl: `https://open.spotify.com/embed/track/${track.id}?utm_source=oembed`,
      },
      listenedAt: source === "recent" ? `${index + 1} in recent listening` : `top ${index + 1} this month`,
      signal: source === "recent" ? "Real recent play" : "Real top-track signal",
      authorComment: tasteNote.trim() || "Published from my opt-in Spotify Taste snapshot.",
      influenceStreams: source === "recent" ? "preview" : "top signal",
      discoverySaves: "share link",
      repeatRate: source === "recent" ? "recent" : "top",
    };
  }

  async function publishSnapshot() {
    const sourceTracks = recentTracks.length > 0 ? recentTracks.slice(0, 6) : topTracks.slice(0, 6);
    if (sourceTracks.length === 0) {
      showToast("Connect Spotify or wait until tracks load before publishing.");
      return;
    }
    const source = recentTracks.length > 0 ? "recent" : "top";
    const snapshot: TasteSnapshot = {
      version: 1,
      handle: handleFromProfile(profile),
      name: connectedName,
      role: "Opt-in Spotify listener",
      bio: "A public Taste snapshot generated from my authorized Spotify data. Shared by link only.",
      avatarUrl: profile?.images?.[0]?.url,
      tasteNote,
      generatedAt: new Date().toISOString(),
      events: sourceTracks.map((track, index) => toPublicEvent(track, index, source)),
    };
    const encoded = encodeSnapshot(snapshot);
    const nextUrl = `${window.location.origin}/taste/${snapshot.handle}?snapshot=${encoded}`;
    setShareUrl(nextUrl);
    try {
      await navigator.clipboard.writeText(nextUrl);
      showToast("Public Taste link copied.");
    } catch {
      showToast("Public Taste link generated.");
    }
  }

  const connectedName = profile?.display_name || profile?.id || "Spotify user";

  return (
    <main className="page">
      <div className="myTasteHeader">
        <div>
          <div className="eyebrow">My Taste</div>
          <h1 className="pageTitle">Your real Spotify signal - when connected.</h1>
          <p className="lead">
            This route uses Authorization Code with PKCE and can only display the currently authorized user's own Spotify
            data.
          </p>
        </div>
        {state === "connected" ? (
          <button className="btn btnGhost" type="button" onClick={disconnect}>
            Disconnect
          </button>
        ) : (
          <button className="btn btnPrimary" type="button" onClick={connect}>
            <Icon name="user" />
            Connect Spotify
          </button>
        )}
      </div>

      <section className="panel section">
        <div className="sectionHeader">
          <div>
            <DemoBadge>{state === "connected" ? "Authorized Spotify data" : "Disconnected demo state"}</DemoBadge>
            <h2 style={{ marginTop: 12 }}>{state === "connected" ? connectedName : "Demo mode is active"}</h2>
            <p className="muted">
              {state === "connected"
                ? "Recent and top listening below came from Spotify for this authorized account."
                : "The full public concept works without login. Spotify auth is an enhancement for allowlisted test users."}
            </p>
          </div>
          <span className="dataPill">
            <Icon name="privacy" size={16} />
            No client secret
          </span>
        </div>
        <p className="finePrint">
          Redirect URI: {config.redirectUri || "not configured"} - Scopes: user-read-recently-played, user-top-read,
          user-read-private.
        </p>
      </section>

      {state === "error" ? (
        <section className="errorState section" role="alert">
          <strong>Spotify connection needs attention</strong>
          <p>{error}</p>
          <div className="buttonRow">
            <button className="btn btnPrimary" type="button" onClick={connect}>
              Try again
            </button>
            <button className="btn btnSubtle" type="button" onClick={disconnect}>
              Clear local token
            </button>
          </div>
        </section>
      ) : null}

      {state === "loading" ? (
        <section className="spotifyGrid section">
          <article className="panel">
            <h2>Recently played</h2>
            <SkeletonList />
          </article>
          <article className="panel">
            <h2>Top tracks - short term</h2>
            <SkeletonList />
          </article>
        </section>
      ) : null}

      {state === "connected" ? (
        <>
        <section className="publishPanel section">
          <div>
            <DemoBadge>Publish opt-in Taste</DemoBadge>
            <h2 style={{ marginTop: 12 }}>Create a public Taste link for followers.</h2>
            <p className="muted">
              This turns your own authorized Spotify signal into a shareable public profile. It includes track metadata,
              Spotify embeds and your comment, but never includes OAuth tokens.
            </p>
          </div>
          <div className="publishControls">
            <label htmlFor="taste-note">Comment followers will see</label>
            <textarea
              id="taste-note"
              value={tasteNote}
              onChange={event => setTasteNote(event.target.value)}
              placeholder="Tell followers why this listen matters..."
            />
            <button className="btn btnPrimary" type="button" onClick={publishSnapshot}>
              <Icon name="spark" />
              Publish Taste snapshot
            </button>
            {shareUrl ? (
              <a className="shareUrlBox" href={shareUrl} target="_blank" rel="noreferrer">
                {shareUrl}
              </a>
            ) : null}
          </div>
        </section>

        <section className="spotifyGrid section">
          <article className="panel">
            <div className="sectionHeader">
              <h2>Recently played</h2>
              <DemoBadge>Spotify data</DemoBadge>
            </div>
            {recentTracks.length > 0 ? (
              <div className="spotifyList">
                {recentTracks.map((track, index) => (
                  <SpotifyRow track={track} label="recent" key={`${track.id}-recent-${index}`} />
                ))}
              </div>
            ) : (
              <div className="emptyState">Spotify returned no recently played tracks for this account.</div>
            )}
          </article>
          <article className="panel">
            <div className="sectionHeader">
              <h2>Top tracks - short term</h2>
              <DemoBadge>Spotify data</DemoBadge>
            </div>
            {topTracks.length > 0 ? (
              <div className="spotifyList">
                {topTracks.map(track => (
                  <SpotifyRow track={track} label="top" key={`${track.id}-top`} />
                ))}
              </div>
            ) : (
              <div className="emptyState">Spotify returned no short-term top tracks for this account.</div>
            )}
          </article>
          <article className="panel">
            <div className="sectionHeader">
              <h2>Top artists - short term</h2>
              <DemoBadge>Optional Spotify data</DemoBadge>
            </div>
            {topArtists.length > 0 ? (
              <div className="experimentList">
                {topArtists.map(artist => (
                  <a
                    className="experimentRow"
                    href={artist.external_urls?.spotify || "#"}
                    target="_blank"
                    rel="noreferrer"
                    key={artist.id}
                  >
                    <span className="radioDot active" />
                    <strong>{artist.name}</strong>
                  </a>
                ))}
              </div>
            ) : (
              <div className="emptyState">Top artists are optional and may be unavailable for this test account.</div>
            )}
          </article>
        </section>
        </>
      ) : null}

      {state === "disconnected" ? (
        <>
        <section className="grid3 section">
          <article className="panel">
            <Icon name="feed" />
            <h3>Recent listening</h3>
            <p className="muted">After authorization, this panel uses `/me/player/recently-played` for your own account.</p>
          </article>
          <article className="panel">
            <Icon name="taste" />
            <h3>Top tracks</h3>
            <p className="muted">Short-term top tracks become a private preview of what an opt-in Taste signal could use.</p>
          </article>
          <article className="panel">
            <Icon name="privacy" />
            <h3>Allowlisted testers</h3>
            <p className="muted">Spotify Development Mode may block non-allowlisted accounts. Public demo mode remains complete.</p>
          </article>
        </section>
        <section className="panel section">
          <div className="sectionHeader">
            <div>
              <DemoBadge>Works now</DemoBadge>
              <h2>Try public Taste without Spotify login</h2>
              <p className="muted">Seeded profiles show the social product loop while real user OAuth is being configured.</p>
            </div>
          </div>
          <div className="buttonRow">
            <a className="btn btnPrimary" href="/taste/ivan">
              <Icon name="taste" />
              Open Ivan's Taste
            </a>
            <a className="btn btnSubtle" href="/notifications">
              <Icon name="info" />
              Taste inbox
            </a>
          </div>
        </section>
        </>
      ) : null}
    </main>
  );
}
