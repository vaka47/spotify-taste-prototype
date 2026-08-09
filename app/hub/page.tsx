"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { hubMetrics, privacyControls, topInfluencedTracks } from "@/lib/mock-data";
import { recordTrackOpen } from "@/lib/prototype-events";
import { usePrototypeEventCount } from "@/lib/use-prototype-event-count";
import { useI18n } from "@/lib/i18n";

const experiments = [
  "Spotify-funded Tastemaker Pool",
  "Taste+ add-on",
  "Premium Tastemaker subscription",
] as const;

export default function HubPage() {
  const eventCount = usePrototypeEventCount();
  const router = useRouter();
  const { showToast } = useToast();
  const [activeExperiment, setActiveExperiment] = useState<(typeof experiments)[number]>("Spotify-funded Tastemaker Pool");
  const { locale } = useI18n();
  const ru = locale === "ru";
  const privacyRu: Record<string, { title: string; description: string }> = {
    "hide-track": { title: "Скрыть трек", description: "Исключить отдельный трек из публичной истории." },
    "hide-artist": { title: "Скрыть артиста", description: "Не публиковать прослушивания выбранного артиста." },
    delay: { title: "Задержка 24 часа", description: "Не показывать активность в реальном времени." },
    selected: { title: "Только выбранные сессии", description: "Публиковать только явно выбранные прослушивания." },
  };

  function openInfluencedTrack(trackId: string, trackSlug: string, title: string) {
    recordTrackOpen("spotify_artist_0Y5tJX1MQlPlqiwlOH1tJY", trackId);
    showToast(`Opening influenced track: ${title}`);
    router.push(`/player/${trackSlug}`);
  }

  return (
    <main className="page">
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">{ru ? "Аналитика тейстмейкера" : "Tastemaker Hub"}</div>
          <h1 className="pageTitle">{ru ? "Влияние, которое можно измерить." : "Influence, made measurable."}</h1>
          <p className="lead">{ru ? "Для артистов и верифицированных культурных профилей. Вся экономика на экране является предлагаемой продуктовой моделью." : "For artists and verified cultural profiles. All economics here are a proposed product model."}</p>
        </div>
        <DemoBadge>{ru ? "Иллюстративная экономика · не данные Spotify" : "Illustrative economics · not Spotify data"}</DemoBadge>
      </div>

      <section className="panel">
        <div className="sectionHeader" style={{ marginBottom: 0 }}>
          <div>
            <div className="metricLabel">
              {ru ? "Подписчики Taste" : "Taste followers"}
              <button className="inlineIconButton" type="button" aria-label="Taste followers details" onClick={() => showToast("Followers of the proposed Taste surface.")}>
                <Icon name="info" size={17} />
              </button>
            </div>
            <div className="metricNumber">{hubMetrics.tasteFollowers}</div>
            <div className="metricDelta">{ru ? "+380 тыс. за 90 дней" : hubMetrics.tasteFollowersDelta}</div>
          </div>
          <DemoBadge>{ru ? "Иллюстративная метрика профиля" : "Illustrative profile metric"}</DemoBadge>
        </div>
        <div className="hubChart" aria-label="Illustrative Taste followers growth chart">
          <div className="chartFrame">
            <svg viewBox="0 0 620 220" role="img" aria-label="Illustrative follower growth line">
              <defs>
                <linearGradient id="tasteArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1ed760" stopOpacity=".34" />
                  <stop offset="100%" stopColor="#1ed760" stopOpacity=".02" />
                </linearGradient>
              </defs>
              <path
                d="M0 182 C40 166 58 150 92 146 C118 142 132 126 166 125 C198 124 216 115 248 110 C282 104 304 88 338 92 C366 95 382 72 416 67 C452 62 464 49 498 47 C530 45 548 29 584 24 C600 21 610 15 620 10 L620 220 L0 220 Z"
                fill="url(#tasteArea)"
              />
              <path
                d="M0 182 C40 166 58 150 92 146 C118 142 132 126 166 125 C198 124 216 115 248 110 C282 104 304 88 338 92 C366 95 382 72 416 67 C452 62 464 49 498 47 C530 45 548 29 584 24 C600 21 610 15 620 10"
                fill="none"
                stroke="#1ed760"
                strokeLinecap="round"
                strokeWidth="5"
              />
            </svg>
            <div className="chartMonths">
              <span>{ru ? "1 апр" : "Apr 1"}</span>
              <span>{ru ? "15 апр" : "Apr 15"}</span>
              <span>{ru ? "1 мая" : "May 1"}</span>
              <span>{ru ? "15 мая" : "May 15"}</span>
              <span>{ru ? "31 мая" : "May 31"}</span>
            </div>
          </div>
          <div className="chartAxis">
            <span>4.5M</span>
            <span>3.0M</span>
            <span>1.5M</span>
          </div>
        </div>
      </section>

      <section className="grid4 section" aria-label="Hub metrics">
        <article className="metricCard">
          <div className="metricLabel">
            Influence Streams
            <button className="inlineIconButton" type="button" aria-label="Influence Streams details" onClick={() => showToast("Qualified discovery attribution: play, save, repeat and follow.")}>
              <Icon name="info" size={17} />
            </button>
          </div>
          <div className="metricNumber">{hubMetrics.influenceStreams}</div>
          <div className="metricDelta">{ru ? "+18% к прошлому месяцу" : hubMetrics.influenceStreamsDelta}</div>
        </article>
        <article className="metricCard">
          <div className="metricLabel">
            {ru ? "Сохранения после открытия" : "Discovery saves"}
            <button className="inlineIconButton" type="button" aria-label="Discovery saves details" onClick={() => showToast("High-intent saves after a Taste-sourced first listen.")}>
              <Icon name="save" size={17} />
            </button>
          </div>
          <div className="metricNumber">{hubMetrics.discoverySaves}</div>
          <div className="metricDelta">{ru ? "после первого прослушивания из Taste" : hubMetrics.discoverySavesNote}</div>
        </article>
        <article className="metricCard">
          <div className="metricLabel">
            {ru ? "Локальные события браузера" : "Browser-local events"}
            <button className="inlineIconButton" type="button" aria-label="Browser-local event details" onClick={() => showToast("Local events prove the click path only.")}>
              <Icon name="feed" size={17} />
            </button>
          </div>
          <div className="metricNumber">{eventCount}</div>
          <div className="metricDelta">{ru ? "Записано в этом браузере" : "Recorded in this browser"}</div>
        </article>
        <article className="metricCard">
          <div className="metricLabel">
            {ru ? "Официальные данные Spotify" : "Official Spotify data"}
            <button className="inlineIconButton" type="button" aria-label="Official Spotify data details" onClick={() => showToast("Tracks and embeds are real; hub metrics are proposed.")}>
              <Icon name="info" size={17} />
            </button>
          </div>
          <div className="metricNumber">0</div>
          <div className="metricDelta">{ru ? "публичные метрики являются макетом" : "public hub metrics are mock"}</div>
        </article>
      </section>

      <section className="grid2 section">
        <article className="panel">
          <div className="sectionHeader">
            <h2>{ru ? "Треки с наибольшим влиянием" : "Top tracks influenced"}</h2>
            <DemoBadge>{ru ? "Предлагаемая метрика Influence Streams" : "Proposed Influence Streams metric"}</DemoBadge>
          </div>
          <div className="influencedList">
            {topInfluencedTracks.map(item => (
              <button
                className="influencedTrack"
                type="button"
                key={item.track.id}
                onClick={() => openInfluencedTrack(item.track.id, item.track.slug, item.track.title)}
              >
                <TrackArtwork
                  src={item.track.coverUrl}
                  fallbackSrc={item.track.fallbackCoverUrl}
                  alt={`${item.track.title} album cover from Spotify`}
                  className="trackThumb"
                />
                <div style={{ minWidth: 0 }}>
                  <div className="trackTitle">
                    {item.track.artist} - {item.track.title}
                  </div>
                  <div className="bar" aria-hidden="true">
                    <span style={{ width: `${item.share}%` }} />
                  </div>
                </div>
                <strong>{item.influenceStreams}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="earningsCard">
          <DemoBadge>{ru ? "Иллюстративная экономика · не данные Spotify" : "Illustrative economics · not Spotify data"}</DemoBadge>
          <div className="eyebrow" style={{ marginTop: 16 }}>{ru ? "Оценка дохода Taste" : "Estimated Taste Earnings"}</div>
          <div className="earningsNumber">{hubMetrics.estimatedEarnings}</div>
          <p className="muted">
            {ru ? "Гипотетическая месячная доля из фонда тейстмейкеров Spotify. Модель не уменьшает роялти правообладателя найденного трека." : "Hypothetical monthly share from a Spotify-funded Tastemaker Pool. This does not take money from the rights-holder royalty assigned to the discovered track."}
          </p>
          <div className="modelSteps">
            <div className="modelStep">
              <span className="stepNumber">1</span>
              <div>
                <strong>{ru ? "Spotify финансирует фонд тейстмейкеров" : "Spotify funds a Tastemaker Pool"}</strong>
                <p className="finePrint">{ru ? "Отдельный фонд вне расчёта роялти артистов." : "A separate pool, outside artist royalty accounting."}</p>
              </div>
            </div>
            <div className="modelStep">
              <span className="stepNumber">2</span>
              <div>
                <strong>{ru ? "Подтверждённое влияние создаёт долю" : "Verified influence creates a pool share"}</strong>
                <p className="finePrint">{ru ? "Учитываются первое прослушивание, сохранение, повтор и подписка на артиста." : "Qualified discovery can include first play, save, repeat and artist follow."}</p>
              </div>
            </div>
            <div className="modelStep">
              <span className="stepNumber">3</span>
              <div>
                <strong>{ru ? "Тейстмейкер получает доход" : "Tastemaker receives earnings"}</strong>
                <p className="finePrint">{ru ? "Только в рамках пилота с защитой от фрода и правилами прозрачности." : "Only as a proposed pilot with fraud controls and disclosure rules."}</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid2 section">
        <article className="panel">
          <div className="sectionHeader">
            <h2>{ru ? "Эксперименты монетизации" : "Monetization experiments"}</h2>
            <DemoBadge>{ru ? "Вторичные тесты" : "Secondary tests"}</DemoBadge>
          </div>
          <div className="experimentList">
            <button
              className="experimentRow"
              type="button"
              aria-pressed={activeExperiment === experiments[0]}
              onClick={() => {
                setActiveExperiment(experiments[0]);
                showToast(`${experiments[0]} selected`);
              }}
            >
              <span className={`radioDot ${activeExperiment === experiments[0] ? "active" : ""}`} />
              <div>
                <strong>{ru ? "Фонд тейстмейкеров Spotify" : "Spotify-funded Tastemaker Pool"}</strong>
                <p className="finePrint">{ru ? "Рекомендуемая первая модель: вознаграждать подтверждённое влияние, сохраняя Taste доступным." : "Recommended first model: reward verified influence while keeping Taste broadly accessible."}</p>
              </div>
            </button>
            <button
              className="experimentRow"
              type="button"
              aria-pressed={activeExperiment === experiments[1]}
              onClick={() => {
                setActiveExperiment(experiments[1]);
                showToast(`${experiments[1]} selected`);
              }}
            >
              <span className={`radioDot ${activeExperiment === experiments[1] ? "active" : ""}`} />
              <div>
                <strong>{ru ? "Дополнение Taste+" : "Taste+ add-on"}</strong>
                <p className="finePrint">{ru ? "Необязательный платный уровень для глубокой социальной выдачи, живых миксов и расширенной истории." : "Optional paid tier for deeper social discovery, living mixes and richer Taste history."}</p>
              </div>
            </button>
            <button
              className="experimentRow"
              type="button"
              aria-pressed={activeExperiment === experiments[2]}
              onClick={() => {
                setActiveExperiment(experiments[2]);
                showToast(`${experiments[2]} selected`);
              }}
            >
              <span className={`radioDot ${activeExperiment === experiments[2] ? "active" : ""}`} />
              <div>
                <strong>{ru ? "Премиум-подписка на тейстмейкера" : "Premium Tastemaker subscription"}</strong>
                <p className="finePrint">{ru ? "Высокий потенциал, но больший риск для доверия. Оставить на поздний эксперимент." : "High upside, but stronger authenticity risk. Keep as a later experiment."}</p>
              </div>
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="sectionHeader">
            <h2>{ru ? "Настройки" : "Controls"}</h2>
            <DemoBadge>{ru ? "Защита доверия" : "Trust guardrails"}</DemoBadge>
          </div>
          <div className="trackList">
            {privacyControls.slice(1, 5).map(control => (
              <Link className="privacyRow" href="/privacy" key={control.id}>
                <span className="privacyIcon">
                  <Icon name={control.id === "delay" ? "clock" : control.id === "selected" ? "external" : "hide"} />
                </span>
                <div>
                  <strong>{ru ? privacyRu[control.id]?.title || control.title : control.title}</strong>
                  <p className="finePrint">{ru ? privacyRu[control.id]?.description || control.description : control.description}</p>
                </div>
                <span className="muted">&gt;</span>
              </Link>
            ))}
          </div>
          <p className="finePrint" style={{ marginTop: 18, textAlign: "center" }}>
            {ru ? "Оплаченные и промо-размещения Taste всегда должны быть помечены." : "Paid or promoted Taste placements must be labeled."}
          </p>
        </article>
      </section>
    </main>
  );
}
