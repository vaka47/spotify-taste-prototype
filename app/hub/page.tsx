"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { hubMetrics, topInfluencedTracks } from "@/lib/mock-data";
import { recordTrackOpen } from "@/lib/prototype-events";
import { usePrototypeEventCount } from "@/lib/use-prototype-event-count";
import { useI18n } from "@/lib/i18n";

function formatMetric(value: string, ru: boolean) {
  if (!ru) return value;
  return value.replace(".", ",").replace("M", " млн").replace("K", " тыс.");
}

export default function HubPage() {
  const router = useRouter();
  const eventCount = usePrototypeEventCount();
  const { locale } = useI18n();
  const ru = locale === "ru";

  function openTrack(trackId: string, slug: string) {
    recordTrackOpen("spotify_artist_0Y5tJX1MQlPlqiwlOH1tJY", trackId);
    router.push(`/player/${slug}`);
  }

  return (
    <main className="spxHubPage">
      <header className="spxHubHeader">
        <span>{ru ? "ДЛЯ АРТИСТОВ И АВТОРОВ" : "FOR ARTISTS & CREATORS"}</span>
        <h1>{ru ? "Кабинет Taste" : "Tastemaker Hub"}</h1>
        <p>{ru ? "Как ваш музыкальный вкус помогает людям находить музыку" : "See how your taste helps people discover music"}</p>
      </header>

      <section className="spxGrowthCard" aria-label={ru ? "Рост подписчиков Taste" : "Taste follower growth"}>
        <div className="spxGrowthMetric"><span>{ru ? "Подписчики Taste" : "Taste followers"}<Icon name="info" size={15} /></span><strong>{formatMetric(hubMetrics.tasteFollowers, ru)}</strong><small>↗ +24% {ru ? "за месяц" : "this month"}</small></div>
        <div className="spxGrowthChart">
          <svg viewBox="0 0 620 190" role="img" aria-label={ru ? "Рост с апреля по май" : "Follower growth from April to May"} preserveAspectRatio="none">
            <defs><linearGradient id="taste-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1ed760" stopOpacity=".35" /><stop offset="1" stopColor="#1ed760" stopOpacity="0" /></linearGradient></defs>
            <path d="M6 167 C34 148 46 151 70 136 S108 142 130 125 S164 116 188 119 S226 111 244 98 S276 101 294 83 S328 76 346 62 S378 59 397 43 S434 47 451 30 S487 28 508 18 S546 23 566 7 S594 4 614 -4 L614 188 L6 188 Z" fill="url(#taste-chart-fill)" />
            <path d="M6 167 C34 148 46 151 70 136 S108 142 130 125 S164 116 188 119 S226 111 244 98 S276 101 294 83 S328 76 346 62 S378 59 397 43 S434 47 451 30 S487 28 508 18 S546 23 566 7 S594 4 614 -4" fill="none" stroke="#36df72" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <div><span>Apr 1</span><span>Apr 15</span><span>May 1</span><span>May 15</span><span>May 31</span></div>
        </div>
      </section>

      <section className="spxHubMetrics">
        <article><span>{ru ? "Потоки влияния" : "Influence Streams"}<Icon name="info" size={15} /></span><strong>{formatMetric(hubMetrics.attributedStarts, ru)}</strong><small>↗ +18% {ru ? "за месяц" : "this month"}</small><i><Icon name="feed" size={29} /></i></article>
        <article><span>{ru ? "Сохранения после открытия" : "Discovery saves"}<Icon name="info" size={15} /></span><strong>{formatMetric(hubMetrics.saves, ru)}</strong><small>{ru ? "Высокий интерес" : "High-intent signal"}</small><i><Icon name="save" size={28} /></i></article>
      </section>

      <section className="spxHubPanel">
        <div className="spxHubPanelHead"><h2>{ru ? "Треки, открытые через ваш Taste" : "Top tracks influenced"}</h2><span>{ru ? "Подтверждённые открытия" : "Qualified discoveries"}</span></div>
        <div className="spxInfluencedList">
          {topInfluencedTracks.map(item => (
            <button type="button" key={item.track.id} onClick={() => openTrack(item.track.id, item.track.slug)}>
              <TrackArtwork src={item.track.coverUrl} fallbackSrc={item.track.fallbackCoverUrl} alt={`${item.track.title} cover`} className="spxInfluencedCover" />
              <span><strong>{item.track.artist} · {item.track.title}</strong><i><b style={{ width: `${item.share}%` }} /></i></span>
              <em>{formatMetric(item.qualifiedDiscoveries, ru)}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="spxHubPanel spxHubControls">
        <h2>{ru ? "Управление Taste" : "Controls"}</h2>
        <Link href="/privacy"><span><Icon name="hide" /></span><span><strong>{ru ? "Скрыть трек или артиста" : "Hide a track or artist"}</strong><small>{ru ? "Исключите музыку из публичного профиля" : "Remove music from your public Taste profile"}</small></span><Icon name="chevronRight" /></Link>
        <Link href="/privacy"><span><Icon name="clock" /></span><span><strong>{ru ? "Публиковать с задержкой" : "Delay by 24h"}</strong><small>{ru ? "Новые сигналы появятся через 24 часа" : "Delay the visibility of new listening signals"}</small></span><Icon name="chevronRight" /></Link>
        <Link href="/privacy"><span><Icon name="check" /></span><span><strong>{ru ? "Публиковать только выбранное" : "Share selected only"}</strong><small>{ru ? "Показывайте только подтверждённые вами треки" : "Show only listening you approve"}</small></span><Icon name="chevronRight" /></Link>
        <Link href="/my-taste"><span><Icon name="user" /></span><span><strong>{ru ? "Открыть свой профиль" : "Open your Taste profile"}</strong><small>{ru ? "История, комментарии и публичная ссылка" : "History, comments and your public link"}</small></span><Icon name="chevronRight" /></Link>
        <p><Icon name="privacy" size={14} />{ru ? "Рекламные рекомендации всегда маркируются" : "Sponsored recommendations must always be labeled"}</p>
      </section>

      <details className="spxHubDetails">
        <summary>{ru ? "Экономика и дизайн пилота" : "Economics and pilot design"}</summary>
        <div className="spxHubDetailGrid">
          <article><span>{ru ? "Гипотетический доход" : "Illustrative earnings"}</span><strong>$18,420</strong><p>{ru ? "Отдельный Tastemaker Pool вознаграждает подтверждённые открытия, не уменьшая роялти правообладателей. В MVP выплат нет: сначала доказывается рост сохранений и повторов." : "A separate Tastemaker Pool rewards qualified discoveries without reducing rights-holder royalties. The MVP has no payouts: first prove incremental saves and repeats."}</p></article>
          <article><span>{ru ? "Пилот Spotify" : "Spotify pilot"}</span><strong>4 {ru ? "недели" : "weeks"}</strong><p>{ru ? "50 кураторов, 10 тысяч приглашённых слушателей. Главные показатели: сохранения и повторы новых артистов; защитные метрики: скрытия, жалобы и доля промо." : "50 curators and 10K invited listeners. Primary metrics: saves and repeats of new artists; guardrails: hides, reports and promoted-signal share."}</p></article>
        </div>
        <div className="spxHubDetailLinks"><span>{ru ? `Событий в демо: ${eventCount}` : `Demo events: ${eventCount}`}</span><Link href="/pitch">{ru ? "Открыть презентацию" : "Open Spotify pitch"}<Icon name="chevronRight" size={16} /></Link></div>
      </details>

      <p className="spxHubDisclosure"><Icon name="info" size={13} />{ru ? "Все показатели на этой странице иллюстративны и не являются данными Spotify." : "All metrics on this page are illustrative and are not Spotify data."}</p>
    </main>
  );
}
