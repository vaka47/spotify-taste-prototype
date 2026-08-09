"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { inspiredMixes, travis, travisWeeklyHistory } from "@/lib/mock-data";
import { recordTrackOpen } from "@/lib/prototype-events";
import { useFollowingTaste } from "@/lib/use-following-taste";
import type { WeeklyTrackSignal } from "@/types/taste";
import { useI18n } from "@/lib/i18n";

function localizedLastPlayed(value: string, ru: boolean) {
  if (!ru) return value;
  return value
    .replace("2 min ago", "2 мин назад")
    .replace("20 min ago", "20 мин назад")
    .replace("1h ago", "1 ч назад")
    .replace("Yesterday", "вчера")
    .replace("Today", "сегодня")
    .replace("2d ago", "2 дн назад")
    .replace("3d ago", "3 дн назад")
    .replace("5d ago", "5 дн назад");
}

function WeeklyTrackRow({ item, index }: { item: WeeklyTrackSignal; index: number }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { locale } = useI18n();
  const ru = locale === "ru";

  function openTrack() {
    recordTrackOpen(travis.id, item.track.id);
    showToast(ru ? `Открываем ${item.track.title}` : `Opening ${item.track.title}`);
    router.push(`/player/${item.track.slug}`);
  }

  return (
    <button className="weeklyTrackRow" type="button" onClick={openTrack} aria-label={`${item.track.title}, ${item.plays} plays`}>
      <span className="trackNumber">{index + 1}</span>
      <TrackArtwork src={item.track.coverUrl} fallbackSrc={item.track.fallbackCoverUrl} alt={`${item.track.title} cover`} className="trackThumb" />
      <span className="weeklyTrackCopy">
        <strong>{item.track.title}</strong>
        <span>{item.track.artist}</span>
        <em>{localizedLastPlayed(item.lastPlayed, ru)}</em>
      </span>
      <span className="weeklyTrackMetrics">
        <span className="weeklyTrackMetric"><strong>{item.plays}</strong><span>{ru ? "за 7 дней" : "7-day plays"}</span></span>
        <span className="weeklyTrackMetric"><strong>{item.popularity}</strong><span>{ru ? "популярность" : "popularity"}</span></span>
      </span>
      <span className="rowOpenIcon" aria-hidden="true"><Icon name="play" size={17} /></span>
    </button>
  );
}

export default function TravisTastePage() {
  const { following, toggle } = useFollowingTaste(travis.id);
  const { showToast } = useToast();
  const { locale } = useI18n();
  const ru = locale === "ru";

  function toggleFollow() {
    toggle();
    showToast(following
      ? (ru ? "Вы отписались от Taste Трэвиса" : "Unfollowed Travis's Taste")
      : (ru ? "Вы подписались на Taste Трэвиса" : "Following Travis's Taste"));
  }

  return (
    <main className="page">
      <section className="profileHero tastemakerProfileHero">
        <div className="profileIdentity">
          <div className="profileAvatar">
            <img className="avatarImage" src={travis.avatarUrl} alt="Travis Scott artist image from Spotify" onError={event => { if (travis.fallbackAvatarUrl) event.currentTarget.src = travis.fallbackAvatarUrl; }} />
          </div>
          <div className="profileIdentityCopy">
            <DemoBadge>{ru ? "Карточка артиста Spotify" : "Spotify artist entity"}</DemoBadge>
            <h1 className="profileTitle">{travis.name}<span className="verifiedDot" title="Verified profile"><Icon name="check" size={15} /></span></h1>
            <p className="muted profileMeta">{ru ? "64,7 млн слушателей в месяц · артист и культурный тейстмейкер" : `64.7M monthly listeners · ${travis.role}`}</p>
            <div className="buttonRow profileActions">
              <button className={`btn ${following ? "btnGhost" : "btnPrimary"}`} type="button" onClick={toggleFollow}>
                <Icon name={following ? "check" : "taste"} />
                {following ? (ru ? "Вы подписаны" : "Following Taste") : (ru ? "Подписаться на Taste" : "Follow Taste")}
              </button>
              <a className="btn btnSubtle" href={travis.spotifyUrl} target="_blank" rel="noreferrer"><Icon name="external" />{ru ? "Открыть артиста" : "Open artist"}</a>
            </div>
          </div>
        </div>
      </section>

      <section className="grid4 section tastemakerStats" aria-label="Illustrative weekly Taste statistics">
        <article className="metricCard"><div className="metricLabel">{ru ? "Прослушиваний" : "Plays"}</div><div className="metricNumber">52</div><div className="metricDelta">{ru ? "за 7 дней" : "last 7 days"}</div></article>
        <article className="metricCard"><div className="metricLabel">{ru ? "Уникальных треков" : "Unique tracks"}</div><div className="metricNumber">8</div><div className="metricDelta">{ru ? "за 7 дней" : "last 7 days"}</div></article>
        <article className="metricCard"><div className="metricLabel">{ru ? "Минут" : "Minutes"}</div><div className="metricNumber">196</div><div className="metricDelta">{ru ? "за 7 дней" : "last 7 days"}</div></article>
        <article className="metricCard"><div className="metricLabel">{ru ? "Новых открытий" : "New discoveries"}</div><div className="metricNumber">4</div><div className="metricDelta">{ru ? "иллюстративно" : "illustrative"}</div></article>
      </section>

      <section className="section weeklyHistorySection">
        <div className="sectionHeader">
          <div className="sectionTitleStack"><div className="eyebrow">Taste · 7 days</div><h2>{ru ? "История прослушиваний" : "Listening history"}</h2></div>
          <DemoBadge>{ru ? "Иллюстративная активность" : "Illustrative activity"}</DemoBadge>
        </div>
        <div className="weeklyTrackList">
          {travisWeeklyHistory.map((item, index) => <WeeklyTrackRow item={item} index={index} key={item.track.id} />)}
        </div>
      </section>

      <section className="section inspiredSection">
        <div className="sectionHeader">
          <div className="sectionTitleStack"><div className="eyebrow">{ru ? "Вдохновлено Travis" : "Inspired by Travis"}</div><h2>{ru ? "Живые миксы из его Taste-сигнала" : "Living mixes from his Taste signal"}</h2></div>
        </div>
        <div className="mixGrid">
          {inspiredMixes.map(mix => (
            <Link className="mixCard" href={mix.href} key={mix.id}>
              <TrackArtwork src={mix.coverUrl} fallbackSrc={mix.fallbackCoverUrl} alt={`${mix.title} cover`} className="mixArtwork" />
              <div className="mixContent">
                <DemoBadge>{ru ? "Иллюстративный микс" : "Illustrative mix"}</DemoBadge>
                <h3>{mix.title}</h3>
                <p className="muted">{ru ? (mix.id === "rodeo-radio" ? "Живой микс из добровольно опубликованного Taste-сигнала Трэвиса" : "Мелодичный рэп, Хьюстон и неожиданные музыкальные открытия") : mix.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
