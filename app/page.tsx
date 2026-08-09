import Link from "next/link";
import { AvatarImage } from "@/components/AvatarImage";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { feedEvents, hubMetrics, inspiredMixes, travis } from "@/lib/mock-data";

export default function Home() {
  const heroEvent = feedEvents[0];

  return (
    <main className="page">
      <div className="grid2">
        <section>
          <div className="eyebrow">Spotify Taste - product concept</div>
          <h1 className="heroTitle">Listen through people you trust.</h1>
          <p className="lead">
            A pitch-ready social discovery layer where fans follow the opt-in listening activity of artists, athletes,
            actors, DJs, creators and other cultural tastemakers.
          </p>
          <div className="buttonRow">
            <Link className="btn btnPrimary" href="/feed">
              <Icon name="feed" />
              Explore Taste Feed
            </Link>
            <Link className="btn btnGhost" href="/my-taste">
              <Icon name="user" />
              Connect My Taste
            </Link>
          </div>
          <div className="section">
            <div className="grid3">
              <article className="metricCard">
                <div className="metricLabel">Follow Taste</div>
                <div className="metricNumber">1</div>
                <div className="metricDelta">new follow relationship</div>
              </article>
              <article className="metricCard">
                <div className="metricLabel">Influence Streams</div>
                <div className="metricNumber">{hubMetrics.influenceStreams}</div>
                <div className="metricDelta">illustrative metric</div>
              </article>
              <article className="metricCard">
                <div className="metricLabel">Tastemaker Pool</div>
                <div className="metricNumber">{hubMetrics.estimatedEarnings}</div>
                <div className="metricDelta">hypothetical earnings</div>
              </article>
            </div>
          </div>
        </section>

        <aside className="panel">
          <div className="sectionHeader">
            <div>
              <DemoBadge>Spotify artist entity</DemoBadge>
              <h2 style={{ marginTop: 12 }}>{travis.name}</h2>
              <p className="muted">{travis.role}</p>
            </div>
            <div className="feedAvatar" aria-hidden="true">
              <AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="" />
            </div>
          </div>
          <Link className="feedCard previewFeedCard" href="/player/euphoria">
            <div className="feedAvatarWrap">
              <div className="feedAvatar">
                <AvatarImage
                  src={travis.avatarUrl}
                  fallbackSrc={travis.fallbackAvatarUrl}
                  alt={`${travis.name} artist image from Spotify`}
                />
              </div>
              <span className="liveDot" aria-hidden="true" />
            </div>
            <div className="feedText">
              <div className="feedMeta">
                <strong>{travis.name}</strong>
                <span>{heroEvent.timestampLabel}</span>
                <span className="statusPill">Now playing</span>
              </div>
              <div className="feedTrack">{heroEvent.track.title}</div>
              <div className="feedArtist">{heroEvent.track.artist}</div>
              <div className="feedSignal">
                <Icon name="feed" size={18} />
                {heroEvent.humanSignal}
              </div>
            </div>
            <TrackArtwork
              src={heroEvent.track.coverUrl}
              fallbackSrc={heroEvent.track.fallbackCoverUrl}
              alt={`${heroEvent.track.title} album cover from Spotify`}
              className="feedCover"
            />
          </Link>
          <div className="section">
            <h3>Demo sequence</h3>
            <div className="modelSteps">
              <div className="modelStep">
                <span className="stepNumber">1</span>
                <p className="finePrint">Open a Taste Feed card and create a local attribution event.</p>
              </div>
              <div className="modelStep">
                <span className="stepNumber">2</span>
                <p className="finePrint">Press play in the real Spotify embed on the Playing from Taste screen.</p>
              </div>
              <div className="modelStep">
                <span className="stepNumber">3</span>
                <p className="finePrint">Open the Hub and show the prototype event counter plus illustrative economics.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">Core product surfaces</div>
            <h2>Follow people, discover tracks, measure influence.</h2>
          </div>
          <DemoBadge>Not Spotify data</DemoBadge>
        </div>
        <div className="grid3">
          <Link className="panel" href="/tastemaker/travis-scott">
            <Icon name="taste" />
            <h3>Follow Taste</h3>
            <p className="muted">A verified person gets a controlled Taste surface on Spotify.</p>
          </Link>
          <Link className="panel" href="/taste/ivan">
            <Icon name="spark" />
            <h3>Public Taste</h3>
            <p className="muted">Follow a real person's public listening history with notes, comments and notifications.</p>
          </Link>
          <Link className="panel" href="/player/euphoria">
            <Icon name="player" />
            <h3>Playing from Taste</h3>
            <p className="muted">The attribution card explains why a fan is hearing a track.</p>
          </Link>
          <Link className="panel" href="/privacy">
            <Icon name="privacy" />
            <h3>Trust controls</h3>
            <p className="muted">Opt-in sharing, hiding, delay, selected sessions and sponsored labels.</p>
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">Inspired by Travis</div>
            <h2>Living mixes built from a taste signal.</h2>
          </div>
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
