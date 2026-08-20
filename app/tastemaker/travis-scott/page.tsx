"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { TasteQueuePlayer } from "@/components/TasteQueuePlayer";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { inspiredMixes, recentlyDiscoveredTracks, tracks, travis, travisWeeklyHistory } from "@/lib/mock-data";
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
    .replace("1h ago", "1 ч назад")
    .replace("Yesterday", "вчера")
    .replace("Today", "сегодня")
    .replace("2d ago", "2 дня назад")
    .replace("3d ago", "3 дня назад")
    .replace("5d ago", "5 дней назад");
}

function signalLabel(kind: WeeklyTrackSignal["kind"], ru: boolean) {
  const labels = ru
    ? { recommended: "Рекомендация", on_repeat: "На повторе", saved_discovery: "Сохранено", rediscovered: "Вернулся к треку" }
    : { recommended: "Recommended", on_repeat: "On repeat", saved_discovery: "Saved discovery", rediscovered: "Rediscovered" };
  return labels[kind];
}

export default function TravisTastePage() {
  const router = useRouter();
  const { following, toggle } = useFollowingTaste(travis.id);
  const { showToast } = useToast();
  const { locale } = useI18n();
  const ru = locale === "ru";
  const [activeTab, setActiveTab] = useState<ArtistTab>("taste");
  const [discussion, setDiscussion] = useState<WeeklyTrackSignal | null>(null);
  const [comment, setComment] = useState("");
  const [postedComments, setPostedComments] = useState<string[]>([]);

  function toggleFollow() {
    toggle();
    showToast(following
      ? (ru ? "Taste Трэвиса удалён из вашей ленты" : "Travis's Taste removed from your feed")
      : (ru ? "Taste Трэвиса добавлен в вашу ленту" : "Travis's Taste added to your feed"));
  }

  function openTrack(item: WeeklyTrackSignal) {
    recordTrackOpen(travis.id, item.track.id);
    router.push(`/player/${item.track.slug}`);
  }

  function publishComment() {
    const value = comment.trim();
    if (!value) return;
    setPostedComments(current => [value, ...current]);
    setComment("");
    showToast(ru ? "Комментарий опубликован" : "Comment posted");
  }

  const tabLabels: Record<ArtistTab, string> = ru
    ? { music: "Музыка", events: "Концерты", merch: "Мерч", taste: "Taste" }
    : { music: "Music", events: "Events", merch: "Merch", taste: "Taste" };

  const tasteQueue = travisWeeklyHistory.map(item => ({
    id: `travis_queue_${item.track.id}`,
    track: item.track,
    tastemaker: travis,
    signal: ru
      ? `${item.plays} ${item.plays === 2 || item.plays === 3 || item.plays === 4 ? "прослушивания" : "прослушиваний"} за неделю · ${signalLabel(item.kind, true)}`
      : `${item.plays} plays this week · ${signalLabel(item.kind, false)}`,
    authorNote: item.authorNote ? (ru ? "Обратите внимание на переход во второй половине." : item.authorNote) : null,
  }));

  const discussionPanel = discussion ? (
    <section className="tasteDiscussion">
      <div className="tasteDiscussionTrack">
        <TrackArtwork src={discussion.track.coverUrl} fallbackSrc={discussion.track.fallbackCoverUrl} alt="" className="nativeTrackArtwork" />
        <span><strong>{discussion.track.title}</strong><small>{discussion.track.artist}</small></span>
        <button className="nativeIconAction" type="button" onClick={() => setDiscussion(null)} aria-label={ru ? "Закрыть обсуждение" : "Close discussion"}><Icon name="chevronRight" /></button>
      </div>
      <div className="artistNote"><strong>{travis.name}</strong><p>{discussion.authorNote ? (ru ? "Обратите внимание на переход во второй половине." : discussion.authorNote) : (ru ? "Поделился после нескольких прослушиваний. Это осознанный Taste-сигнал, а не случайный запуск." : "Shared after repeated listening. This is an intentional Taste signal, not an inferred endorsement.")}</p></div>
      <div className="tasteCommentList">
        <div><strong>@nina</strong><span>{ru ? "Именно этот переход и привёл меня сюда." : "That switch is exactly what brought me here."}</span></div>
        {postedComments.map((value, index) => <div key={`${value}-${index}`}><strong>{ru ? "Вы" : "You"}</strong><span>{value}</span></div>)}
      </div>
      <div className="tasteCommentComposer">
        <input value={comment} onChange={event => setComment(event.target.value)} placeholder={ru ? "Добавить комментарий" : "Add a comment"} aria-label={ru ? "Комментарий" : "Comment"} />
        <button type="button" onClick={publishComment} disabled={!comment.trim()}>{ru ? "Опубликовать" : "Post"}</button>
      </div>
    </section>
  ) : null;

  return (
    <main className="artistPage">
      <section className="nativeArtistHero">
        <img
          className="nativeArtistHeroImage"
          src={travis.avatarUrl}
          alt="Travis Scott"
          onError={event => { if (travis.fallbackAvatarUrl) event.currentTarget.src = travis.fallbackAvatarUrl; }}
        />
        <div className="nativeArtistHeroShade" />
        <div className="nativeArtistHeroCopy">
          <div className="verifiedLabel"><span className="verifiedDot"><Icon name="check" size={13} /></span>{ru ? "Подтверждённый исполнитель" : "Verified artist"}</div>
          <h1>{travis.name}</h1>
          <p>{ru ? "64,7 млн слушателей в месяц" : "64.7M monthly listeners"}</p>
        </div>
      </section>

      <div className="artistBody">
        <div className="artistActionBar">
          {activeTab === "taste" ? (
            <TasteQueuePlayer
              items={tasteQueue}
              triggerLabel={ru ? "Слушать Taste" : "Play Taste"}
              triggerAriaLabel={ru ? "Слушать Taste Трэвиса по порядку" : "Play Travis's Taste in order"}
              triggerClassName="nativePlayButton"
              iconOnly
            />
          ) : (
            <button className="nativePlayButton" type="button" aria-label={ru ? "Слушать Travis Scott" : "Play Travis Scott"} onClick={() => router.push(`/player/${tracks.fein.slug}`)}><Icon name="play" size={25} /></button>
          )}
          {activeTab === "taste" ? <span className="artistActionContext">{ru ? "Слушать Taste · 8 треков" : "Play Taste · 8 tracks"}</span> : null}
          <a className="nativeIconAction" href={travis.spotifyUrl} target="_blank" rel="noreferrer" aria-label={ru ? "Открыть в Spotify" : "Open in Spotify"}><Icon name="more" /></a>
        </div>

        <nav className="nativeArtistTabs" aria-label={ru ? "Разделы артиста" : "Artist sections"}>
          {tabs.map(tab => (
            <button className={activeTab === tab ? "active" : ""} type="button" aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} key={tab}>
              {tabLabels[tab]}
            </button>
          ))}
        </nav>

        {activeTab === "taste" ? (
          <section className="artistTasteSurface">
            <header className="tasteIntro">
              <div>
                <h2>{ru ? "Taste Трэвиса" : "Travis's Taste"}</h2>
                <p>{ru ? "Значимые сигналы, которыми Трэвис решил поделиться за последние семь дней." : "Meaningful listening signals Travis chose to share from the last seven days."}</p>
              </div>
              <button className={`nativeFollowButton ${following ? "active" : ""}`} type="button" onClick={toggleFollow}>
                {following ? (ru ? "Вы подписаны на Taste" : "Following Taste") : (ru ? "Подписаться на Taste" : "Follow Taste")}
              </button>
            </header>

            <div className="tasteDemoDisclosure"><Icon name="info" size={15} />{ru ? "История Трэвиса показана как иллюстрация продукта. Треки, обложки и ссылки Spotify настоящие; данные о его прослушиваниях не являются реальными." : "Travis's history is an illustrative product scenario. Tracks, artwork and Spotify links are real; his listening data is not."}</div>

            <div className="tasteTrustLine">
              <span><Icon name="privacy" size={16} />{ru ? "Только с согласия" : "Opt-in only"}</span>
              <span><Icon name="clock" size={16} />{ru ? "Задержка 24 часа" : "24h delay"}</span>
              <span><Icon name="hide" size={16} />{ru ? "Разовые прослушивания скрыты" : "One-off listens hidden"}</span>
              <Link href="/privacy">{ru ? "Как работает приватность" : "How privacy works"}</Link>
            </div>

            <div className="tasteStatStrip" aria-label={ru ? "Статистика за неделю" : "Weekly statistics"}>
              <div><strong>52</strong><span>{ru ? "прослушивания" : "plays"}</span></div>
              <div><strong>8</strong><span>{ru ? "уникальных треков" : "unique tracks"}</span></div>
              <div><strong>196</strong><span>{ru ? "минут" : "minutes"}</span></div>
              <div><strong>4</strong><span>{ru ? "новых открытия" : "new discoveries"}</span></div>
            </div>

            <div className="nativeSectionHeader tasteHistoryHeader">
              <div><h2>{ru ? "История за неделю" : "This week's listening"}</h2><p>{ru ? "Сначала по числу повторов, затем по популярности трека." : "Ranked by repeat plays, then by track popularity."}</p></div>
              <span>{ru ? "7 дней" : "7 days"}</span>
            </div>

            <div className="nativeTrackTable">
              <div className="nativeTrackTableHead" aria-hidden="true"><span>#</span><span>{ru ? "Трек" : "Track"}</span><span>{ru ? "Повторы" : "Plays"}</span><span>{ru ? "Последнее" : "Last played"}</span><span /></div>
              {travisWeeklyHistory.map((item, index) => (
                <div className="nativeTasteTrackGroup" key={item.track.id}>
                  <div className="nativeTasteTrackRow">
                    <button className="nativeTasteTrackMain" type="button" onClick={() => openTrack(item)} aria-label={`${item.track.title}, ${item.plays} plays`}>
                      <span className="nativeTrackNumber">{index + 1}</span>
                      <TrackArtwork src={item.track.coverUrl} fallbackSrc={item.track.fallbackCoverUrl} alt={`${item.track.title} cover`} className="nativeTrackArtwork" />
                      <span className="nativeTrackCopy"><strong>{item.track.title}</strong><span>{item.track.artist}</span></span>
                      <span className={`nativeTrackPlays signal-${item.kind}`}><strong>{item.plays}</strong><span>{signalLabel(item.kind, ru)}</span></span>
                      <span className="nativeTrackLast">{localizedLastPlayed(item.lastPlayed, ru)}</span>
                      <span className="nativeRowPlay"><Icon name="play" size={16} /></span>
                    </button>
                    <button className={`nativeCommentButton ${discussion?.track.id === item.track.id ? "active" : ""}`} type="button" onClick={() => setDiscussion(current => current?.track.id === item.track.id ? null : item)} aria-label={ru ? `Комментарии к ${item.track.title}` : `Comments on ${item.track.title}`}>
                      <Icon name="comment" size={17} /><span>{index < 3 ? index + 1 : 0}</span>
                    </button>
                  </div>
                  {discussion?.track.id === item.track.id ? discussionPanel : null}
                </div>
              ))}
            </div>

            <section className="tasteDiscoverySection">
              <div className="nativeSectionHeader">
                <div><h2>{ru ? "Недавние открытия" : "Recently discovered"}</h2><p>{ru ? "Треки, которые впервые появились в Taste-сигнале на этой неделе." : "Tracks that first appeared in this Taste signal this week."}</p></div>
              </div>
              <div className="nativeShelf tasteDiscoveryShelf">
                {recentlyDiscoveredTracks.map(item => (
                  <Link className="nativeShelfItem" href={`/player/${item.track.slug}`} key={item.track.id}>
                    <TrackArtwork src={item.track.coverUrl} fallbackSrc={item.track.fallbackCoverUrl} alt={`${item.track.title} cover`} className="nativeShelfCover" />
                    <strong>{item.track.title}</strong>
                    <span>{item.track.artist}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="tasteMixSection">
              <div className="nativeSectionHeader">
                <div><h2>{ru ? "Вдохновлено Taste Трэвиса" : "Inspired by Travis's Taste"}</h2><p>{ru ? "Живые миксы, собранные из его добровольно опубликованных сигналов." : "Living mixes built from his opt-in Taste signals."}</p></div>
              </div>
              <div className="tasteMixGrid">
                {inspiredMixes.map(mix => (
                  <Link className="tasteMixItem" href={mix.href} key={mix.id}>
                    <TrackArtwork src={mix.coverUrl} fallbackSrc={mix.fallbackCoverUrl} alt={`${mix.title} cover`} className="tasteMixCover" />
                    <span><small>{ru ? "Иллюстративный микс" : "Illustrative mix"}</small><strong>{mix.title}</strong><em>{ru ? "Собрано из сигналов Taste" : mix.subtitle}</em></span>
                    <Icon name="play" size={18} />
                  </Link>
                ))}
              </div>
            </section>

            <div className="artistTeamEntry">
              <span><Icon name="check" size={17} /><span><strong>{ru ? "Вы представляете артиста?" : "Represent this artist?"}</strong><small>{ru ? "Подключите Taste через подтверждённую команду Spotify for Artists." : "Activate Taste through the verified Spotify for Artists team."}</small></span></span>
              <Link href="/artist-onboarding">{ru ? "Настроить Taste" : "Set up Taste"}<Icon name="chevronRight" size={17} /></Link>
            </div>
          </section>
        ) : null}

        {activeTab === "music" ? (
          <section className="artistStandardSurface">
            <div className="nativeSectionHeader"><div><h2>{ru ? "Популярное" : "Popular"}</h2><p>{ru ? "Официальный каталог артиста в Spotify." : "The artist's official Spotify catalog."}</p></div></div>
            <SpotifyEmbed src={travis.spotifyEmbedUrl || ""} title="Travis Scott on Spotify" size="artist" />
          </section>
        ) : null}

        {activeTab === "events" ? (
          <section className="artistStandardSurface nativeEmptySurface"><Icon name="clock" size={28} /><h2>{ru ? "Ближайшие концерты" : "Upcoming events"}</h2><p>{ru ? "Актуальные даты и билеты открываются в официальном профиле Spotify." : "Current dates and tickets are available from the official Spotify profile."}</p><a className="nativeOutlineButton" href={travis.spotifyUrl} target="_blank" rel="noreferrer">{ru ? "Открыть концерты" : "Open events"}</a></section>
        ) : null}

        {activeTab === "merch" ? (
          <section className="artistStandardSurface nativeEmptySurface"><Icon name="library" size={28} /><h2>{ru ? "Мерч артиста" : "Artist merch"}</h2><p>{ru ? "Официальные товары отображаются на странице артиста Spotify." : "Official items are available from the artist's Spotify page."}</p><a className="nativeOutlineButton" href={travis.spotifyUrl} target="_blank" rel="noreferrer">{ru ? "Открыть мерч" : "Open merch"}</a></section>
        ) : null}
      </div>
    </main>
  );
}
