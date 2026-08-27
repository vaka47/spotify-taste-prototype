"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { TasteFeedCard } from "@/components/TasteFeedCard";
import { TasteQueuePlayer, useTastePlayback } from "@/components/TasteQueuePlayer";
import { TrackArtwork } from "@/components/TrackArtwork";
import { feedEvents, travis } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";
import type { TasteQueueItem, TrackRef } from "@/types/taste";

const segments = ["Following", "Artists", "Creators"] as const;

type LiveFeedEvent = {
  id: string;
  profile: { handle: string; name: string; avatarUrl: string | null; verified: boolean };
  track: { id: string; title: string; artist: string; coverUrl: string | null; spotifyUrl: string };
  playedAt: string;
  authorNote: string | null;
  repeatCount: number;
  previousPlayedAt: string | null;
  reactionCount: number;
  viewerReacted: boolean;
};

function relativeTime(value: string, ru: boolean) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return ru ? "только что" : "just now";
  if (minutes < 60) return ru ? `${minutes} мин назад` : `${minutes} min ago`;
  if (minutes < 1440) return ru ? `${Math.round(minutes / 60)} ч назад` : `${Math.round(minutes / 60)}h ago`;
  return ru ? `${Math.round(minutes / 1440)} дн назад` : `${Math.round(minutes / 1440)}d ago`;
}

function localizeDemoNote(note: string | null | undefined, ru: boolean) {
  if (!note || !ru) return note;
  if (note === "Listen for the switch in the second half.") return "Обратите внимание на переход во второй половине.";
  if (note === "The opening leaves exactly the right amount of space.") return "Во вступлении ровно столько воздуха, сколько нужно.";
  return note;
}

function returnSignal(previous: string | null, latest: string, ru: boolean) {
  if (!previous) return "";
  const days = Math.max(1, Math.round((new Date(latest).getTime() - new Date(previous).getTime()) / 86_400_000));
  if (days >= 60) return ru ? `Вернулся спустя ${Math.round(days / 30)} мес.` : `Back after ${Math.round(days / 30)} months`;
  return ru ? `Вернулся спустя ${days} дн.` : `Back after ${days} days`;
}

function LiveFeedCard({ event, ru, queue, queueIndex }: { event: LiveFeedEvent; ru: boolean; queue: TasteQueueItem[]; queueIndex: number }) {
  const { playQueue, activeItemId } = useTastePlayback();
  const signal = event.authorNote
    ? (ru ? "Рекомендует с комментарием" : "Recommended with a note")
    : returnSignal(event.previousPlayedAt, event.playedAt, ru)
      ? returnSignal(event.previousPlayedAt, event.playedAt, ru)
    : event.repeatCount > 1
      ? (ru ? `${event.repeatCount} прослушиваний за неделю` : `${event.repeatCount} plays this week`)
      : (ru ? "Опубликовано в Taste" : "Shared to Taste");

  const playTrack = () => playQueue(queue, queueIndex);
  return (
    <article className={`spxFeedEvent ${activeItemId === `feed_queue_${event.id}` ? "playing" : ""}`}>
      <div className="spxFeedEventMain">
      <Link className="spxFeedAvatar" href={`/taste/${event.profile.handle}?event=${event.id}`}><AvatarImage src={event.profile.avatarUrl || ""} alt={event.profile.name} /></Link>
      <span className="spxFeedEventCopy">
        <Link className="spxFeedPerson" href={`/taste/${event.profile.handle}?event=${event.id}`}><strong>{event.profile.name}</strong>{event.profile.verified ? <i className="spxVerified"><Icon name="check" size={10} /></i> : null}</Link>
        <span className="spxFeedTime">{relativeTime(event.playedAt, ru)}</span>
        <button className="spxFeedTrackAction" type="button" onClick={playTrack}><strong className="spxFeedTrackTitle">{event.track.title}</strong><span className="spxFeedArtist">{event.track.artist}</span>{event.authorNote ? <em className="spxFeedNote">“{event.authorNote}”</em> : null}</button>
      </span>
      <button className="spxFeedCoverButton" type="button" onClick={playTrack} aria-label={ru ? `Воспроизвести ${event.track.title}` : `Play ${event.track.title}`}><TrackArtwork src={event.track.coverUrl || ""} alt={`${event.track.title} cover`} className="spxFeedCover" /></button>
      <button className="spxFeedSignal" type="button" onClick={playTrack}><Icon name={event.authorNote ? "comment" : "feed"} size={17} />{signal}</button>
      </div>
      <button className="spxFeedMore" type="button" onClick={playTrack} aria-label={ru ? `Воспроизвести ${event.track.title}` : `Play ${event.track.title}`}><Icon name="play" size={17} /></button>
    </article>
  );
}

export default function FeedPage() {
  const [activeSegment, setActiveSegment] = useState<(typeof segments)[number]>("Following");
  const { locale } = useI18n();
  const ru = locale === "ru";
  const [liveEvents, setLiveEvents] = useState<LiveFeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [loadingLive, setLoadingLive] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/feed", { cache: "no-store" }).then(async response => {
      if (!response.ok) return;
      const payload = await response.json() as { events: LiveFeedEvent[] };
      setLiveEvents(payload.events);
      setConnected(true);
    }).finally(() => setLoadingLive(false));
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const matchesPerson = (name: string, handle = "") => !normalizedQuery || `${name} ${handle}`.toLocaleLowerCase(locale).includes(normalizedQuery);
  const visibleLiveEvents = activeSegment === "Following" ? liveEvents.filter(event => matchesPerson(event.profile.name, event.profile.handle)) : [];
  const demoEventsForSegment = activeSegment === "Creators"
    ? feedEvents.filter(event => event.tastemaker.slug === "tyler-the-creator")
    : activeSegment === "Artists"
      ? feedEvents.filter(event => event.tastemaker.slug !== "tyler-the-creator")
      : feedEvents;
  const visibleDemoEvents = (!connected || liveEvents.length === 0 ? demoEventsForSegment : []).filter(event => matchesPerson(event.tastemaker.name, event.tastemaker.slug));
  const hasVisibleContent = visibleLiveEvents.length > 0 || visibleDemoEvents.length > 0;
  const segmentLabels = ru
    ? { Following: "Подписки", Artists: "Артисты", Creators: "Авторы" }
    : { Following: "Following", Artists: "Artists", Creators: "Creators" };

  const queueItems = useMemo<TasteQueueItem[]>(() => {
    const fromLive = visibleLiveEvents.map(event => {
      const track: TrackRef = {
        id: `spotify_track_${event.track.id}`,
        slug: event.track.id,
        spotifyId: event.track.id,
        spotifyUri: `spotify:track:${event.track.id}`,
        spotifyUrl: event.track.spotifyUrl,
        spotifyEmbedUrl: `https://open.spotify.com/embed/track/${event.track.id}`,
        title: event.track.title,
        artist: event.track.artist,
        coverUrl: event.track.coverUrl || "",
        origin: "spotify",
      };
      return {
        id: `feed_queue_${event.id}`,
        track,
        tastemaker: { id: event.profile.handle, name: event.profile.name, avatarUrl: event.profile.avatarUrl || "" },
        signal: event.authorNote
          ? (ru ? "Опубликовано с личным комментарием" : "Shared with a personal note")
          : returnSignal(event.previousPlayedAt, event.playedAt, ru)
            ? returnSignal(event.previousPlayedAt, event.playedAt, ru)
          : event.repeatCount > 1
            ? (ru ? `${event.repeatCount} прослушиваний за неделю` : `${event.repeatCount} plays this week`)
            : (ru ? "Опубликовано в Taste" : "Shared to Taste"),
        authorNote: event.authorNote,
        eventId: event.id,
        reactionCount: event.reactionCount || 0,
        viewerReacted: Boolean(event.viewerReacted),
        canReact: true,
      };
    });
    const fromDemo = visibleDemoEvents.map(event => ({
      id: `feed_queue_${event.id}`,
      track: event.track,
      tastemaker: event.tastemaker,
      signal: ru
        ? event.kind === "recommended" ? "Личная рекомендация" : event.kind === "on_repeat" ? "На повторе всю неделю" : event.kind === "saved_discovery" ? "Новое сохранение" : "Снова вернулся к треку"
        : event.humanSignal,
      authorNote: localizeDemoNote(event.authorNote, ru),
      canReact: true,
    }));
    return [...fromLive, ...fromDemo];
  }, [ru, visibleDemoEvents, visibleLiveEvents]);

  return (
    <main className="spxFeedPage">
      <header className="spxFeedHeader">
        <h1>{ru ? "Лента Taste" : "Taste Feed"}</h1>
        <div className="spxFeedTabs" aria-label={ru ? "Фильтр ленты" : "Feed filter"}>
          {segments.map(segment => <button className={activeSegment === segment ? "active" : ""} type="button" aria-pressed={activeSegment === segment} key={segment} onClick={() => setActiveSegment(segment)}>{segmentLabels[segment]}</button>)}
        </div>
        <p>{ru ? "Недавние прослушивания людей, на чей музыкальный вкус вы подписаны" : "Live and recent listening from people you follow"}</p>
      </header>

      <div className="spxFeedTools">
        <label className="spxPeopleSearch">
          <Icon name="search" size={18} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={ru ? "Фильтр этой ленты" : "Filter this feed"} aria-label={ru ? "Фильтр ленты" : "Filter feed"} />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label={ru ? "Очистить поиск" : "Clear search"}><Icon name="close" size={17} /></button> : null}
        </label>
        <TasteQueuePlayer items={queueItems} triggerLabel={ru ? "Слушать ленту" : "Play feed"} triggerAriaLabel={ru ? "Слушать все рекомендации в ленте" : "Play all recommendations in the feed"} triggerClassName="spxFeedPlay" iconOnly />
      </div>

      <section className="spxFeedList" aria-label={ru ? "События Taste" : "Taste events"}>
        {visibleLiveEvents.map((event, index) => <LiveFeedCard event={event} ru={ru} queue={queueItems} queueIndex={index} key={event.id} />)}
        {visibleDemoEvents.map((event, index) => <TasteFeedCard event={event} queue={queueItems} queueIndex={visibleLiveEvents.length + index} key={event.id} />)}

        {!loadingLive && query && !hasVisibleContent ? <div className="spxFeedEmpty"><Icon name="search" size={25} /><strong>{ru ? "В ленте ничего не найдено" : "No feed matches"}</strong><span>{ru ? "Попробуйте другое имя или раздел." : "Try another name or section."}</span></div> : null}

        {activeSegment === "Following" && hasVisibleContent && !query ? (
          <Link className="spxWeeklySummary" href="/tastemaker/travis-scott">
            <span className="spxWeeklySummaryAvatar"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="" /></span>
            <span><strong>{ru ? "Taste Трэвиса за неделю" : "Travis's week in Taste"}</strong><small>{ru ? "История, повторы, открытия и комментарии" : "Listening history, repeats, discoveries, and notes"}</small></span>
            <Icon name="chevronRight" />
          </Link>
        ) : null}

        {!loadingLive && !hasVisibleContent && !query ? <div className="spxFeedEmpty"><Icon name="user" size={26} /><strong>{ru ? "Подписок пока нет" : "No Taste follows yet"}</strong><span>{ru ? "Найдите человека или артиста и подпишитесь на его Taste." : "Find a person or artist and follow their Taste."}</span>{!connected ? <Link className="spxPrimaryButton" href="/my-taste">{ru ? "Подключить Spotify" : "Connect Spotify"}</Link> : null}</div> : null}
      </section>

      <p className="spxFeedDisclosure"><Icon name="info" size={13} />{ru ? "Профили пользователей используют разрешённые данные Spotify. История знаменитостей в демо иллюстративна." : "User profiles use authorized Spotify data. Celebrity listening shown here is illustrative."}</p>
    </main>
  );
}
