"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { hubMetrics, privacyControls, topInfluencedTracks } from "@/lib/mock-data";
import { recordTrackOpen } from "@/lib/prototype-events";
import { usePrototypeEventCount } from "@/lib/use-prototype-event-count";

const experiments = [
  "Spotify-funded Tastemaker Pool",
  "Taste+ add-on",
  "Premium Tastemaker subscription",
] as const;

export default function HubPage() {
  const eventCount = usePrototypeEventCount();
  const router = useRouter();
  const { showToast } = useToast();
  const [activeExperiment, setActiveExperiment] = useState<(typeof experiments)[number]>("Spotify-funded Tastemaker Pool");

  function openInfluencedTrack(trackId: string, trackSlug: string, title: string) {
    recordTrackOpen("spotify_artist_0Y5tJX1MQlPlqiwlOH1tJY", trackId);
    showToast(`Opening influenced track: ${title}`);
    router.push(`/player/${trackSlug}`);
  }

  return (
    <main className="page">
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">Tastemaker Hub</div>
          <h1 className="pageTitle">Influence, made measurable.</h1>
          <p className="lead">For artists and verified cultural profiles. All economics here are a proposed product model.</p>
        </div>
        <DemoBadge>Illustrative economics - not Spotify data</DemoBadge>
      </div>

      <section className="panel">
        <div className="sectionHeader" style={{ marginBottom: 0 }}>
          <div>
            <div className="metricLabel">
              Taste followers
              <button className="inlineIconButton" type="button" aria-label="Taste followers details" onClick={() => showToast("Followers of the proposed Taste surface.")}>
                <Icon name="info" size={17} />
              </button>
            </div>
            <div className="metricNumber">{hubMetrics.tasteFollowers}</div>
            <div className="metricDelta">{hubMetrics.tasteFollowersDelta}</div>
          </div>
          <DemoBadge>Illustrative profile metric</DemoBadge>
        </div>
        <div className="hubChart" aria-label="Illustrative Taste followers growth chart">
          <div className="chartFrame">
            <svg viewBox="0 0 620 220" role="img" aria-label="Illustrative follower growth line">
              <defs>
                <linearGradient id="tasteArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1ed760" stopOpacity=".34" />
                  <stop offset="100%" stopColor="#1ed760" stopOpacity=".02" />
                </linearGradient>
              </defs>
              <path
                d="M0 182 C40 166 58 150 92 146 C118 142 132 126 166 125 C198 124 216 115 248 110 C282 104 304 88 338 92 C366 95 382 72 416 67 C452 62 464 49 498 47 C530 45 548 29 584 24 C600 21 610 15 620 10 L620 220 L0 220 Z"
                fill="url(#tasteArea)"
              />
              <path
                d="M0 182 C40 166 58 150 92 146 C118 142 132 126 166 125 C198 124 216 115 248 110 C282 104 304 88 338 92 C366 95 382 72 416 67 C452 62 464 49 498 47 C530 45 548 29 584 24 C600 21 610 15 620 10"
                fill="none"
                stroke="#1ed760"
                strokeLinecap="round"
                strokeWidth="5"
              />
            </svg>
            <div className="chartMonths">
              <span>Apr 1</span>
              <span>Apr 15</span>
              <span>May 1</span>
              <span>May 15</span>
              <span>May 31</span>
            </div>
          </div>
          <div className="chartAxis">
            <span>4.5M</span>
            <span>3.0M</span>
            <span>1.5M</span>
          </div>
        </div>
      </section>

      <section className="grid4 section" aria-label="Hub metrics">
        <article className="metricCard">
          <div className="metricLabel">
            Influence Streams
            <button className="inlineIconButton" type="button" aria-label="Influence Streams details" onClick={() => showToast("Qualified discovery attribution: play, save, repeat and follow.")}>
              <Icon name="info" size={17} />
            </button>
          </div>
          <div className="metricNumber">{hubMetrics.influenceStreams}</div>
          <div className="metricDelta">{hubMetrics.influenceStreamsDelta}</div>
        </article>
        <article className="metricCard">
          <div className="metricLabel">
            Discovery saves
            <button className="inlineIconButton" type="button" aria-label="Discovery saves details" onClick={() => showToast("High-intent saves after a Taste-sourced first listen.")}>
              <Icon name="save" size={17} />
            </button>
          </div>
          <div className="metricNumber">{hubMetrics.discoverySaves}</div>
          <div className="metricDelta">{hubMetrics.discoverySavesNote}</div>
        </article>
        <article className="metricCard">
          <div className="metricLabel">
            Browser-local events
            <button className="inlineIconButton" type="button" aria-label="Browser-local event details" onClick={() => showToast("Local events prove the click path only.")}>
              <Icon name="feed" size={17} />
            </button>
          </div>
          <div className="metricNumber">{eventCount}</div>
          <div className="metricDelta">Recorded in this browser</div>
        </article>
        <article className="metricCard">
          <div className="metricLabel">
            Official Spotify data
            <button className="inlineIconButton" type="button" aria-label="Official Spotify data details" onClick={() => showToast("Tracks and embeds are real; hub metrics are proposed.")}>
              <Icon name="info" size={17} />
            </button>
          </div>
          <div className="metricNumber">0</div>
          <div className="metricDelta">public hub metrics are mock</div>
        </article>
      </section>

      <section className="grid2 section">
        <article className="panel">
          <div className="sectionHeader">
            <h2>Top tracks influenced</h2>
            <DemoBadge>Proposed Influence Streams metric</DemoBadge>
          </div>
          <div className="influencedList">
            {topInfluencedTracks.map(item => (
              <button
                className="influencedTrack"
                type="button"
                key={item.track.id}
                onClick={() => openInfluencedTrack(item.track.id, item.track.slug, item.track.title)}
              >
                <TrackArtwork
                  src={item.track.coverUrl}
                  fallbackSrc={item.track.fallbackCoverUrl}
                  alt={`${item.track.title} album cover from Spotify`}
                  className="trackThumb"
                />
                <div style={{ minWidth: 0 }}>
                  <div className="trackTitle">
                    {item.track.artist} - {item.track.title}
                  </div>
                  <div className="bar" aria-hidden="true">
                    <span style={{ width: `${item.share}%` }} />
                  </div>
                </div>
                <strong>{item.influenceStreams}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="earningsCard">
          <DemoBadge>Illustrative economics - not Spotify data</DemoBadge>
          <div className="eyebrow" style={{ marginTop: 16 }}>Estimated Taste Earnings</div>
          <div className="earningsNumber">{hubMetrics.estimatedEarnings}</div>
          <p className="muted">
            Hypothetical monthly share from a Spotify-funded Tastemaker Pool. This does not take money from the
            rights-holder royalty assigned to the discovered track.
          </p>
          <div className="modelSteps">
            <div className="modelStep">
              <span className="stepNumber">1</span>
              <div>
                <strong>Spotify funds a Tastemaker Pool</strong>
                <p className="finePrint">A separate pool, outside artist royalty accounting.</p>
              </div>
            </div>
            <div className="modelStep">
              <span className="stepNumber">2</span>
              <div>
                <strong>Verified influence creates a pool share</strong>
                <p className="finePrint">Qualified discovery can include first play, save, repeat and artist follow.</p>
              </div>
            </div>
            <div className="modelStep">
              <span className="stepNumber">3</span>
              <div>
                <strong>Tastemaker receives earnings</strong>
                <p className="finePrint">Only as a proposed pilot with fraud controls and disclosure rules.</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid2 section">
        <article className="panel">
          <div className="sectionHeader">
            <h2>Monetization experiments</h2>
            <DemoBadge>Secondary tests</DemoBadge>
          </div>
          <div className="experimentList">
            <button
              className="experimentRow"
              type="button"
              aria-pressed={activeExperiment === experiments[0]}
              onClick={() => {
                setActiveExperiment(experiments[0]);
                showToast(`${experiments[0]} selected`);
              }}
            >
              <span className={`radioDot ${activeExperiment === experiments[0] ? "active" : ""}`} />
              <div>
                <strong>Spotify-funded Tastemaker Pool</strong>
                <p className="finePrint">Recommended first model: reward verified influence while keeping Taste broadly accessible.</p>
              </div>
            </button>
            <button
              className="experimentRow"
              type="button"
              aria-pressed={activeExperiment === experiments[1]}
              onClick={() => {
                setActiveExperiment(experiments[1]);
                showToast(`${experiments[1]} selected`);
              }}
            >
              <span className={`radioDot ${activeExperiment === experiments[1] ? "active" : ""}`} />
              <div>
                <strong>Taste+ add-on</strong>
                <p className="finePrint">Optional paid tier for deeper social discovery, living mixes and richer Taste history.</p>
              </div>
            </button>
            <button
              className="experimentRow"
              type="button"
              aria-pressed={activeExperiment === experiments[2]}
              onClick={() => {
                setActiveExperiment(experiments[2]);
                showToast(`${experiments[2]} selected`);
              }}
            >
              <span className={`radioDot ${activeExperiment === experiments[2] ? "active" : ""}`} />
              <div>
                <strong>Premium Tastemaker subscription</strong>
                <p className="finePrint">High upside, but stronger authenticity risk. Keep as a later experiment.</p>
              </div>
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="sectionHeader">
            <h2>Controls</h2>
            <DemoBadge>Trust guardrails</DemoBadge>
          </div>
          <div className="trackList">
            {privacyControls.slice(1, 5).map(control => (
              <Link className="privacyRow" href="/privacy" key={control.id}>
                <span className="privacyIcon">
                  <Icon name={control.id === "delay" ? "clock" : control.id === "selected" ? "external" : "hide"} />
                </span>
                <div>
                  <strong>{control.title}</strong>
                  <p className="finePrint">{control.description}</p>
                </div>
                <span className="muted">&gt;</span>
              </Link>
            ))}
          </div>
          <p className="finePrint" style={{ marginTop: 18, textAlign: "center" }}>
            Paid or promoted Taste placements must be labeled.
          </p>
        </article>
      </section>
    </main>
  );
}
