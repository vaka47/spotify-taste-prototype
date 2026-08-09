"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { inspiredMixes, onRepeatTracks, recentlyDiscoveredTracks, travis } from "@/lib/mock-data";
import { recordTrackOpen } from "@/lib/prototype-events";
import { useFollowingTaste } from "@/lib/use-following-taste";
import type { TrackSignal } from "@/types/taste";

const tabs = ["Music", "Events", "Merch", "Taste"] as const;

function TrackSignalRow({ item, index }: { item: TrackSignal; index: number }) {
  const router = useRouter();
  const { showToast } = useToast();

  function openTrack() {
    recordTrackOpen(travis.id, item.track.id);
    showToast(`Attributed prototype discovery: ${item.track.title}`);
    router.push(`/player/${item.track.slug}`);
  }

  return (
    <button className="trackRow" type="button" onClick={openTrack}>
      <span className="trackNumber">{index + 1}</span>
      <TrackArtwork
        src={item.track.coverUrl}
        fallbackSrc={item.track.fallbackCoverUrl}
        alt={`${item.track.title} album cover from Spotify`}
        className="trackThumb"
      />
      <span style={{ minWidth: 0, textAlign: "left" }}>
        <span className="trackTitle">{item.track.title}</span>
        <span className="trackArtist">{item.track.artist}</span>
      </span>
      <span className="signalPill">{item.metric}</span>
      <span className="btn btnSubtle">Open</span>
    </button>
  );
}

export default function TravisTastePage() {
  const { following, toggle } = useFollowingTaste(travis.id);
  const { showToast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Taste");

  function toggleFollow() {
    toggle();
    showToast(following ? "Unfollowed Travis's Taste" : "Following Travis's Taste");
  }

  return (
    <main className="page">
      <section className="profileHero">
        <div className="profileIdentity">
          <div className="profileAvatar">
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
            <DemoBadge>Spotify artist entity</DemoBadge>
            <h1 className="profileTitle">
              {travis.name}
              <span className="verifiedDot" title="Verified profile">
                <Icon name="check" size={15} />
              </span>
            </h1>
            <p className="muted">64.7M monthly listeners - {travis.role}</p>
          </div>
        </div>

        <article className="followCard">
          <div className="sectionHeader" style={{ marginBottom: 14 }}>
            <div>
              <h2>Follow Travis's Taste</h2>
              <p className="muted">See what Travis is listening to and discover music through his opt-in listening activity.</p>
            </div>
            <div className="followVisual">
              <img
                className="avatarImage"
                src={travis.avatarUrl}
                alt=""
                onError={event => {
                  if (travis.fallbackAvatarUrl) event.currentTarget.src = travis.fallbackAvatarUrl;
                }}
              />
            </div>
          </div>
          <div className="buttonRow">
            <button className={`btn ${following ? "btnGhost" : "btnPrimary"}`} type="button" onClick={toggleFollow}>
              <Icon name={following ? "check" : "taste"} />
              {following ? "Following Taste" : "Follow Taste"}
            </button>
            {travis.spotifyUrl ? (
              <a className="btn btnSubtle" href={travis.spotifyUrl} target="_blank" rel="noreferrer">
                <Icon name="external" />
                Open artist
              </a>
            ) : null}
          </div>
        </article>
      </section>

      <nav className="tabBar" aria-label="Tastemaker profile tabs">
        {tabs.map(tab => (
          <button
            className={activeTab === tab ? "active" : ""}
            type="button"
            aria-pressed={activeTab === tab}
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              showToast(`${tab} tab selected`);
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="section">
        <div className="sectionHeader">
          <h2>On Repeat This Week</h2>
          <DemoBadge>Illustrative activity</DemoBadge>
        </div>
        <div className="trackList">
          {onRepeatTracks.map((item, index) => (
            <TrackSignalRow item={item} index={index} key={item.track.id} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <h2>Recently Discovered</h2>
          <button className="textButton" type="button" onClick={() => showToast("Full discovery history opened.")}>
            See all
          </button>
        </div>
        <div className="shelf">
          {recentlyDiscoveredTracks.map(item => (
            <button
              className="shelfItem"
              key={item.track.id}
              type="button"
              onClick={() => {
                recordTrackOpen(travis.id, item.track.id);
                showToast(`Opening real Spotify track: ${item.track.title}`);
                router.push(`/player/${item.track.slug}`);
              }}
            >
              <TrackArtwork
                src={item.track.coverUrl}
                fallbackSrc={item.track.fallbackCoverUrl}
                alt={`${item.track.title} album cover from Spotify`}
                className="shelfCover"
              />
              <div className="shelfTitle">{item.track.title}</div>
              <div className="shelfArtist">{item.track.artist}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <h2>Inspired by Travis</h2>
          <span className="muted">Living mixes</span>
        </div>
        <div className="mixGrid">
          {inspiredMixes.map(mix => (
            <Link className="mixCard" href={mix.href} key={mix.id}>
              <TrackArtwork
                src={mix.coverUrl}
                fallbackSrc={mix.fallbackCoverUrl}
                alt={`${mix.title} cover`}
                className="mixArtwork"
              />
              <div className="mixContent">
                <DemoBadge>Illustrative mix</DemoBadge>
                <h3>{mix.title}</h3>
                <p className="muted">{mix.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
