"use client";

import Link from "next/link";
import { AvatarImage } from "@/components/AvatarImage";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { feedEvents, hubMetrics, inspiredMixes, travis } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const heroEvent = feedEvents[0];
  const { locale } = useI18n();
  const ru = locale === "ru";

  return (
    <main className="page">
      <div className="grid2">
        <section>
          <div className="eyebrow">Spotify Taste · {ru ? "продуктовый концепт" : "product concept"}</div>
          <h1 className="heroTitle">{ru ? "Слушай через людей, чьему вкусу доверяешь." : "Listen through people you trust."}</h1>
          <p className="lead">
            {ru ? "Социальный слой музыкального discovery, где пользователи подписываются на добровольно открытую историю прослушиваний артистов, спортсменов, актёров, диджеев и других культурных тейстмейкеров." : "A pitch-ready social discovery layer where fans follow the opt-in listening activity of artists, athletes, actors, DJs, creators and other cultural tastemakers."}
          </p>
          <div className="buttonRow">
            <Link className="btn btnPrimary" href="/feed">
              <Icon name="feed" />
              {ru ? "Открыть ленту Taste" : "Explore Taste Feed"}
            </Link>
            <Link className="btn btnGhost" href="/my-taste">
              <Icon name="user" />
              {ru ? "Подключить мой Taste" : "Connect My Taste"}
            </Link>
          </div>
          <div className="section">
            <div className="grid3">
              <article className="metricCard">
                <div className="metricLabel">{ru ? "Подписка на Taste" : "Follow Taste"}</div>
                <div className="metricNumber">1</div>
                <div className="metricDelta">{ru ? "новая связь в графе вкуса" : "new follow relationship"}</div>
              </article>
              <article className="metricCard">
                <div className="metricLabel">Influence Streams</div>
                <div className="metricNumber">{hubMetrics.influenceStreams}</div>
                <div className="metricDelta">{ru ? "иллюстративная метрика" : "illustrative metric"}</div>
              </article>
              <article className="metricCard">
                <div className="metricLabel">Tastemaker Pool</div>
                <div className="metricNumber">{hubMetrics.estimatedEarnings}</div>
                <div className="metricDelta">{ru ? "гипотетический доход" : "hypothetical earnings"}</div>
              </article>
            </div>
          </div>
        </section>

        <aside className="panel">
          <div className="sectionHeader">
            <div>
              <DemoBadge>{ru ? "Карточка артиста Spotify" : "Spotify artist entity"}</DemoBadge>
              <h2 style={{ marginTop: 12 }}>{travis.name}</h2>
              <p className="muted">{ru ? "Артист и культурный тейстмейкер" : travis.role}</p>
            </div>
            <div className="feedAvatar" aria-hidden="true">
              <AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="" />
            </div>
          </div>
          <Link className="feedCard previewFeedCard" href="/player/euphoria">
            <div className="feedAvatarWrap">
              <div className="feedAvatar">
                <AvatarImage
                  src={travis.avatarUrl}
                  fallbackSrc={travis.fallbackAvatarUrl}
                  alt={`${travis.name} artist image from Spotify`}
                />
              </div>
              <span className="liveDot" aria-hidden="true" />
            </div>
            <div className="feedText">
              <div className="feedMeta">
                <strong>{travis.name}</strong>
                <span>{ru ? "2 мин назад" : heroEvent.timestampLabel}</span>
                <span className="statusPill">{ru ? "Слушает сейчас" : "Now playing"}</span>
              </div>
              <div className="feedTrackBlock">
                <div className="feedTrack">{heroEvent.track.title}</div>
                <div className="feedArtist">{heroEvent.track.artist}</div>
              </div>
              <div className="feedSignal">
                <Icon name="feed" size={18} />
                {ru ? "Сейчас вместе с ним слушают 17 тыс. подписчиков" : heroEvent.humanSignal}
              </div>
            </div>
            <TrackArtwork
              src={heroEvent.track.coverUrl}
              fallbackSrc={heroEvent.track.fallbackCoverUrl}
              alt={`${heroEvent.track.title} album cover from Spotify`}
              className="feedCover"
            />
          </Link>
          <div className="section">
            <h3>{ru ? "Сценарий демонстрации" : "Demo sequence"}</h3>
            <div className="modelSteps">
              <div className="modelStep">
                <span className="stepNumber">1</span>
                <p className="finePrint">{ru ? "Открой событие Taste и создай сигнал атрибуции." : "Open a Taste Feed card and create a local attribution event."}</p>
              </div>
              <div className="modelStep">
                <span className="stepNumber">2</span>
                <p className="finePrint">{ru ? "Запусти реальный Spotify-плеер на экране Playing from Taste." : "Press play in the real Spotify embed on the Playing from Taste screen."}</p>
              </div>
              <div className="modelStep">
                <span className="stepNumber">3</span>
                <p className="finePrint">{ru ? "Открой аналитику и покажи события атрибуции вместе с экономической моделью." : "Open the Hub and show the prototype event counter plus illustrative economics."}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">{ru ? "Основные сценарии" : "Core product surfaces"}</div>
            <h2>{ru ? "Подписывайся на людей, находи музыку, измеряй влияние." : "Follow people, discover tracks, measure influence."}</h2>
          </div>
          <DemoBadge>{ru ? "Не является данными Spotify" : "Not Spotify data"}</DemoBadge>
        </div>
        <div className="grid3">
          <Link className="panel" href="/tastemaker/travis-scott">
            <Icon name="taste" />
            <h3>{ru ? "Подписка на Taste" : "Follow Taste"}</h3>
            <p className="muted">{ru ? "Верифицированный человек получает управляемый Taste-профиль." : "A verified person gets a controlled Taste surface on Spotify."}</p>
          </Link>
          <Link className="panel" href="/taste/ivan">
            <Icon name="spark" />
            <h3>{ru ? "Публичный Taste" : "Public Taste"}</h3>
            <p className="muted">{ru ? "Реальная публичная история прослушиваний с заметками, комментариями и уведомлениями." : "Follow a real person's public listening history with notes, comments and notifications."}</p>
          </Link>
          <Link className="panel" href="/player/euphoria">
            <Icon name="player" />
            <h3>{ru ? "Прослушивание из Taste" : "Playing from Taste"}</h3>
            <p className="muted">{ru ? "Карточка атрибуции объясняет, благодаря кому найден трек." : "The attribution card explains why a fan is hearing a track."}</p>
          </Link>
          <Link className="panel" href="/privacy">
            <Icon name="privacy" />
            <h3>{ru ? "Контроль доверия" : "Trust controls"}</h3>
            <p className="muted">{ru ? "Добровольное открытие, скрытие, задержка, выбранные сессии и маркировка рекламы." : "Opt-in sharing, hiding, delay, selected sessions and sponsored labels."}</p>
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">{ru ? "Вдохновлено Travis" : "Inspired by Travis"}</div>
            <h2>{ru ? "Живые миксы, собранные из сигнала вкуса." : "Living mixes built from a taste signal."}</h2>
          </div>
        </div>
        <div className="mixGrid">
          {inspiredMixes.map(mix => (
            <Link className="mixCard" href={mix.href} key={mix.id}>
              <TrackArtwork
                src={mix.coverUrl}
                fallbackSrc={mix.fallbackCoverUrl}
                alt={`${mix.title} cover`}
                className="mixArtwork"
              />
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
