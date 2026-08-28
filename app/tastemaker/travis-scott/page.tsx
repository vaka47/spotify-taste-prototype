"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { ConnectionsDialog } from "@/components/ConnectionsDialog";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { TasteQueuePlayer, useTastePlayback } from "@/components/TasteQueuePlayer";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { doechii, recentlyDiscoveredTracks, tracks, travis, travisWeeklyHistory, tyler } from "@/lib/mock-data";
import { recordTrackOpen } from "@/lib/prototype-events";
import { useFollowingTaste } from "@/lib/use-following-taste";
import type { WeeklyTrackSignal } from "@/types/taste";
import { useI18n } from "@/lib/i18n";

type ArtistTab = "music" | "events" | "merch" | "taste";
const tabs: ArtistTab[] = ["music", "events", "merch", "taste"];

function localizedLastPlayed(value: string, ru: boolean) {
  if (!ru) return value;
  return value
    .replace("2 min ago", "2 мин назад")
    .replace("20 min ago", "20 мин назад")
    .replace("2h ago", "2 ч назад")
    .replace("20h ago", "20 ч назад")
    .replace("1d ago", "вчера")
    .replace("Yesterday", "вчера")
    .replace("Today", "сегодня")
    .replace("2d ago", "2 дня назад")
    .replace("3d ago", "3 дня назад")
    .replace("5d ago", "5 дней назад");
}

function repeatWord(value: number) {
  if (value % 100 >= 11 && value % 100 <= 14) return "прослушиваний";
  if (value % 10 === 1) return "прослушивание";
  if (value % 10 >= 2 && value % 10 <= 4) return "прослушивания";
  return "прослушиваний";
}

function signalLabel(kind: WeeklyTrackSignal["kind"], ru: boolean) {
  const labels = ru
    ? { recommended: "Рекомендует", on_repeat: "На повторе", saved_discovery: "Новое открытие", rediscovered: "Снова слушает" }
    : { recommended: "Recommended", on_repeat: "On repeat", saved_discovery: "New discovery", rediscovered: "Rediscovered" };
  return labels[kind];
}

export default function TravisTastePage() {
  const { playQueue, activeItemId, paused, togglePlayback } = useTastePlayback();
  const { following, toggle } = useFollowingTaste(travis.id);
  const { showToast } = useToast();
  const { locale } = useI18n();
  const ru = locale === "ru";
  const [activeTab, setActiveTab] = useState<ArtistTab>("taste");
  const [showAll, setShowAll] = useState(false);
  const [discussion, setDiscussion] = useState<WeeklyTrackSignal | null>(null);
  const [followersOpen, setFollowersOpen] = useState(false);

  function toggleFollow() {
    toggle();
    showToast(following
      ? (ru ? "Вы больше не подписаны на Taste Трэвиса" : "You unfollowed Travis's Taste")
      : (ru ? "Taste Трэвиса появился в вашей ленте" : "Travis's Taste is now in your feed"));
  }

  function openTrack(item: WeeklyTrackSignal) {
    recordTrackOpen(travis.id, item.track.id);
    const queueId = `travis_queue_${item.track.id}`;
    if (activeItemId === queueId) togglePlayback();
    else playQueue(tasteQueue, Math.max(0, tasteQueue.findIndex(queueItem => queueItem.track.id === item.track.id)));
  }

  function toggleDiscussion(item: WeeklyTrackSignal) {
    setDiscussion(current => current?.track.id === item.track.id ? null : item);
  }

  useEffect(() => {
    if (!discussion) return;
    const frame = window.requestAnimationFrame(() => document.querySelector("[data-artist-discussion]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
    return () => window.cancelAnimationFrame(frame);
  }, [discussion]);

  const tabLabels: Record<ArtistTab, string> = ru
    ? { music: "Музыка", events: "Концерты", merch: "Мерч", taste: "Taste" }
    : { music: "Music", events: "Events", merch: "Merch", taste: "Taste" };
  const tasteQueue = travisWeeklyHistory.map(item => ({
    id: `travis_queue_${item.track.id}`,
    track: item.track,
    tastemaker: travis,
    signal: ru ? `${item.plays} ${repeatWord(item.plays)} за неделю · ${signalLabel(item.kind, true)}` : `${item.plays} plays this week · ${signalLabel(item.kind, false)}`,
    authorNote: item.authorNote ? (ru ? "Обратите внимание на переход во второй половине." : item.authorNote) : null,
    canReact: true,
  }));
  const discoveryQueue = recentlyDiscoveredTracks.map(item => ({
    id: `travis_discovery_${item.track.id}`,
    track: item.track,
    tastemaker: travis,
    signal: ru ? "Недавнее открытие Трэвиса" : "Recently discovered by Travis",
    authorNote: null,
  }));
  const weeklyRows = showAll ? travisWeeklyHistory : travisWeeklyHistory.slice(0, 3);

  return (
    <main className="spxArtistPage">
      <section className="spxArtistHero">
        <img src="/avatars/travis-official.jpg" alt="Travis Scott" />
        <div className="spxArtistHeroShade" />
        <div className="spxArtistHeroCopy">
          <span><i><Icon name="check" size={11} /></i>{ru ? "Подтверждённый исполнитель" : "Verified artist"}</span>
          <h1>{travis.name}</h1>
          <p>{ru ? "64,7 млн слушателей в месяц" : "64.7M monthly listeners"}</p>
        </div>
      </section>

      <nav className="spxArtistTabs" aria-label={ru ? "Разделы артиста" : "Artist sections"}>
        {tabs.map(tab => <button className={activeTab === tab ? "active" : ""} type="button" aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} key={tab}>{tabLabels[tab]}</button>)}
      </nav>

      <div className="spxArtistBody">
        {activeTab === "taste" ? (
          <>
            <section className="spxTasteIntro">
              <div className="spxTasteIntroCopy">
                <h2>{ru ? "Taste Трэвиса" : "Travis's Taste"}</h2>
                <p>{ru ? "Его опубликованная история прослушиваний, открытия и комментарии." : "His shared listening history, discoveries, and notes."}</p>
                <div className="spxTasteIntroActions">
                  <button className={`spxFollowButton ${following ? "active" : ""}`} type="button" onClick={toggleFollow}>{following ? (ru ? "Вы подписаны" : "Following") : (ru ? "Подписаться" : "Follow Taste")}</button>
                  <TasteQueuePlayer items={tasteQueue} triggerLabel={ru ? "Слушать Taste" : "Play Taste"} triggerAriaLabel={ru ? "Слушать историю Taste Трэвиса" : "Play Travis's Taste history"} triggerClassName="spxTastePlay" iconOnly />
                  <button className="spxTasteFollowers" type="button" onClick={() => setFollowersOpen(true)}><strong>4,2 млн</strong><span>{ru ? "подписчиков Taste" : "Taste followers"}</span></button>
                </div>
              </div>
            </section>

            <section className="spxArtistSection">
              <div className="spxSectionHeading"><h2>{ru ? "На повторе на этой неделе" : "On Repeat This Week"}</h2><button type="button" onClick={() => setShowAll(value => !value)}>{showAll ? (ru ? "Свернуть" : "Show less") : (ru ? "Все 8 треков" : "See all 8")}</button></div>
              <div className="spxRepeatList">
                {weeklyRows.map((item, index) => (
                  <article className={`${activeItemId === `travis_queue_${item.track.id}` ? "spxRepeatRow playing" : "spxRepeatRow"}`} key={item.track.id}>
                    <button className="spxRepeatMain" type="button" onClick={() => openTrack(item)}>
                      <span className="spxTrackIndex">{index + 1}</span>
                      <TrackArtwork src={item.track.coverUrl} fallbackSrc={item.track.fallbackCoverUrl} alt={`${item.track.title} cover`} className="spxRepeatCover" />
                      <span className="spxRepeatCopy"><strong>{item.track.title}</strong><small>{item.track.artist}</small><em>{signalLabel(item.kind, ru)} · {localizedLastPlayed(item.lastPlayed, ru)} · {item.plays} {ru ? repeatWord(item.plays) : "plays"}</em>{item.authorNote ? <i className="spxTrackNoteIndicator"><Icon name="comment" size={12} />{ru ? "Комментарий Трэвиса" : "Travis note"}</i> : null}</span>
                      <span className="spxRepeatPlay"><Icon name={activeItemId === `travis_queue_${item.track.id}` && !paused ? "pause" : "play"} size={17} /></span>
                    </button>
                    {item.authorNote ? <button className={`spxRowComment hasNote ${discussion?.track.id === item.track.id ? "active" : ""}`} type="button" onClick={() => toggleDiscussion(item)} aria-label={ru ? `Комментарий Трэвиса к ${item.track.title}` : `Travis's note on ${item.track.title}`}><Icon name="comment" size={17} /></button> : null}
                  </article>
                ))}
              </div>
              {discussion ? (
                <div className="spxDiscussion" data-artist-discussion>
                  <div className="spxDiscussionHead"><TrackArtwork src={discussion.track.coverUrl} fallbackSrc={discussion.track.fallbackCoverUrl} alt="" className="spxDiscussionCover" /><span><strong>{discussion.track.title}</strong><small>{discussion.track.artist}</small></span><button type="button" onClick={() => setDiscussion(null)} aria-label={ru ? "Закрыть" : "Close"}><Icon name="close" size={18} /></button></div>
                  <blockquote><strong>{travis.name}</strong><p>{ru ? "Обратите внимание на переход во второй половине." : discussion.authorNote}</p></blockquote>
                </div>
              ) : null}
            </section>

            <section className="spxArtistSection">
              <div className="spxSectionHeading"><h2>{ru ? "Недавние открытия" : "Recently Discovered"}</h2><span>{ru ? "За 7 дней" : "Last 7 days"}</span></div>
              <div className="spxDiscoveryShelf">
                {recentlyDiscoveredTracks.map((item, index) => <button type="button" onClick={() => playQueue(discoveryQueue, index)} key={item.track.id}><TrackArtwork src={item.track.coverUrl} fallbackSrc={item.track.fallbackCoverUrl} alt={`${item.track.title} cover`} className="spxDiscoveryCover" /><strong>{item.track.title}</strong><small>{item.track.artist}</small></button>)}
              </div>
            </section>

            <details className="spxArtistDetails">
              <summary>{ru ? "Как получены эти данные" : "About these listening signals"}</summary>
              <p>{ru ? "Это иллюстративная история Трэвиса для продуктового демо. Треки, обложки и плеер Spotify настоящие. В продукте такая история появляется только с явного согласия владельца профиля и может публиковаться с задержкой." : "Travis's activity is illustrative for this product demo. Tracks, artwork and Spotify playback are real. In product, this history appears only with the profile owner's explicit consent and can be delayed."}</p>
              <Link href="/artist-onboarding">{ru ? "Подключение артиста через Spotify for Artists" : "Artist activation through Spotify for Artists"}<Icon name="chevronRight" size={16} /></Link>
            </details>
          </>
        ) : null}

        {activeTab === "music" ? <section className="spxArtistStandard"><h2>{ru ? "Популярное" : "Popular"}</h2><SpotifyEmbed src={travis.spotifyEmbedUrl || ""} title="Travis Scott on Spotify" size="artist" /></section> : null}
        {activeTab === "events" ? <section className="spxArtistEmpty"><Icon name="clock" size={28} /><h2>{ru ? "Ближайшие концерты" : "Upcoming events"}</h2><p>{ru ? "Актуальные даты и билеты доступны в официальном профиле Spotify." : "Current dates and tickets are available from the official Spotify profile."}</p><a href={travis.spotifyUrl} target="_blank" rel="noreferrer">{ru ? "Открыть в Spotify" : "Open in Spotify"}</a></section> : null}
        {activeTab === "merch" ? <section className="spxArtistEmpty"><Icon name="library" size={28} /><h2>{ru ? "Мерч артиста" : "Artist merch"}</h2><p>{ru ? "Официальные товары доступны на странице артиста Spotify." : "Official items are available from the artist's Spotify page."}</p><a href={travis.spotifyUrl} target="_blank" rel="noreferrer">{ru ? "Открыть в Spotify" : "Open in Spotify"}</a></section> : null}
      </div>
      <ConnectionsDialog
        open={followersOpen}
        onClose={() => setFollowersOpen(false)}
        initialType="followers"
        singleType
        demoProfiles={[
          { handle: "doechii", name: doechii.name, avatarUrl: doechii.avatarUrl, fallbackAvatarUrl: doechii.fallbackAvatarUrl, role: ru ? "Артист" : "Artist", verified: true, href: doechii.spotifyUrl },
          { handle: "tyler-the-creator", name: tyler.name, avatarUrl: tyler.avatarUrl, fallbackAvatarUrl: tyler.fallbackAvatarUrl, role: ru ? "Артист и автор" : "Artist and creator", verified: true, href: tyler.spotifyUrl },
          { handle: "vaka47", name: "Vaka47", avatarUrl: "/avatars/vaka47.jpg", role: ru ? "Слушатель Spotify" : "Spotify listener" },
        ]}
      />
    </main>
  );
}
