"use client";

import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { getTrackBySlug } from "@/lib/format";
import { tracks, travis } from "@/lib/mock-data";

export function PlayerExperience({ trackSlug }: { trackSlug: string }) {
  const track = getTrackBySlug(tracks, trackSlug);
  const { showToast } = useToast();

  return (
    <main className="page playerPage">
      <div className="playerTop">
        <Link className="iconButton" href="/feed" aria-label="Back to Taste Feed">
          <Icon name="feed" />
        </Link>
        <div className="eyebrow">Playing from Taste</div>
        <button
          className="iconButton"
          type="button"
          aria-label="Open player options"
          onClick={() => showToast("Player options would open the Spotify track menu.")}
        >
          <Icon name="more" />
        </button>
      </div>

      <section className="playerHeroPanel">
        <TrackArtwork
          src={track.coverUrl}
          fallbackSrc={track.fallbackCoverUrl}
          alt={`${track.title} album cover from Spotify`}
          className="playerCover"
        />

        <div className="playerHeroDetails">
          <section className="playerTitleRow">
            <div>
              <h1>{track.title}</h1>
              <p className="lead" style={{ margin: "8px 0 0" }}>{track.artist}</p>
            </div>
            <button
              className="iconButton"
              type="button"
              aria-label={`Save ${track.title}`}
              onClick={() => showToast(`Saved intent recorded for ${track.title}`)}
            >
              <Icon name="save" />
            </button>
          </section>

          <section className="attributionCard">
            <div className="attributionAvatar">
              <img
                className="avatarImage"
                src={travis.avatarUrl}
                alt="Travis Scott artist image from Spotify"
                onError={event => {
                  if (travis.fallbackAvatarUrl) event.currentTarget.src = travis.fallbackAvatarUrl;
                }}
              />
            </div>
            <div>
              <div>
                Discovered through <strong style={{ color: "var(--spotify-green-soft)" }}>{travis.name}</strong>
              </div>
              <p className="finePrint" style={{ margin: "4px 0 0" }}>
                This play uses Spotify's official embed. Influence Streams are a proposed attribution layer.
                <span className="dataPill" style={{ marginLeft: 8 }}>
                  <Icon name="info" size={14} />
                  real track
                </span>
              </p>
            </div>
          </section>

          <section className="spotifyPlayerPanel" aria-label="Real Spotify player">
            <SpotifyEmbed src={track.spotifyEmbedUrl} title={`Spotify Embed: ${track.title}`} size="large" />
            <div className="playerActionRow">
              <a className="btn btnPrimary" href={track.spotifyUrl} target="_blank" rel="noreferrer">
                <Icon name="external" />
                Open in Spotify
              </a>
              <button
                className="btn btnGhost"
                type="button"
                onClick={() => showToast(`Repeat intent recorded for ${track.title}`)}
              >
                <Icon name="feed" />
                Add to Taste loop
              </button>
            </div>
            <p className="finePrint">
              Playback, cover art and track metadata are served by Spotify's embed. Full-track availability depends on
              the viewer's Spotify session inside the iframe.
            </p>
          </section>
        </div>
      </section>

      <section className="panel whyCard">
        <div className="sectionHeader" style={{ marginBottom: 0 }}>
          <h2>Why you're seeing this</h2>
          <DemoBadge>Real Spotify track + proposed attribution</DemoBadge>
        </div>
        <div className="whyList">
          <button className="whyItem whyButton" type="button" onClick={() => showToast("Taste repeat signal opened.")}>
            <span className="whyIcon">
              <Icon name="play" />
            </span>
            <span>{travis.name} has played this 14 times this week.</span>
          </button>
          <button className="whyItem whyButton" type="button" onClick={() => showToast("Live fan cohort opened.")}>
            <span className="whyIcon">
              <Icon name="user" />
            </span>
            <span>11K fans are listening from this Taste signal now.</span>
          </button>
          <button className="whyItem whyButton" type="button" onClick={() => showToast("Influence Streams model opened.")}>
            <span className="whyIcon">
              <Icon name="info" />
            </span>
            <span>Spotify plays remain Spotify plays; Taste adds a measurable discovery attribution path.</span>
          </button>
        </div>
      </section>
    </main>
  );
}
