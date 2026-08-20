"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { TasteFeedCard } from "@/components/TasteFeedCard";
import { TasteQueuePlayer } from "@/components/TasteQueuePlayer";
import { TrackArtwork } from "@/components/TrackArtwork";
import { feedEvents, travis } from "@/lib/mock-data";
import { useFollowingTaste } from "@/lib/use-following-taste";
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
  commentCount: number;
};

type ProfileSearchResult = {
  handle: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  verified: boolean;
  following: boolean;
  followers: number;
};

function relativeTime(value: string, ru: boolean) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return ru ? "только что" : "just now";
  if (minutes < 60) return ru ? `${minutes} мин назад` : `${minutes} min ago`;
  if (minutes < 1440) return ru ? `${Math.round(minutes / 60)} ч назад` : `${Math.round(minutes / 60)}h ago`;
  return ru ? `${Math.round(minutes / 1440)} дн назад` : `${Math.round(minutes / 1440)}d ago`;
}

function LiveFeedCard({ event, ru }: { event: LiveFeedEvent; ru: boolean }) {
  const signal = event.authorNote
    ? (ru ? "Рекомендует с комментарием" : "Recommended with a note")
    : event.repeatCount > 1
      ? (ru ? `${event.repeatCount} прослушиваний за неделю` : `${event.repeatCount} plays this week`)
      : (ru ? "Осознанно опубликованный сигнал" : "Intentionally shared signal");
  return (
    <Link className="nativeLiveFeedCard" href={`/taste/${event.profile.handle}?event=${event.id}`}>
      <span className="nativeFeedAvatar"><AvatarImage src={event.profile.avatarUrl || ""} alt={event.profile.name} /></span>
      <span className="nativeFeedContent">
        <span className="nativeFeedPerson"><strong>{event.profile.name}</strong><small>{relativeTime(event.playedAt, ru)}</small></span>
        <span className="nativeFeedTrack"><TrackArtwork src={event.track.coverUrl || ""} alt={`${event.track.title} cover`} className="nativeFeedCover" /><span><strong>{event.track.title}</strong><small>{event.track.artist}</small>{event.authorNote ? <em>“{event.authorNote}”</em> : null}</span></span>
        <span className="nativeFeedSignal"><Icon name={event.authorNote ? "comment" : "feed"} size={16} />{signal}</span>
      </span>
      <span className="nativeFeedComment"><Icon name="comment" size={17} />{event.commentCount}</span>
    </Link>
  );
}

export default function FeedPage() {
  const [activeSegment, setActiveSegment] = useState<(typeof segments)[number]>("Following");
  const { following } = useFollowingTaste(travis.id);
  const { locale } = useI18n();
  const ru = locale === "ru";
  const [liveEvents, setLiveEvents] = useState<LiveFeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [loadingLive, setLoadingLive] = useState(true);
  const [query, setQuery] = useState("");
  const [peopleResults, setPeopleResults] = useState<ProfileSearchResult[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);

  useEffect(() => {
    fetch("/api/feed", { cache: "no-store" }).then(async response => {
      if (!response.ok) return;
      const payload = await response.json() as { events: LiveFeedEvent[] };
      setLiveEvents(payload.events);
      setConnected(true);
    }).finally(() => setLoadingLive(false));
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setPeopleResults([]);
      setSearchingPeople(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearchingPeople(true);
      fetch(`/api/profiles/search?q=${encodeURIComponent(value)}`, { cache: "no-store", signal: controller.signal })
        .then(async response => response.ok ? response.json() as Promise<{ profiles: ProfileSearchResult[] }> : { profiles: [] })
        .then(payload => setPeopleResults(payload.profiles))
        .catch(() => undefined)
        .finally(() => setSearchingPeople(false));
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const matchesPerson = (name: string, handle = "") => !normalizedQuery || `${name} ${handle}`.toLocaleLowerCase(locale).includes(normalizedQuery);
  const visibleLiveEvents = activeSegment === "Following"
    ? liveEvents.filter(event => matchesPerson(event.profile.name, event.profile.handle))
    : [];
  const demoEventsForSegment = activeSegment === "Following"
    ? (following ? feedEvents.filter(event => event.tastemaker.id === travis.id) : [])
    : activeSegment === "Creators"
      ? feedEvents.filter(event => event.tastemaker.slug === "tyler-the-creator")
      : feedEvents;
  const visibleDemoEvents = demoEventsForSegment.filter(event => matchesPerson(event.tastemaker.name, event.tastemaker.slug));
  const hasFollowingContent = liveEvents.length > 0 || following;
  const hasVisibleContent = visibleLiveEvents.length > 0 || visibleDemoEvents.length > 0;
  const demoPersonMatches = normalizedQuery.length >= 2 && `${travis.name} ${travis.slug}`.toLocaleLowerCase(locale).includes(normalizedQuery);
  const hasPeopleResults = demoPersonMatches || peopleResults.length > 0;
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
          : event.repeatCount > 1
            ? (ru ? `${event.repeatCount} прослушиваний за неделю` : `${event.repeatCount} plays this week`)
            : (ru ? "Опубликованный Taste-сигнал" : "Shared Taste signal"),
        authorNote: event.authorNote,
      };
    });
    const fromDemo = visibleDemoEvents.map(event => ({
      id: `feed_queue_${event.id}`,
      track: event.track,
      tastemaker: event.tastemaker,
      signal: ru
        ? event.kind === "recommended" ? "Личная рекомендация" : event.kind === "on_repeat" ? "На повторе всю неделю" : event.kind === "saved_discovery" ? "Новое сохранение" : "Снова вернулся к треку"
        : event.humanSignal,
      authorNote: event.authorNote,
    }));
    return [...fromLive, ...fromDemo];
  }, [ru, visibleDemoEvents, visibleLiveEvents]);

  return (
    <main className="page nativeFeedPage">
      <header className="nativePageHeader feedPageHeader">
        <h1>{ru ? "Лента Taste" : "Taste Feed"}</h1>
        <p>{ru ? "Рекомендации, повторы и открытия от людей, чьему вкусу вы доверяете." : "Recommendations, repeat listens and discoveries from people whose taste you trust."}</p>
        <span className="nativeDataDisclosure"><Icon name="info" size={14} />{ru ? "Публичные профили пользователей используют авторизованные данные. Сигналы знаменитостей в демо иллюстративны." : "Public user profiles use authorized data. Celebrity signals in this demo are illustrative."}</span>
      </header>

      <div className="nativeFeedTools">
        <label className="nativePeopleSearch">
          <Icon name="search" size={18} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={ru ? "Найти человека или артиста" : "Find a person or artist"} aria-label={ru ? "Поиск по людям" : "Search people"} />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label={ru ? "Очистить поиск" : "Clear search"}><Icon name="close" size={17} /></button> : null}
        </label>
        <TasteQueuePlayer
          items={queueItems}
          triggerLabel={ru ? "Слушать ленту" : "Play feed"}
          triggerAriaLabel={ru ? "Слушать все рекомендации в текущей ленте" : "Play all recommendations in the current feed"}
          triggerClassName="nativeFeedPlayButton"
        />
      </div>

      {query.trim().length >= 2 ? (
        <section className="nativePeopleResults" aria-label={ru ? "Найденные профили Taste" : "Taste profile results"}>
          <div className="nativePeopleResultsHeader"><strong>{ru ? "Люди" : "People"}</strong>{searchingPeople ? <span>{ru ? "Поиск..." : "Searching..."}</span> : null}</div>
          {demoPersonMatches ? (
            <Link href="/tastemaker/travis-scott" className="nativePersonResult">
              <span className="nativePersonAvatar"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt={travis.name} /></span>
              <span><strong>{travis.name}<i className="verifiedDot"><Icon name="check" size={11} /></i></strong><small>{ru ? "Артист · иллюстративный Taste" : "Artist · illustrative Taste"}</small></span>
              <Icon name="chevronRight" size={18} />
            </Link>
          ) : null}
          {peopleResults.map(profile => (
            <Link href={`/taste/${profile.handle}`} className="nativePersonResult" key={profile.handle}>
              <span className="nativePersonAvatar"><AvatarImage src={profile.avatarUrl || ""} alt={profile.name} /></span>
              <span><strong>{profile.name}{profile.verified ? <i className="verifiedDot"><Icon name="check" size={11} /></i> : null}</strong><small>@{profile.handle} · {profile.role}</small></span>
              <span className="nativePersonResultMeta">{profile.following ? (ru ? "Вы подписаны" : "Following") : profile.followers ? `${profile.followers}` : ""}</span>
              <Icon name="chevronRight" size={18} />
            </Link>
          ))}
          {!searchingPeople && !hasPeopleResults ? <p>{ru ? "Публичных профилей с таким именем пока нет." : "No public Taste profiles match this search yet."}</p> : null}
        </section>
      ) : null}

      <div className="nativeSegments" aria-label={ru ? "Фильтр ленты" : "Feed filter"}>
        {segments.map(segment => (
          <button className={activeSegment === segment ? "active" : ""} type="button" aria-pressed={activeSegment === segment} key={segment} onClick={() => setActiveSegment(segment)}>{segmentLabels[segment]}</button>
        ))}
      </div>

      <section className="nativeFeedList" aria-label={ru ? "События Taste" : "Taste events"}>
        {activeSegment === "Following" && loadingLive ? <div className="nativeFeedSkeleton"><span className="skeleton" /><span className="skeleton" /></div> : null}
        {visibleLiveEvents.map(event => <LiveFeedCard event={event} ru={ru} key={event.id} />)}
        {visibleDemoEvents.map(event => <TasteFeedCard event={event} key={event.id} />)}

        {!loadingLive && query && !hasVisibleContent && !hasPeopleResults ? (
          <div className="nativeFeedSearchEmpty"><Icon name="search" size={25} /><strong>{ru ? "В этой ленте такого человека нет" : "No matching person in this feed"}</strong><span>{ru ? "Попробуйте другое имя или переключите раздел." : "Try another name or switch sections."}</span></div>
        ) : null}

        {activeSegment === "Following" && !loadingLive && !hasFollowingContent && !query ? (
          <div className="nativeFeedEmpty">
            <span className="nativeFeedEmptyAvatar"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt={travis.name} /></span>
            <h2>{ru ? "Соберите свою ленту Taste" : "Build your Taste Feed"}</h2>
            <p>{ru ? "Подпишитесь на Taste Трэвиса, и его значимые музыкальные сигналы появятся здесь." : "Follow Travis's Taste and his meaningful listening signals will appear here."}</p>
            <Link className="nativePrimaryButton" href="/tastemaker/travis-scott">{ru ? "Открыть Taste Трэвиса" : "Open Travis's Taste"}</Link>
            {!connected ? <Link className="nativeTextLink" href="/my-taste">{ru ? "Подключить Spotify для ленты друзей" : "Connect Spotify for friends' activity"}</Link> : null}
          </div>
        ) : null}

        {activeSegment === "Following" && hasFollowingContent && !query ? (
          <Link className="nativeWeeklySummary" href="/tastemaker/travis-scott">
            <span className="nativeWeeklySummaryAvatar"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="" /></span>
            <span><small>{ru ? "Сводка за неделю" : "Weekly summary"}</small><strong>{ru ? "Taste Трэвиса: 8 значимых сигналов" : "Travis's Taste: 8 meaningful signals"}</strong></span>
            <Icon name="chevronRight" />
          </Link>
        ) : null}
      </section>
    </main>
  );
}
