"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { TasteFeedCard } from "@/components/TasteFeedCard";
import { TrackArtwork } from "@/components/TrackArtwork";
import { feedEvents, travis } from "@/lib/mock-data";
import { useFollowingTaste } from "@/lib/use-following-taste";
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

  useEffect(() => {
    fetch("/api/feed", { cache: "no-store" }).then(async response => {
      if (!response.ok) return;
      const payload = await response.json() as { events: LiveFeedEvent[] };
      setLiveEvents(payload.events);
      setConnected(true);
    }).finally(() => setLoadingLive(false));
  }, []);

  const showDemoFollowing = activeSegment === "Following" && following;
  const showDiscoverable = activeSegment === "Artists" || activeSegment === "Creators";
  const hasFollowingContent = liveEvents.length > 0 || showDemoFollowing;
  const segmentLabels = ru
    ? { Following: "Подписки", Artists: "Артисты", Creators: "Авторы" }
    : { Following: "Following", Artists: "Artists", Creators: "Creators" };

  return (
    <main className="page nativeFeedPage">
      <header className="nativePageHeader feedPageHeader">
        <h1>{ru ? "Лента Taste" : "Taste Feed"}</h1>
        <p>{ru ? "Рекомендации, повторы и открытия от людей, чьему вкусу вы доверяете." : "Recommendations, repeat listens and discoveries from people whose taste you trust."}</p>
      </header>

      <div className="nativeSegments" aria-label={ru ? "Фильтр ленты" : "Feed filter"}>
        {segments.map(segment => (
          <button className={activeSegment === segment ? "active" : ""} type="button" aria-pressed={activeSegment === segment} key={segment} onClick={() => setActiveSegment(segment)}>{segmentLabels[segment]}</button>
        ))}
      </div>

      <section className="nativeFeedList" aria-label={ru ? "События Taste" : "Taste events"}>
        {activeSegment === "Following" && loadingLive ? <div className="nativeFeedSkeleton"><span className="skeleton" /><span className="skeleton" /></div> : null}
        {activeSegment === "Following" && liveEvents.map(event => <LiveFeedCard event={event} ru={ru} key={event.id} />)}
        {(showDemoFollowing || showDiscoverable) ? feedEvents.map(event => <TasteFeedCard event={event} key={event.id} />) : null}

        {activeSegment === "Following" && !loadingLive && !hasFollowingContent ? (
          <div className="nativeFeedEmpty">
            <span className="nativeFeedEmptyAvatar"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt={travis.name} /></span>
            <h2>{ru ? "Соберите свою ленту Taste" : "Build your Taste Feed"}</h2>
            <p>{ru ? "Подпишитесь на Taste Трэвиса, и его значимые музыкальные сигналы появятся здесь." : "Follow Travis's Taste and his meaningful listening signals will appear here."}</p>
            <Link className="nativePrimaryButton" href="/tastemaker/travis-scott">{ru ? "Открыть Taste Трэвиса" : "Open Travis's Taste"}</Link>
            {!connected ? <Link className="nativeTextLink" href="/my-taste">{ru ? "Подключить Spotify для ленты друзей" : "Connect Spotify for friends' activity"}</Link> : null}
          </div>
        ) : null}

        {activeSegment === "Following" && hasFollowingContent ? (
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
