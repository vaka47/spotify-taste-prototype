"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { hubMetrics, topInfluencedTracks } from "@/lib/mock-data";
import { recordTrackOpen } from "@/lib/prototype-events";
import { usePrototypeEventCount } from "@/lib/use-prototype-event-count";
import { useI18n } from "@/lib/i18n";

const funnel = [
  { key: "starts", value: hubMetrics.attributedStarts, width: 100 },
  { key: "first", value: hubMetrics.firstListens, width: 72 },
  { key: "saves", value: hubMetrics.saves, width: 48 },
  { key: "repeats", value: hubMetrics.repeats, width: 31 },
  { key: "follows", value: hubMetrics.artistFollows, width: 18 },
] as const;

export default function HubPage() {
  const router = useRouter();
  const eventCount = usePrototypeEventCount();
  const { locale } = useI18n();
  const ru = locale === "ru";
  const funnelLabels = ru
    ? { starts: "Запуски из Follow Taste", first: "Первые прослушивания", saves: "Сохранения", repeats: "Повторы через 28 дней", follows: "Подписки на артиста" }
    : { starts: "Starts from Follow Taste", first: "First listens", saves: "Saves", repeats: "28-day repeats", follows: "Artist follows" };

  function openTrack(trackId: string, slug: string) {
    recordTrackOpen("spotify_artist_0Y5tJX1MQlPlqiwlOH1tJY", trackId);
    router.push(`/player/${slug}`);
  }

  return (
    <main className="page nativeAnalyticsPage">
      <header className="analyticsHero">
        <div>
          <div className="eyebrow">{ru ? "АНАЛИТИКА FOLLOW TASTE" : "FOLLOW TASTE ANALYTICS"}</div>
          <h1>{ru ? "Влияние измеряется поведением после открытия." : "Influence is what happens after discovery."}</h1>
          <p>{ru ? "Не считаем случайный клик влиянием. Сигнал становится квалифицированным, когда новое прослушивание приводит к сохранению, повтору или подписке на артиста." : "A click is not influence. A discovery qualifies when a first listen leads to a save, repeat listen or artist follow."}</p>
        </div>
        <DemoBadge>{ru ? "Иллюстративная модель · не данные Spotify" : "Illustrative model · not Spotify data"}</DemoBadge>
      </header>

      <section className="analyticsMetricGrid" aria-label={ru ? "Ключевые метрики" : "Key metrics"}>
        <article><span>{ru ? "Подписчики Taste" : "Taste followers"}</span><strong>{hubMetrics.tasteFollowers}</strong><small>{ru ? "люди, выбравшие человеческий источник" : "people choosing a human source"}</small></article>
        <article><span>{ru ? "Квалифицированные открытия" : "Qualified discoveries"}</span><strong>{hubMetrics.qualifiedDiscoveries}</strong><small>{ru ? "первый запуск + действие высокого намерения" : "first play + high-intent action"}</small></article>
        <article><span>{ru ? "Сохранение после открытия" : "Post-discovery save rate"}</span><strong>{hubMetrics.saveRate}</strong><small>{ru ? "основной ранний показатель качества" : "primary early quality signal"}</small></article>
        <article><span>{ru ? "Повтор через 28 дней" : "28-day repeat rate"}</span><strong>{hubMetrics.repeat28d}</strong><small>{ru ? "долгосрочная ценность рекомендации" : "long-term recommendation value"}</small></article>
      </section>

      <section className="analyticsSplit section">
        <article className="analyticsSurface">
          <div className="nativeSectionHeader"><div><h2>{ru ? "Воронка влияния" : "Influence funnel"}</h2><p>{ru ? "Атрибуция заканчивается не на клике, а на подтверждённом намерении." : "Attribution continues beyond the click to verified intent."}</p></div></div>
          <div className="discoveryFunnel">
            {funnel.map(item => <div className="funnelRow" key={item.key}><span>{funnelLabels[item.key]}</span><div><i style={{ width: `${item.width}%` }} /></div><strong>{item.value}</strong></div>)}
          </div>
          <p className="analyticsDefinition"><Icon name="info" size={17} />{ru ? "Окно атрибуции: первый запуск из Taste → сохранение, повтор или подписка в течение 28 дней." : "Attribution window: first play from Taste → save, repeat or artist follow within 28 days."}</p>
        </article>

        <article className="analyticsSurface">
          <div className="nativeSectionHeader"><div><h2>{ru ? "Контракт качества" : "Quality contract"}</h2><p>{ru ? "Правила, которые не дают человеческому влиянию превратиться в скрытое платное продвижение." : "Guardrails that keep human influence from becoming payola."}</p></div></div>
          <div className="integrityList">
            <div><Icon name="check" /><span><strong>{ru ? "Значимые сигналы" : "Meaningful signals"}</strong><small>{ru ? "Повторы, сохранения и явные рекомендации; разовые запуски скрыты." : "Repeats, saves and explicit recommendations; one-off plays stay private."}</small></span></div>
            <div><Icon name="privacy" /><span><strong>{ru ? "Согласие и задержка" : "Consent and delay"}</strong><small>{ru ? "Opt-in, задержка 24 часа, скрытие треков и артистов." : "Opt-in, 24-hour delay, track and artist exclusions."}</small></span></div>
            <div><Icon name="info" /><span><strong>{ru ? "Маркировка промо" : "Promotion disclosure"}</strong><small>{ru ? "Оплаченный сигнал всегда отделён от органической рекомендации." : "Paid signals are always separated from organic recommendations."}</small></span></div>
            <div><Icon name="hide" /><span><strong>{ru ? "Антифрод до экономики" : "Integrity before economics"}</strong><small>{ru ? "Подозрительные цепочки исключаются; выплаты не входят в MVP." : "Suspicious paths are excluded; payouts are outside the MVP."}</small></span></div>
          </div>
          <Link className="nativeTextLink analyticsPrivacyLink" href="/privacy">{ru ? "Открыть настройки доверия" : "Open trust controls"}<Icon name="chevronRight" size={17} /></Link>
        </article>
      </section>

      <section className="analyticsSplit section">
        <article className="analyticsSurface">
          <div className="nativeSectionHeader"><div><h2>{ru ? "Треки с подтверждённым влиянием" : "Top qualified discoveries"}</h2><p>{ru ? "Только открытия, после которых появилось действие высокого намерения." : "Only discoveries followed by a high-intent action."}</p></div></div>
          <div className="influencedList">
            {topInfluencedTracks.map(item => (
              <button className="influencedTrack" type="button" key={item.track.id} onClick={() => openTrack(item.track.id, item.track.slug)}>
                <TrackArtwork src={item.track.coverUrl} fallbackSrc={item.track.fallbackCoverUrl} alt={`${item.track.title} cover`} className="trackThumb" />
                <div><span className="trackTitle">{item.track.artist} · {item.track.title}</span><div className="bar"><span style={{ width: `${item.share}%` }} /></div></div>
                <strong>{item.qualifiedDiscoveries}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="analyticsSurface pilotReadout">
          <div className="nativeSectionHeader"><div><h2>{ru ? "Дизайн пилота" : "Pilot design"}</h2><p>{ru ? "Минимальный тест, который способен доказать ценность Spotify." : "The smallest test that can prove value to Spotify."}</p></div></div>
          <dl>
            <div><dt>{ru ? "Участники" : "Supply"}</dt><dd>{ru ? "50 диджеев, продюсеров и кураторов" : "50 DJs, producers and curators"}</dd></div>
            <div><dt>{ru ? "Аудитория" : "Audience"}</dt><dd>{ru ? "10 тыс. приглашённых слушателей" : "10K invited listeners"}</dd></div>
            <div><dt>{ru ? "Срок" : "Duration"}</dt><dd>{ru ? "4 недели" : "4 weeks"}</dd></div>
            <div><dt>{ru ? "Основная метрика" : "Primary metric"}</dt><dd>{ru ? "Сохранения и повторы новых артистов" : "Saves and repeats of newly discovered artists"}</dd></div>
            <div><dt>{ru ? "Контроль риска" : "Guardrail"}</dt><dd>{ru ? "Скрытия, жалобы и доля промо-сигналов" : "Hides, reports and promoted-signal share"}</dd></div>
          </dl>
          <div className="localProof"><span>{ru ? "Локальных демособытий" : "Local demo events"}</span><strong>{eventCount}</strong></div>
          <Link className="nativePrimaryButton" href="/pitch">{ru ? "Открыть pitch для Spotify" : "Open Spotify pitch"}</Link>
        </article>
      </section>

      <section className="creatorEconomics section" aria-labelledby="taste-economics-title">
        <div className="nativeSectionHeader creatorEconomicsHeader">
          <div>
            <h2 id="taste-economics-title">{ru ? "Экономика Taste" : "Taste economics"}</h2>
            <p>{ru ? "Гипотеза для пилота: вознаграждать подтверждённое влияние, не уменьшая роялти правообладателей." : "Pilot hypothesis: reward verified influence without reducing rights-holder royalties."}</p>
          </div>
          <DemoBadge>{ru ? "Иллюстративная экономика · не данные Spotify" : "Illustrative economics · not Spotify data"}</DemoBadge>
        </div>

        <div className="creatorEconomicsGrid">
          <article className="economicsPrimary">
            <span>{ru ? "Оценочный доход от Taste" : "Estimated Taste earnings"}</span>
            <strong>$18,420</strong>
            <small>{ru ? "Гипотетическая выплата за месяц" : "Hypothetical monthly payout"}</small>
            <ol>
              <li><b>1</b><span><strong>{ru ? "Spotify формирует Tastemaker Pool" : "Spotify funds a Tastemaker Pool"}</strong><small>{ru ? "Отдельно от расчёта роялти артистов и правообладателей." : "Separate from artist and rights-holder royalty accounting."}</small></span></li>
              <li><b>2</b><span><strong>{ru ? "Доля зависит от подтверждённого влияния" : "Verified influence creates a pool share"}</strong><small>{ru ? "Учитываются открытия, сохранения, повторы и подписки на артиста." : "Qualified discoveries, saves, repeats and artist follows are weighted."}</small></span></li>
              <li><b>3</b><span><strong>{ru ? "Тейстмейкер получает вознаграждение" : "The tastemaker earns a payout"}</strong><small>{ru ? "Только после антифрод-проверки и обязательной маркировки промо." : "Only after integrity checks and mandatory promotion disclosure."}</small></span></li>
            </ol>
          </article>

          <article className="economicsExperiments">
            <h3>{ru ? "Порядок экспериментов" : "Experiment sequence"}</h3>
            <div className="economicsExperiment recommended"><span className="experimentRadio" /><span><strong>Tastemaker Pool</strong><small>{ru ? "Первый тест: бесплатный доступ для слушателей и вознаграждение за качество открытий." : "First test: free listener access and rewards based on discovery quality."}</small></span></div>
            <div className="economicsExperiment"><span className="experimentRadio" /><span><strong>Taste+</strong><small>{ru ? "Дополнительный уровень с более глубокой историей, миксами и социальными функциями." : "An add-on with deeper history, living mixes and richer social discovery."}</small></span></div>
            <div className="economicsExperiment"><span className="experimentRadio" /><span><strong>{ru ? "Подписка на отдельный Taste" : "Per-tastemaker subscription"}</strong><small>{ru ? "Поздний эксперимент с высоким риском для аутентичности сигнала." : "A later experiment with a higher authenticity risk."}</small></span></div>
            <p><Icon name="info" size={16} />{ru ? "В MVP нет выплат и платных размещений. Сначала доказываем прирост качественных открытий." : "The MVP has no payouts or paid placements. First prove incremental discovery quality."}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
