"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { TasteFeedCard } from "@/components/TasteFeedCard";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { feedEvents } from "@/lib/mock-data";
import { usePrototypeEventCount } from "@/lib/use-prototype-event-count";
import { useI18n } from "@/lib/i18n";

const segments = ["Following", "Artists", "Creators"] as const;

type LiveFeedEvent = {
  id: string;
  profile: { handle: string; name: string; avatarUrl: string | null; verified: boolean };
  track: { id: string; title: string; artist: string; coverUrl: string | null; spotifyUrl: string };
  playedAt: string;
  authorNote: string | null;
  repeatCount: number;
  commentCount: number;
};

function relativeTime(value: string, ru: boolean) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return ru ? "только что" : "just now";
  if (minutes < 60) return ru ? `${minutes} мин назад` : `${minutes} min ago`;
  if (minutes < 1440) return ru ? `${Math.round(minutes / 60)} ч назад` : `${Math.round(minutes / 60)}h ago`;
  return ru ? `${Math.round(minutes / 1440)} дн назад` : `${Math.round(minutes / 1440)}d ago`;
}

function LiveFeedCard({ event, ru }: { event: LiveFeedEvent; ru: boolean }) {
  return (
    <Link className="liveFeedCard" href={`/taste/${event.profile.handle}?event=${event.id}`}>
      <div className="liveFeedPerson">
        <span className="feedAvatar"><AvatarImage src={event.profile.avatarUrl || ""} alt={event.profile.name} /></span>
        <span className="liveFeedPersonCopy"><strong>{event.profile.name}</strong><span>@{event.profile.handle} · {relativeTime(event.playedAt, ru)}</span></span>
      </div>
      <div className="liveFeedTrack">
        <TrackArtwork src={event.track.coverUrl || ""} alt={`${event.track.title} cover`} className="feedCover" />
        <span className="liveFeedTrackCopy"><strong>{event.track.title}</strong><span>{event.track.artist}</span>{event.authorNote ? <em>“{event.authorNote}”</em> : null}</span>
      </div>
      <div className="liveFeedSignals"><span><Icon name="feed" size={16} />{event.repeatCount > 1 ? (ru ? `${event.repeatCount} прослушиваний` : `${event.repeatCount} plays`) : (ru ? "новое прослушивание" : "new listen")}</span><span><Icon name="info" size={16} />{event.commentCount}</span></div>
    </Link>
  );
}

export default function FeedPage() {
  const eventCount = usePrototypeEventCount();
  const [activeSegment, setActiveSegment] = useState<(typeof segments)[number]>("Following");
  const { showToast } = useToast();
  const { locale } = useI18n();
  const ru = locale === "ru";
  const [liveEvents, setLiveEvents] = useState<LiveFeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [loadingLive, setLoadingLive] = useState(true);

  useEffect(() => {
    fetch("/api/feed", { cache: "no-store" }).then(async response => {
      if (!response.ok) return;
      const payload = await response.json() as { events: LiveFeedEvent[] };
      setLiveEvents(payload.events);
      setConnected(true);
    }).finally(() => setLoadingLive(false));
  }, []);

  return (
    <main className="page">
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">Taste Feed</div>
          <h1 className="pageTitle">{ru ? "Новые и недавние прослушивания людей, на которых вы подписаны." : "Live and recent listening from people you follow."}</h1>
          <p className="lead">
            {ru ? "Откройте любую карточку, чтобы запустить реальный Spotify-плеер и зафиксировать событие атрибуции." : "Tap any track card to open a real Spotify embed player and create a browser-local attribution event."}
          </p>
        </div>
        <DemoBadge>{ru ? "Реальные треки Spotify" : "Real Spotify tracks"}</DemoBadge>
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
            {ru ? ({ Following: "Подписки", Artists: "Артисты", Creators: "Авторы" } as const)[segment] : segment}
          </button>
        ))}
      </div>

      <div className="grid2 section">
        <section className="feedList" aria-label="Taste Feed events using real Spotify tracks">
          {activeSegment === "Following" && loadingLive ? <div className="liveFeedCard"><div className="skeleton" style={{ height: 72 }} /><div className="skeleton" style={{ height: 92 }} /></div> : null}
          {activeSegment === "Following" && connected && liveEvents.length ? liveEvents.map(event => <LiveFeedCard event={event} ru={ru} key={event.id} />) : null}
          {activeSegment === "Following" && connected && !loadingLive && !liveEvents.length ? <div className="emptyState feedEmpty"><Icon name="taste" /><strong>{ru ? "Ваша живая лента пока пуста" : "Your live feed is ready for people"}</strong><span>{ru ? "Откройте публичный Taste-профиль и подпишитесь на него." : "Open a public Taste profile and follow it to see real listening here."}</span><Link className="btn btnPrimary" href="/taste/ivan">{ru ? "Найти Taste" : "Find Taste"}</Link></div> : null}
          {activeSegment === "Following" && !connected && !loadingLive ? <div className="emptyState feedEmpty"><Icon name="user" /><strong>{ru ? "Подключите Spotify для общей ленты" : "Connect Spotify for a shared feed"}</strong><span>{ru ? "Подписки и события будут одинаковыми на разных устройствах." : "Follows and listening events will persist across devices."}</span><a className="btn btnPrimary" href="/api/auth/spotify/start?returnTo=/feed">{ru ? "Подключить Spotify" : "Connect Spotify"}</a></div> : null}
          {activeSegment !== "Following" || (!connected && !loadingLive) ? feedEvents.map(event => <TasteFeedCard event={event} key={event.id} />) : null}
        </section>

        <aside className="sideSummary">
          <div className="panel">
            <div className="sectionHeader" style={{ marginBottom: 12 }}>
              <div>
                <DemoBadge>{ru ? "Атрибуция прототипа" : "Prototype attribution"}</DemoBadge>
                <h2 style={{ marginTop: 12 }}>{ru ? "Счётчик событий" : "Local event counter"}</h2>
              </div>
            </div>
            <div className="summaryLine">
              <span>{ru ? "Открытий треков" : "Track opens"}</span>
              <strong>{eventCount}</strong>
            </div>
            <div className="summaryLine">
              <span>{ru ? "Сохранено в браузере" : "Stored in browser"}</span>
              <strong>{eventCount > 0 ? (ru ? "да" : "yes") : (ru ? "ожидание" : "waiting")}</strong>
            </div>
            <div className="summaryLine">
              <span>{ru ? "Отчёт Spotify о стриме" : "Spotify stream report"}</span>
              <strong>{ru ? "только embed" : "embed only"}</strong>
            </div>
            <p className="finePrint" style={{ marginTop: 16 }}>
              {ru ? "Счётчик показывает путь атрибуции в прототипе. Само аудио воспроизводится официальным embed-плеером Spotify." : "The counter proves the prototype attribution path. Audio playback itself is handled inside Spotify's official iframe embed."}
            </p>
          </div>

          <div className="panel">
            <h3>{ru ? "Что показывает лента" : "What the feed demonstrates"}</h3>
            <div className="whyList">
              <div className="whyItem">
                <span className="whyIcon">
                  <Icon name="taste" />
                </span>
                <span>{ru ? "Обычное прослушивание становится управляемым сигналом discovery." : "Ordinary listening becomes a controlled discovery signal."}</span>
              </div>
              <div className="whyItem">
                <span className="whyIcon">
                  <Icon name="info" />
                </span>
                <span>{ru ? "Каждое публичное событие знаменитости явно помечено как иллюстративное." : "Every public celebrity event is explicitly illustrative."}</span>
              </div>
            </div>
            <div className="buttonRow" style={{ marginTop: 18 }}>
              <a className="btn btnSubtle" href="/taste/ivan">
                <Icon name="spark" />
                {ru ? "Открыть публичный Taste" : "Open public Taste"}
              </a>
              <a className="btn btnSubtle" href="/notifications">
                <Icon name="info" />
                {ru ? "Уведомления" : "Inbox"}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
