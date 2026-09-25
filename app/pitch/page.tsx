"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";

const SLIDE_COUNT = 10;

const productScreens = {
  artist: "/pitch/artist-taste.png",
  feed: "/pitch/taste-feed.png",
  player: "/pitch/taste-player.png",
  hub: "/pitch/tastemaker-hub.png",
};

function ProductScreen({
  src,
  alt,
  className = "",
  priority = true,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={`proposalScreen ${className}`.trim()}>
      <Image src={src} alt={alt} width={941} height={1672} priority={priority} unoptimized sizes="(max-width: 600px) 31vw, 260px" />
    </figure>
  );
}

export default function PitchPage() {
  const [slide, setSlide] = useState(0);
  const [language, setLanguage] = useState<"en" | "ru">("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const ru = language === "ru";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (menuOpen) {
        if (event.key === "Escape") setMenuOpen(false);
        return;
      }
      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        setSlide(current => Math.min(SLIDE_COUNT - 1, current + 1));
      }
      if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        setSlide(current => Math.max(0, current - 1));
      }
      if (event.key === "Home") setSlide(0);
      if (event.key === "End") setSlide(SLIDE_COUNT - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  function openSlide(nextSlide: number) {
    setSlide(nextSlide);
    setMenuOpen(false);
  }

  return (
    <main className="proposalDeck">
      <header className="proposalTopbar">
        <button className="proposalBrand" type="button" onClick={() => openSlide(0)}>
          <span className="brandDisc" aria-hidden="true" />
          <span>
            <strong>Follow Taste</strong>
            <small>{ru ? "продуктовое предложение для Spotify" : "product proposal for Spotify"}</small>
          </span>
        </button>

        <div className="proposalTopActions">
          <div className="proposalLanguage" aria-label={ru ? "Язык презентации" : "Presentation language"}>
            <button className={language === "en" ? "active" : ""} type="button" onClick={() => setLanguage("en")}>EN</button>
            <button className={language === "ru" ? "active" : ""} type="button" onClick={() => setLanguage("ru")}>RU</button>
          </div>
          <Link className="proposalDesktopLink" href="/demo">{ru ? "Видео" : "Video"}</Link>
          <Link className="proposalDesktopLink proposalDesktopLinkPrimary" href="/tastemaker/travis-scott">{ru ? "Продукт" : "Live product"}</Link>
          <a className="proposalDesktopLink" href="mailto:safonov47@gmail.com">{ru ? "Контакты" : "Contact"}</a>
          <button
            className="proposalMenuButton"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="proposal-mobile-menu"
            aria-label={menuOpen ? (ru ? "Закрыть меню" : "Close menu") : (ru ? "Открыть меню" : "Open menu")}
            onClick={() => setMenuOpen(current => !current)}
          >
            <Icon name={menuOpen ? "close" : "menu"} size={20} />
          </button>
        </div>
      </header>

      {menuOpen ? (
        <aside className="proposalMobileMenu" id="proposal-mobile-menu" aria-label={ru ? "Навигация презентации" : "Proposal navigation"}>
          <div className="proposalMobileMenuSection">
            <span>{ru ? "Презентация" : "Presentation"}</span>
            <button type="button" onClick={() => openSlide(0)}>
              <strong>{ru ? "Описание концепции" : "Concept overview"}</strong>
              <small>{ru ? "Проблема, идея и ключевой сценарий" : "Problem, insight and core experience"}</small>
            </button>
            <button type="button" onClick={() => openSlide(2)}>
              <strong>{ru ? "Как работает продукт" : "How the product works"}</strong>
              <small>{ru ? "Профиль артиста, подписка и очередь Taste" : "Artist profile, following and the Taste queue"}</small>
            </button>
            <button type="button" onClick={() => openSlide(7)}>
              <strong>{ru ? "План пилота" : "Pilot plan"}</strong>
              <small>{ru ? "Восемь недель и критерии успеха" : "Eight weeks and success criteria"}</small>
            </button>
          </div>

          <div className="proposalMobileMenuSection proposalMobileMenuResources">
            <span>{ru ? "Материалы" : "Resources"}</span>
            <Link href="/demo" onClick={() => setMenuOpen(false)}><strong>{ru ? "Демо-видео" : "Product video"}</strong><Icon name="play" size={18} /></Link>
            <Link href="/tastemaker/travis-scott" onClick={() => setMenuOpen(false)}><strong>{ru ? "Рабочий продукт" : "Live product"}</strong><Icon name="external" size={17} /></Link>
            <a href="https://github.com/vaka47/spotify-taste-prototype" target="_blank" rel="noreferrer"><strong>GitHub</strong><Icon name="external" size={17} /></a>
          </div>

          <address className="proposalMobileContact">
            <span>{ru ? "Контакты" : "Contact"}</span>
            <strong>Ivan Safonov</strong>
            <a href="mailto:safonov47@gmail.com">safonov47@gmail.com</a>
            <a href="https://www.linkedin.com/in/safonovivan/" target="_blank" rel="noreferrer">LinkedIn</a>
          </address>
        </aside>
      ) : null}

      <div className="proposalViewport">
        {slide === 0 ? (
          <section className="proposalSlide proposalHero">
            <div className="proposalHeroCopy">
              <span className="proposalKicker">{ru ? "ОТКРЫТИЯ ЧЕРЕЗ ЛЮДЕЙ" : "HUMAN-LED DISCOVERY"}</span>
              <h1>Follow Taste</h1>
              <p className="proposalHeroClaim">
                {ru ? "Открывайте музыку через людей, чьему вкусу вы доверяете." : "Discover music through people whose taste you trust."}
              </p>
              <p className="proposalLead">
                {ru
                  ? "Нативный слой Spotify, где слушатели подписываются на добровольно опубликованные музыкальные сигналы артистов, друзей и культурных кураторов."
                  : "A native Spotify layer where listeners follow opt-in music signals from artists, friends and cultural tastemakers."}
              </p>
              <div className="proposalProofLine">
                <span><Icon name="check" size={16} />{ru ? "Работающий прототип" : "Working prototype"}</span>
                <span><Icon name="play" size={16} />{ru ? "Единая очередь Taste" : "One Taste queue"}</span>
                <span><Icon name="privacy" size={16} />{ru ? "Только с согласия" : "Consent first"}</span>
              </div>
            </div>
            <div className="proposalHeroScreens" aria-label={ru ? "Интерфейсы Follow Taste" : "Follow Taste product interfaces"}>
              <ProductScreen src={productScreens.artist} alt={ru ? "Taste в профиле артиста" : "Taste tab on an artist profile"} className="proposalHeroScreenLeft" priority />
              <ProductScreen src={productScreens.feed} alt={ru ? "Общая лента Taste" : "Taste Feed"} className="proposalHeroScreenCenter" priority />
              <ProductScreen src={productScreens.player} alt={ru ? "Плеер с источником рекомендации" : "Player with recommendation provenance"} className="proposalHeroScreenRight" priority />
            </div>
          </section>
        ) : null}

        {slide === 1 ? (
          <section className="proposalSlide">
            <header className="proposalSlideHeader">
              <span className="proposalKicker">{ru ? "ЧЕГО НЕ ХВАТАЕТ" : "THE GAP"}</span>
              <h2>{ru ? "Все необходимые механики уже есть. Нет только слоя человеческого влияния." : "Every primitive exists. The human influence layer does not."}</h2>
            </header>
            <div className="proposalComparison">
              <div><span>Recents</span><strong>{ru ? "Моя память" : "My memory"}</strong><small>{ru ? "Собственная история" : "Personal history"}</small></div>
              <div><span>Listening Activity</span><strong>{ru ? "Присутствие друга" : "Friend presence"}</strong><small>{ru ? "Текущий или последний трек" : "Current or last track"}</small></div>
              <div><span>Following</span><strong>{ru ? "Релизы артиста" : "Artist output"}</strong><small>{ru ? "Что артист выпустил" : "What the artist released"}</small></div>
              <div><span>Artist Pick</span><strong>{ru ? "Ручной выбор" : "Manual curation"}</strong><small>{ru ? "Одна закрепленная рекомендация" : "One pinned selection"}</small></div>
              <div><span>Taste Profile</span><strong>{ru ? "Модель моего вкуса" : "A model of my taste"}</strong><small>{ru ? "Настраивает персонализацию" : "Tunes personalization"}</small></div>
              <div className="proposalComparisonAnswer"><span>Follow Taste</span><strong>{ru ? "Кому я доверяю открытия" : "Who I trust for discovery"}</strong><small>{ru ? "Подписка на понятный человеческий сигнал" : "Followable, explainable human influence"}</small></div>
            </div>
            <div className="proposalSources">
              <span>{ru ? "Опирается на действующие поверхности Spotify:" : "Grounded in current Spotify surfaces:"}</span>
              <a href="https://support.spotify.com/article/recent-activity/" target="_blank" rel="noreferrer">Recents</a>
              <a href="https://support.spotify.com/article/listening-activity/" target="_blank" rel="noreferrer">Listening Activity</a>
              <a href="https://newsroom.spotify.com/2026-03-13/taste-profile-beta-announcement/" target="_blank" rel="noreferrer">Taste Profile</a>
            </div>
          </section>
        ) : null}

        {slide === 2 ? (
          <section className="proposalSlide proposalProductSlide">
            <ProductScreen src={productScreens.artist} alt={ru ? "Вкладка Taste в профиле Travis Scott" : "Taste tab on Travis Scott's artist profile"} className="proposalFeatureScreen" />
            <div className="proposalFeatureCopy">
              <span className="proposalKicker">{ru ? "НАТИВНЫЙ ПРОДУКТ" : "NATIVE PRODUCT"}</span>
              <h2>{ru ? "Новая вкладка Taste в существующем профиле артиста." : "A Taste tab on the artist profile people already know."}</h2>
              <p>{ru ? "Одно нажатие запускает добровольно опубликованную историю за семь дней. Подписка добавляет будущие повторы, открытия и заметки автора в общую ленту." : "One tap plays an opt-in seven-day history. Following adds future repeats, discoveries and author notes to the listener's Taste Feed."}</p>
              <div className="proposalNativeSteps">
                <div><b>1</b><span><strong>{ru ? "Открыть Taste" : "Open Taste"}</strong><small>{ru ? "Нативная вкладка профиля" : "Native profile tab"}</small></span></div>
                <div><b>2</b><span><strong>{ru ? "Подписаться" : "Follow taste"}</strong><small>{ru ? "Отдельно от Follow Artist" : "Separate from Follow Artist"}</small></span></div>
                <div><b>3</b><span><strong>{ru ? "Слушать очередь" : "Play the queue"}</strong><small>{ru ? "Повторы, затем популярность" : "Repeats, then popularity"}</small></span></div>
              </div>
              <div className="proposalPrinciple">
                <Icon name="privacy" size={21} />
                <span><strong>{ru ? "Поведение создает сигнал. Намерение решает, что публиковать." : "Behavior creates the signal. Intent decides what gets published."}</strong><small>{ru ? "Разовое прослушивание не становится публичной рекомендацией." : "A one-off play does not become a public endorsement."}</small></span>
              </div>
            </div>
          </section>
        ) : null}

        {slide === 3 ? (
          <section className="proposalSlide proposalQueueSlide">
            <div className="proposalQueueCopy">
              <span className="proposalKicker">{ru ? "ОЧЕРЕДЬ TASTE" : "TASTE QUEUE"}</span>
              <h2>{ru ? "Не изучайте дашборд. Нажмите Play и слушайте." : "Do not study a dashboard. Press Play and listen."}</h2>
              <p>{ru ? "Taste ведет себя как знакомый плеер Spotify, но сохраняет человеческий источник каждого трека." : "Taste behaves like a familiar Spotify player while preserving the human source behind every track."}</p>
              <div className="proposalQueuePoints">
                <div><Icon name="play" size={20} /><span><strong>{ru ? "Taste одного человека" : "One person's Taste"}</strong><small>{ru ? "Вся неделя одной очередью" : "The full week as one queue"}</small></span></div>
                <div><Icon name="feed" size={20} /><span><strong>{ru ? "Общая лента" : "The full feed"}</strong><small>{ru ? "Все подписки в одном воспроизведении" : "Every followed source in one playback flow"}</small></span></div>
                <div><Icon name="comment" size={20} /><span><strong>{ru ? "Контекст без перегруза" : "Context without clutter"}</strong><small>{ru ? "Источник и заметка появляются только когда полезны" : "Provenance and notes appear only when useful"}</small></span></div>
              </div>
            </div>
            <div className="proposalQueueScreens">
              <ProductScreen src={productScreens.feed} alt={ru ? "Лента рекомендаций Taste" : "Taste recommendation feed"} />
              <ProductScreen src={productScreens.player} alt={ru ? "Плеер Taste с атрибуцией" : "Taste player with attribution"} />
            </div>
          </section>
        ) : null}

        {slide === 4 ? (
          <section className="proposalSlide">
            <header className="proposalSlideHeader">
              <span className="proposalKicker">{ru ? "ДОВЕРИЕ ПО УМОЛЧАНИЮ" : "TRUST BY DESIGN"}</span>
              <h2>{ru ? "Прослушал не значит рекомендует." : "A play is not an endorsement."}</h2>
              <p>{ru ? "Follow Taste публикует сигналы с понятной силой намерения, а не сырую историю наблюдения." : "Follow Taste publishes intent-aware signals, not a raw surveillance feed."}</p>
            </header>
            <div className="proposalSignalLadder">
              <div className="isPrivate"><Icon name="hide" /><span><strong>{ru ? "Разовый запуск" : "One-off play"}</strong><small>{ru ? "Приватно" : "Private"}</small></span></div>
              <div><Icon name="feed" /><span><strong>{ru ? "Повтор" : "Repeat listen"}</strong><small>{ru ? "Сигнал после порога" : "Signal after threshold"}</small></span></div>
              <div><Icon name="save" /><span><strong>{ru ? "Сохранение" : "Saved discovery"}</strong><small>{ru ? "Сильное намерение" : "High intent"}</small></span></div>
              <div className="isRecommended"><Icon name="comment" /><span><strong>{ru ? "Рекомендация" : "Recommendation"}</strong><small>{ru ? "Явная заметка автора" : "Explicit author note"}</small></span></div>
            </div>
            <div className="proposalTrustControls">
              <span><Icon name="privacy" />{ru ? "Только с согласия" : "Opt-in only"}</span>
              <span><Icon name="clock" />{ru ? "Задержка 24 часа" : "24h delay"}</span>
              <span><Icon name="hide" />{ru ? "Скрытие трека или артиста" : "Track and artist exclusions"}</span>
              <span><Icon name="info" />{ru ? "Обязательная маркировка промо" : "Promotion disclosure"}</span>
            </div>
            <div className="proposalTrustStatement">
              <Icon name="spark" size={22} />
              <span><strong>{ru ? "Подлинность - часть продукта, а не текст в правилах." : "Authenticity is product architecture, not policy copy."}</strong><small>{ru ? "Подозрительные циклы и оплаченные органические сигналы исключаются из Influence Streams." : "Suspicious loops and paid organic-looking signals are excluded from Influence Streams."}</small></span>
            </div>
          </section>
        ) : null}

        {slide === 5 ? (
          <section className="proposalSlide">
            <header className="proposalSlideHeader">
              <span className="proposalKicker">{ru ? "ПОДКЛЮЧЕНИЕ АРТИСТА" : "ARTIST ACTIVATION"}</span>
              <h2>{ru ? "Артист включает Taste там, где уже управляет карьерой." : "Artists activate Taste where they already manage their career."}</h2>
              <p>{ru ? "Spotify for Artists уже подтверждает личность, команду и уровень доступа. Follow Taste использует этот слой доверия вместо новой сети аккаунтов." : "Spotify for Artists already verifies identity, team membership and access. Follow Taste reuses that trust layer instead of creating another account system."}</p>
            </header>
            <div className="proposalActivationFlow">
              <div><b>1</b><Icon name="user" size={25} /><span><strong>{ru ? "Подтвердить" : "Verify"}</strong><small>{ru ? "Вход через Spotify for Artists" : "Spotify for Artists sign-in"}</small></span></div>
              <div><b>2</b><Icon name="check" size={25} /><span><strong>{ru ? "Выбрать аккаунт" : "Link listening"}</strong><small>{ru ? "Команда связывает слушательский профиль" : "The team links the listening account"}</small></span></div>
              <div><b>3</b><Icon name="privacy" size={25} /><span><strong>{ru ? "Настроить доступ" : "Set controls"}</strong><small>{ru ? "Сигналы, задержка, исключения" : "Signals, delay and exclusions"}</small></span></div>
              <div><b>4</b><Icon name="taste" size={25} /><span><strong>{ru ? "Проверить 7 дней" : "Review 7 days"}</strong><small>{ru ? "Предпросмотр до публикации" : "Preview before going public"}</small></span></div>
            </div>
            <div className="proposalActivationPolicy">
              <span><Icon name="info" size={20} /><strong>{ru ? "Ручная проверка - исключение" : "Manual review is the exception"}</strong></span>
              <p>{ru ? "Она нужна для неподтвержденного профиля, недоступного администратора, передачи прав лейблу или наследникам." : "Use it for unclaimed profiles, unreachable admins, label transfers or estate rights."}</p>
              <Link href="/artist-onboarding">{ru ? "Открыть сценарий" : "Open activation flow"}<Icon name="external" size={16} /></Link>
            </div>
          </section>
        ) : null}

        {slide === 6 ? (
          <section className="proposalSlide proposalEvidenceSlide">
            <div className="proposalEvidenceCopy">
              <span className="proposalKicker">{ru ? "ПРОТОТИП И ИЗМЕРЕНИЕ" : "WORKING SYSTEM"}</span>
              <h2>{ru ? "Не кликабельный макет. Работающая продуктовая система." : "Not a clickable mock. A functioning product system."}</h2>
              <p>{ru ? "Прототип уже объединяет Spotify OAuth, серверные социальные данные, взаимные подписки, заметки, реакции, уведомления и единую очередь Taste." : "The prototype already combines Spotify OAuth, server-side social data, mutual follows, notes, reactions, notifications and one Taste queue."}</p>
              <div className="proposalSystemGrid">
                <div><strong>Spotify OAuth</strong><small>{ru ? "Профиль и недавние прослушивания" : "Profile and recent listening"}</small></div>
                <div><strong>{ru ? "Серверные данные" : "Server data"}</strong><small>{ru ? "Шифрование токенов + Postgres" : "Encrypted tokens + Postgres"}</small></div>
                <div><strong>{ru ? "Социальный граф" : "Social graph"}</strong><small>{ru ? "Профили, подписки, лента" : "Profiles, follows and feed"}</small></div>
                <div><strong>{ru ? "Воспроизведение" : "Playback"}</strong><small>{ru ? "Единый плеер и очередь" : "One player and queue"}</small></div>
              </div>
              <div className="proposalMetricDefinition">
                <strong>Qualified Discovery</strong>
                <span>{ru ? "Первый запуск из Follow Taste + сохранение, повтор или подписка на артиста в течение 28 дней." : "First play from Follow Taste plus a save, repeat or artist follow within 28 days."}</span>
              </div>
            </div>
            <div className="proposalHubVisual">
              <ProductScreen src={productScreens.hub} alt={ru ? "Кабинет автора с метриками влияния" : "Tastemaker Hub with influence metrics"} className="proposalHubScreen" />
              <small>{ru ? "Иллюстративный интерфейс измерения" : "Illustrative measurement interface"}</small>
            </div>
          </section>
        ) : null}

        {slide === 7 ? (
          <section className="proposalSlide">
            <header className="proposalSlideHeader">
              <span className="proposalKicker">{ru ? "ЗАКРЫТЫЙ ПИЛОТ" : "THE PILOT"}</span>
              <h2>{ru ? "Восемь недель, чтобы проверить ценность и наблюдать 28-дневный повтор." : "Eight weeks to prove value and observe a 28-day repeat."}</h2>
            </header>
            <div className="proposalPilotTimeline">
              <div><span>{ru ? "НЕДЕЛИ 1-2" : "WEEKS 1-2"}</span><strong>{ru ? "Подключение" : "Activate"}</strong><small>{ru ? "50 проверенных диджеев, продюсеров, журналистов и кураторов. Настройки согласия и аудит." : "50 verified DJs, producers, journalists and curators. Consent controls and audit logs."}</small></div>
              <div><span>{ru ? "НЕДЕЛИ 3-4" : "WEEKS 3-4"}</span><strong>{ru ? "Живой тест" : "Live use"}</strong><small>{ru ? "До 10 тысяч приглашенных слушателей. Taste Feed, очередь, заметки и реакции." : "Up to 10K invited listeners. Taste Feed, queue, notes and reactions."}</small></div>
              <div><span>{ru ? "НЕДЕЛИ 5-8" : "WEEKS 5-8"}</span><strong>{ru ? "Наблюдение" : "Observe"}</strong><small>{ru ? "Сохранения, 28-дневные повторы, подписки на артистов и удержание относительно контроля." : "Saves, 28-day repeats, artist follows and retention against control."}</small></div>
            </div>
            <div className="proposalPilotOutcomes">
              <div><Icon name="check" /><span><strong>{ru ? "Критерий успеха" : "Success"}</strong><small>{ru ? "Рост сохранений и повторов новых артистов относительно контрольных рекомендаций." : "Lift in saves and repeat listening for newly discovered artists versus control."}</small></span></div>
              <div><Icon name="privacy" /><span><strong>{ru ? "Ограничения риска" : "Guardrails"}</strong><small>{ru ? "Скрытия, жалобы, отключение публикации, доля промо и ни одного инцидента приватности." : "Hides, reports, sharing opt-outs, promotion share and zero privacy incidents."}</small></span></div>
            </div>
          </section>
        ) : null}

        {slide === 8 ? (
          <section className="proposalSlide">
            <header className="proposalSlideHeader">
              <span className="proposalKicker">{ru ? "ПОЧЕМУ SPOTIFY" : "WHY SPOTIFY"}</span>
              <h2>{ru ? "Только Spotify может сделать человеческий вкус нативным и измеримым." : "Only Spotify can make human taste native and measurable."}</h2>
              <p>{ru ? "Новый формат контента не нужен. Follow Taste соединяет существующие профили, прослушивания, подписки, воспроизведение, Spotify for Artists и рекомендации." : "No new content format is required. Follow Taste connects profiles, listening, follows, playback, Spotify for Artists and recommendations."}</p>
            </header>
            <div className="proposalSpotifyValue">
              <div><Icon name="taste" /><span><strong>{ru ? "Нативная поверхность" : "Native surface"}</strong><small>{ru ? "Taste в существующих профилях" : "Taste on existing profiles"}</small></span></div>
              <div><Icon name="spark" /><span><strong>{ru ? "Уникальный сигнал" : "Exclusive signal"}</strong><small>{ru ? "Данные первого лица + намерение" : "First-party listening plus intent"}</small></span></div>
              <div><Icon name="hub" /><span><strong>{ru ? "Ценность для авторов" : "Creator value"}</strong><small>{ru ? "Влияние за пределами собственного каталога" : "Influence beyond an owned catalog"}</small></span></div>
              <div><Icon name="save" /><span><strong>{ru ? "Ценность для бизнеса" : "Business value"}</strong><small>{ru ? "Удержание, открытия и коммерция для фанатов" : "Retention, discovery and fan commerce"}</small></span></div>
            </div>
            <div className="proposalBusinessNote">
              <strong>{ru ? "Сначала рост графа и доверия." : "Grow trust and the graph first."}</strong>
              <span>{ru ? "Базовая функция остается бесплатной. Будущая ценность - удержание Premium, билеты, мерч и добровольные superfan-инструменты. Без отчислений из роялти и скрытого платного продвижения." : "Keep the core free. Future upside can come from Premium retention, tickets, merch and opt-in superfan depth - never a royalty skim or disguised paid placement."}</span>
            </div>
          </section>
        ) : null}

        {slide === 9 ? (
          <section className="proposalSlide proposalAskSlide">
            <div className="proposalAskCopy">
              <span className="proposalKicker">{ru ? "СЛЕДУЮЩИЙ ШАГ" : "THE ASK"}</span>
              <h2>{ru ? "Провести закрытый пилот Follow Taste внутри Spotify." : "Run a closed Follow Taste pilot inside Spotify."}</h2>
              <p>{ru ? "Нам нужна рабочая встреча с командами Social, Personalization и Spotify for Artists, чтобы проверить модель на данных Spotify и с реальными кураторами, добровольно включившими Taste." : "We are asking for a working session with Social, Personalization and Spotify for Artists to test the model on first-party data and real opt-in curators."}</p>
              <div className="proposalAskActions">
                <Link href="/demo">{ru ? "Смотреть демо - 41 секунда" : "Watch the 41-second demo"}<Icon name="play" size={17} /></Link>
                <Link href="/tastemaker/travis-scott">{ru ? "Открыть продукт" : "Launch the live product"}<Icon name="external" size={16} /></Link>
              </div>
              <p className="proposalContact">
                <span>Ivan Safonov</span>
                <a href="mailto:safonov47@gmail.com">safonov47@gmail.com</a>
                <a href="https://www.linkedin.com/in/safonovivan/" target="_blank" rel="noreferrer">LinkedIn</a>
              </p>
              <small className="proposalBoundary">{ru ? "Независимый продуктовый концепт. Иллюстративная активность знаменитостей требует их согласия и нативной инфраструктуры Spotify." : "Independent product concept. Illustrative celebrity activity requires consent and Spotify's native data infrastructure."}</small>
            </div>
            <div className="proposalClosing">
              <span>{ru ? "История объясняет прошлое." : "History explains the past."}</span>
              <strong>{ru ? "Follow Taste превращает доверие в следующее музыкальное открытие." : "Follow Taste turns trust into the next discovery."}</strong>
              <div className="proposalClosingProof">
                <span><Icon name="check" />Spotify OAuth</span>
                <span><Icon name="check" />Server-backed social graph</span>
                <span><Icon name="check" />Live Taste queue</span>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <footer className="proposalControls">
        <button type="button" onClick={() => setSlide(current => Math.max(0, current - 1))} disabled={slide === 0} aria-label={ru ? "Предыдущий слайд" : "Previous slide"} title={ru ? "Предыдущий слайд" : "Previous slide"}><Icon name="chevronLeft" /></button>
        <div className="proposalDots">{Array.from({ length: SLIDE_COUNT }, (_, index) => <button type="button" className={index === slide ? "active" : ""} onClick={() => setSlide(index)} key={index} aria-label={`${ru ? "Слайд" : "Slide"} ${index + 1}`} />)}</div>
        <span>{String(slide + 1).padStart(2, "0")} / {String(SLIDE_COUNT).padStart(2, "0")}</span>
        <button type="button" onClick={() => setSlide(current => Math.min(SLIDE_COUNT - 1, current + 1))} disabled={slide === SLIDE_COUNT - 1} aria-label={ru ? "Следующий слайд" : "Next slide"} title={ru ? "Следующий слайд" : "Next slide"}><Icon name="chevronRight" /></button>
      </footer>
    </main>
  );
}
