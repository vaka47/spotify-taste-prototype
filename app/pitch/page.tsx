"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { hubMetrics, tracks, travis } from "@/lib/mock-data";

const SLIDE_COUNT = 9;

export default function PitchPage() {
  const [slide, setSlide] = useState(0);
  const [language, setLanguage] = useState<"en" | "ru">("en");
  const ru = language === "ru";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
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
  }, []);

  return (
    <main className="pitchDeck">
      <header className="pitchTopbar">
        <button className="pitchBrand" type="button" onClick={() => setSlide(0)}>
          <span className="brandDisc" aria-hidden="true" />
          <span><strong>Follow Taste</strong><small>{ru ? "продуктовое предложение для Spotify" : "product proposal for Spotify"}</small></span>
        </button>
        <div className="pitchTopActions">
          <div className="pitchLanguage" aria-label="Presentation language">
            <button className={language === "en" ? "active" : ""} type="button" onClick={() => setLanguage("en")}>EN</button>
            <button className={language === "ru" ? "active" : ""} type="button" onClick={() => setLanguage("ru")}>RU</button>
          </div>
          <Link href="/tastemaker/travis-scott">{ru ? "Открыть продукт" : "Open product"}<Icon name="external" size={16} /></Link>
        </div>
      </header>

      <div className="pitchViewport">
        {slide === 0 ? <section className="pitchSlide pitchHeroSlide">
          <div className="pitchHeroCopy">
            <span className="pitchKicker">{ru ? "ОТКРЫТИЯ ЧЕРЕЗ ЛЮДЕЙ" : "HUMAN-LED DISCOVERY"}</span>
            <h1>Follow Taste</h1>
            <p className="pitchClaim">{ru ? "Открывайте музыку через людей, чьему вкусу вы доверяете." : "Discover music through people whose taste you trust."}</p>
            <p className="pitchSupport">{ru ? "Spotify уже показывает, что слушали вы и что сейчас слушает друг. Follow Taste превращает осознанные сигналы людей, чьему вкусу доверяют, в канал музыкальных открытий с подпиской и прозрачной атрибуцией." : "Spotify already shows what you heard and what a friend is playing. Follow Taste turns intentional signals from trusted people into a followable discovery channel with clear attribution."}</p>
          </div>
          <div className="pitchHeroVisual" aria-label="Follow Taste product preview">
            <div className="pitchHeroArtist"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="Travis Scott" /><span><small>{ru ? "Вы подписаны на Taste" : "Following Taste"}</small><strong>Travis Scott</strong></span></div>
            <div className="pitchHeroTrack"><TrackArtwork src={tracks.euphoria.coverUrl} alt="euphoria" /><span><small>{ru ? "РЕКОМЕНДУЕТ · 14 ПРОСЛУШИВАНИЙ" : "RECOMMENDED · 14 PLAYS"}</small><strong>euphoria</strong><em>Kendrick Lamar</em></span><Icon name="play" size={24} /></div>
            <blockquote>{ru ? "«Обратите внимание на переход во второй половине»." : "“Listen for the switch in the second half.”"}</blockquote>
          </div>
        </section> : null}

        {slide === 1 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">{ru ? "ЧЕГО НЕ ХВАТАЕТ" : "THE GAP"}</span><h2>{ru ? "Все необходимые механики уже есть. Нет только слоя человеческого влияния." : "Every primitive exists. The human influence layer does not."}</h2></header>
          <div className="pitchComparison">
            <div><span>Recents</span><strong>{ru ? "Моя память" : "My memory"}</strong><small>{ru ? "Собственная история" : "Personal history"}</small></div>
            <div><span>Listening Activity</span><strong>{ru ? "Присутствие друга" : "Friend presence"}</strong><small>{ru ? "Текущий или последний трек" : "Current or last track"}</small></div>
            <div><span>Following</span><strong>{ru ? "Релизы артиста" : "Artist output"}</strong><small>{ru ? "Что артист выпустил" : "What the artist released"}</small></div>
            <div><span>Artist Pick</span><strong>{ru ? "Ручная редактура" : "Manual curation"}</strong><small>{ru ? "Один закреплённый выбор" : "One pinned selection"}</small></div>
            <div><span>Taste Profile</span><strong>{ru ? "Алгоритмическая модель меня" : "Algorithmic model of me"}</strong><small>{ru ? "Настраивает персонализацию" : "Tunes personalization"}</small></div>
            <div className="pitchComparisonAnswer"><span>Follow Taste</span><strong>{ru ? "Кому я доверяю открытие" : "Who I trust for discovery"}</strong><small>{ru ? "Понятный сигнал влияния с отдельной подпиской" : "Followable, explainable human influence"}</small></div>
          </div>
          <div className="pitchSources"><span>{ru ? "Основано на действующих функциях Spotify:" : "Grounded in current Spotify surfaces:"}</span><a href="https://support.spotify.com/article/recent-activity/" target="_blank" rel="noreferrer">Recents</a><a href="https://support.spotify.com/article/listening-activity/" target="_blank" rel="noreferrer">Listening Activity</a><a href="https://newsroom.spotify.com/2026-03-13/taste-profile-beta-announcement/" target="_blank" rel="noreferrer">Taste Profile</a></div>
        </section> : null}

        {slide === 2 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">{ru ? "ПРОДУКТ" : "THE PRODUCT"}</span><h2>{ru ? "Одно новое действие. Один естественный сценарий открытия музыки." : "One new follow action. One native discovery loop."}</h2></header>
          <div className="pitchJourney">
            <Link href="/tastemaker/travis-scott"><b>1</b><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="" /><span><strong>{ru ? "Открыть Taste артиста" : "Open an artist's Taste"}</strong><small>{ru ? "Нативная вкладка в профиле" : "A native artist-profile tab"}</small></span></Link>
            <Link href="/tastemaker/travis-scott"><b>2</b><Icon name="taste" size={28} /><span><strong>{ru ? "Подписаться на вкус" : "Follow their taste"}</strong><small>{ru ? "Отдельно от подписки на артиста" : "Separate from Follow Artist"}</small></span></Link>
            <Link href="/feed"><b>3</b><TrackArtwork src={tracks.gone.coverUrl} alt="" /><span><strong>{ru ? "Получать значимые сигналы" : "Receive meaningful signals"}</strong><small>{ru ? "Повторы, сохранения, рекомендации" : "Repeats, saves, recommendations"}</small></span></Link>
            <Link href="/feed"><b>4</b><Icon name="play" size={28} /><span><strong>{ru ? "Запустить всю очередь" : "Play the full queue"}</strong><small>{ru ? "Профиль или общая лента — одним нажатием" : "One tap from a profile or the full feed"}</small></span></Link>
          </div>
          <div className="pitchProductPrinciple"><Icon name="spark" size={22} /><span><strong>{ru ? "Контент создаётся поведением, но публикуется намерением." : "Behavior creates the signal; intent decides what gets published."}</strong><small>{ru ? "Функция остаётся лёгкой для автора и понятной для слушателя." : "Low effort for the tastemaker, high context for the listener."}</small></span></div>
        </section> : null}

        {slide === 3 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">{ru ? "ОЧЕРЕДЬ TASTE" : "TASTE QUEUE"}</span><h2>{ru ? "Не изучайте статистику. Включите и слушайте." : "Do not study a dashboard. Press Play and listen."}</h2><p>{ru ? "Очередь сохраняет человеческий контекст, но ощущается как обычный плеер Spotify." : "The queue preserves human context while behaving like a familiar Spotify player."}</p></header>
          <div className="pitchQueueFlow">
            <div><span className="pitchQueueIcon"><Icon name="play" size={24} /></span><span><strong>{ru ? "Слушать Taste артиста" : "Play an artist's Taste"}</strong><small>{ru ? "Вся неделя: сначала повторы, затем популярность" : "The week, ranked by repeats and then popularity"}</small></span></div>
            <div><span className="pitchQueueIcon"><Icon name="feed" size={24} /></span><span><strong>{ru ? "Слушать общую ленту" : "Play the full feed"}</strong><small>{ru ? "Все люди из подписок в одной очереди" : "Every followed tastemaker in one queue"}</small></span></div>
            <div className="pitchQueueComment"><TrackArtwork src={tracks.euphoria.coverUrl} alt="" /><span><small>{ru ? "ПО РЕКОМЕНДАЦИИ TRAVIS SCOTT" : "RECOMMENDED BY TRAVIS SCOTT"}</small><strong>euphoria</strong><p>{ru ? "«Обратите внимание на переход во второй половине»" : "“Listen for the switch in the second half.”"}</p></span><Icon name="volume" size={22} /></div>
          </div>
          <div className="pitchProductPrinciple"><Icon name="comment" size={22} /><span><strong>{ru ? "Комментарий появляется поверх обложки; короткий сигнал можно отключить." : "The note appears over artwork; the short audio cue is optional."}</strong><small>{ru ? "У каждого трека всегда видно, чья рекомендация привела его в очередь." : "Every track keeps visible provenance to the person who put it there."}</small></span></div>
        </section> : null}

        {slide === 4 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">{ru ? "ПОДКЛЮЧЕНИЕ АРТИСТА" : "ARTIST ACTIVATION"}</span><h2>{ru ? "Артист включает Taste там, где уже управляет карьерой." : "Artists activate Taste where they already manage their career."}</h2><p>{ru ? "Spotify for Artists уже подтверждает личность, команду и уровень доступа. Follow Taste использует этот механизм доверия вместо новой ручной проверки." : "Spotify for Artists already verifies identity, team membership and access level. Follow Taste reuses that trust layer instead of inventing a new claim flow."}</p></header>
          <div className="pitchOnboardingFlow">
            <div><b>1</b><Icon name="user" size={24} /><span><strong>Spotify for Artists</strong><small>{ru ? "Вход через рабочий аккаунт" : "Existing work-account sign-in"}</small></span></div>
            <div><b>2</b><Icon name="check" size={24} /><span><strong>{ru ? "Права команды" : "Team permission"}</strong><small>{ru ? "Администратор или редактор подтверждает профиль" : "Admin or Editor confirms the profile"}</small></span></div>
            <div><b>3</b><Icon name="privacy" size={24} /><span><strong>{ru ? "Правила публикации" : "Publishing controls"}</strong><small>{ru ? "Сигналы, задержка, уведомления" : "Signals, delay and notifications"}</small></span></div>
            <div><b>4</b><Icon name="taste" size={24} /><span><strong>{ru ? "7 дней предпросмотра" : "7-day preview"}</strong><small>{ru ? "Проверка до публичного запуска" : "Team review before public launch"}</small></span></div>
          </div>
          <div className="pitchOnboardingPolicy"><span><Icon name="info" size={20} /><strong>{ru ? "Ручная проверка — исключение" : "Manual review is the exception"}</strong></span><p>{ru ? "Она нужна только для неподтверждённого профиля, недоступного администратора, передачи прав лейблу или наследникам." : "Use it only for unclaimed profiles, unreachable admins, label transfers or estate rights."}</p><Link href="/artist-onboarding">{ru ? "Открыть сценарий подключения" : "Open activation flow"}<Icon name="external" size={16} /></Link></div>
        </section> : null}

        {slide === 5 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">{ru ? "ДОВЕРИЕ ПО УМОЛЧАНИЮ" : "TRUST BY DESIGN"}</span><h2>{ru ? "Прослушал не значит рекомендует." : "A play is not an endorsement."}</h2><p>{ru ? "Follow Taste публикует не сырую историю, а сигналы с понятной силой намерения." : "Follow Taste publishes intent-aware signals, not a raw surveillance feed."}</p></header>
          <div className="pitchSignalLadder">
            <div className="private"><Icon name="hide" /><span><strong>{ru ? "Разовый запуск" : "One-off play"}</strong><small>{ru ? "Приватно по умолчанию" : "Private by default"}</small></span></div>
            <div><Icon name="feed" /><span><strong>{ru ? "Повтор" : "Repeat listen"}</strong><small>{ru ? "Автосигнал после порога" : "Auto-signal after threshold"}</small></span></div>
            <div><Icon name="save" /><span><strong>{ru ? "Сохранение" : "Saved discovery"}</strong><small>{ru ? "Высокое намерение" : "High intent"}</small></span></div>
            <div className="recommended"><Icon name="comment" /><span><strong>{ru ? "Рекомендация" : "Recommendation"}</strong><small>{ru ? "Явный комментарий автора" : "Explicit tastemaker note"}</small></span></div>
          </div>
          <div className="pitchTrustControls"><span><Icon name="privacy" />{ru ? "Только с согласия" : "Opt-in"}</span><span><Icon name="clock" />{ru ? "Задержка 24 часа" : "24h delay"}</span><span><Icon name="hide" />{ru ? "Скрытие треков и артистов" : "Track and artist exclusions"}</span><span><Icon name="info" />{ru ? "Маркировка промо" : "Promotion labels"}</span></div>
        </section> : null}

        {slide === 6 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">{ru ? "ИЗМЕРИМОЕ ВЛИЯНИЕ" : "MEASURABLE INFLUENCE"}</span><h2>{ru ? "Не просто ещё один счётчик кликов." : "Not another click counter."}</h2><p>{ru ? "Квалифицированное открытие показывает, превратилось ли человеческое влияние в устойчивое слушательское поведение." : "Qualified Discovery measures whether human influence became durable listener behavior."}</p></header>
          <div className="pitchFunnel">
            <div style={{ width: "100%" }}><span>{ru ? "Запуски из Taste" : "Taste-sourced starts"}</span><strong>{hubMetrics.attributedStarts}</strong></div>
            <div style={{ width: "78%" }}><span>{ru ? "Первые прослушивания" : "First listens"}</span><strong>{hubMetrics.firstListens}</strong></div>
            <div style={{ width: "58%" }}><span>{ru ? "Сохранения" : "Saves"}</span><strong>{hubMetrics.saves}</strong></div>
            <div style={{ width: "40%" }}><span>{ru ? "Повторы через 28 дней" : "28-day repeats"}</span><strong>{hubMetrics.repeats}</strong></div>
            <div style={{ width: "26%" }}><span>{ru ? "Подписки на артиста" : "Artist follows"}</span><strong>{hubMetrics.artistFollows}</strong></div>
          </div>
          <div className="pitchMetricDefinition"><strong>{ru ? "Квалифицированное открытие" : "Qualified discovery"}</strong><span>{ru ? "Первый запуск из Follow Taste + сохранение, повтор или подписка на артиста в течение 28 дней." : "First play from Follow Taste + save, repeat or artist follow within 28 days."}</span></div>
        </section> : null}

        {slide === 7 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">{ru ? "ПИЛОТ" : "THE PILOT"}</span><h2>{ru ? "Доказываем ценность до масштабирования и монетизации." : "Prove value before scale or monetization."}</h2></header>
          <div className="pitchPilotGrid">
            <div><span>50</span><strong>{ru ? "кураторов вкуса" : "tastemakers"}</strong><small>{ru ? "Диджеи, продюсеры, журналисты и кураторы — не звёзды первой величины." : "DJs, producers, journalists and curators — not A-list celebrities."}</small></div>
            <div><span>{ru ? "10 тыс." : "10K"}</span><strong>{ru ? "слушателей" : "listeners"}</strong><small>{ru ? "Приглашённая аудитория, которая активно ищет новую музыку." : "Invited listeners with active discovery behavior."}</small></div>
            <div><span>4</span><strong>{ru ? "недели" : "weeks"}</strong><small>{ru ? "Достаточно, чтобы измерить сохранения и ранние повторы." : "Enough to measure saves and early repeat behavior."}</small></div>
          </div>
          <div className="pitchPilotMeasure"><div><Icon name="check" /><span><strong>{ru ? "Успех" : "Success"}</strong><small>{ru ? "Рост сохранений и повторов новых артистов относительно контрольных рекомендаций." : "Lift in saves and repeats of new artists versus control discovery."}</small></span></div><div><Icon name="privacy" /><span><strong>{ru ? "Контроль риска" : "Guardrails"}</strong><small>{ru ? "Скрытия, жалобы, отключение публикации и доля промо-сигналов." : "Hides, reports, sharing opt-outs and promoted-signal share."}</small></span></div></div>
        </section> : null}

        {slide === 8 ? <section className="pitchSlide pitchAskSlide">
          <div>
            <span className="pitchKicker">{ru ? "ПРЕДЛОЖЕНИЕ" : "THE ASK"}</span>
            <h2>{ru ? "Провести закрытый пилот Follow Taste внутри Spotify." : "Run a closed Follow Taste pilot inside Spotify."}</h2>
            <p>{ru ? "Нам нужна рабочая встреча с командами социальных функций, персонализации и Spotify for Artists, чтобы проверить модель на данных Spotify о воспроизведении и с реальными кураторами, которые добровольно включили Taste." : "We are asking for a working session with Social, Personalization and Spotify for Artists to test the model on first-party playback data and real opt-in curators."}</p>
            <div className="pitchAskActions"><Link href="/tastemaker/travis-scott">{ru ? "Запустить демо" : "Launch live demo"}<Icon name="play" size={17} /></Link><Link href="/hub">{ru ? "Открыть модель измерения" : "Open measurement model"}<Icon name="hub" size={17} /></Link></div>
          </div>
          <div className="pitchClosingStatement"><strong>{ru ? "История — это данные о прошлом." : "History explains the past."}</strong><strong>{ru ? "Follow Taste превращает доверие в следующее открытие." : "Follow Taste turns trust into the next discovery."}</strong></div>
        </section> : null}
      </div>

      <footer className="pitchControls">
        <button type="button" onClick={() => setSlide(current => Math.max(0, current - 1))} disabled={slide === 0} aria-label={ru ? "Предыдущий слайд" : "Previous slide"} title={ru ? "Предыдущий слайд" : "Previous slide"}><Icon name="chevronLeft" /></button>
        <div className="pitchDots">{Array.from({ length: SLIDE_COUNT }, (_, index) => <button type="button" className={index === slide ? "active" : ""} onClick={() => setSlide(index)} key={index} aria-label={`${ru ? "Слайд" : "Slide"} ${index + 1}`} />)}</div>
        <span>{String(slide + 1).padStart(2, "0")} / {String(SLIDE_COUNT).padStart(2, "0")}</span>
        <button type="button" onClick={() => setSlide(current => Math.min(SLIDE_COUNT - 1, current + 1))} disabled={slide === SLIDE_COUNT - 1} aria-label={ru ? "Следующий слайд" : "Next slide"} title={ru ? "Следующий слайд" : "Next slide"}><Icon name="chevronRight" /></button>
      </footer>
    </main>
  );
}
