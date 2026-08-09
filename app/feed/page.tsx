"use client";

import { useState } from "react";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { TasteFeedCard } from "@/components/TasteFeedCard";
import { useToast } from "@/components/ToastProvider";
import { feedEvents } from "@/lib/mock-data";
import { usePrototypeEventCount } from "@/lib/use-prototype-event-count";

const segments = ["Following", "Artists", "Creators"] as const;

export default function FeedPage() {
  const eventCount = usePrototypeEventCount();
  const [activeSegment, setActiveSegment] = useState<(typeof segments)[number]>("Following");
  const { showToast } = useToast();

  return (
    <main className="page">
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">Taste Feed</div>
          <h1 className="pageTitle">Live and recent listening from people you follow.</h1>
          <p className="lead">
            Tap any track card to open a real Spotify embed player and create a browser-local attribution event.
          </p>
        </div>
        <DemoBadge>Real Spotify tracks</DemoBadge>
      </div>

      <div className="buttonRow" aria-label="Taste Feed segments">
        {segments.map(segment => (
          <button
            className={`btn ${activeSegment === segment ? "btnPrimary" : "btnSubtle"}`}
            type="button"
            aria-pressed={activeSegment === segment}
            key={segment}
            onClick={() => {
              setActiveSegment(segment);
              showToast(`${segment} Taste segment selected`);
            }}
          >
            {segment}
          </button>
        ))}
      </div>

      <div className="grid2 section">
        <section className="feedList" aria-label="Taste Feed events using real Spotify tracks">
          {feedEvents.map(event => (
            <TasteFeedCard event={event} key={event.id} />
          ))}
        </section>

        <aside className="sideSummary">
          <div className="panel">
            <div className="sectionHeader" style={{ marginBottom: 12 }}>
              <div>
                <DemoBadge>Prototype attribution</DemoBadge>
                <h2 style={{ marginTop: 12 }}>Local event counter</h2>
              </div>
            </div>
            <div className="summaryLine">
              <span>Track opens</span>
              <strong>{eventCount}</strong>
            </div>
            <div className="summaryLine">
              <span>Stored in browser</span>
              <strong>{eventCount > 0 ? "yes" : "waiting"}</strong>
            </div>
            <div className="summaryLine">
              <span>Spotify stream report</span>
              <strong>embed only</strong>
            </div>
            <p className="finePrint" style={{ marginTop: 16 }}>
              The counter proves the prototype attribution path. Audio playback itself is handled inside Spotify's
              official iframe embed.
            </p>
          </div>

          <div className="panel">
            <h3>What the feed demonstrates</h3>
            <div className="whyList">
              <div className="whyItem">
                <span className="whyIcon">
                  <Icon name="taste" />
                </span>
                <span>Ordinary listening becomes a controlled discovery signal.</span>
              </div>
              <div className="whyItem">
                <span className="whyIcon">
                  <Icon name="info" />
                </span>
                <span>Every public celebrity event is explicitly illustrative.</span>
              </div>
            </div>
            <div className="buttonRow" style={{ marginTop: 18 }}>
              <a className="btn btnSubtle" href="/taste/ivan">
                <Icon name="spark" />
                Open public Taste
              </a>
              <a className="btn btnSubtle" href="/notifications">
                <Icon name="info" />
                Inbox
              </a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
