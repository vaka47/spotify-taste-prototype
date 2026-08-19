"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { hubMetrics, tracks, travis } from "@/lib/mock-data";

const SLIDE_COUNT = 7;

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
          <span><strong>Follow Taste</strong><small>{ru ? "предложение для Spotify" : "product proposal for Spotify"}</small></span>
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
            <span className="pitchKicker">HUMAN-LED DISCOVERY</span>
            <h1>Follow Taste</h1>
            <p className="pitchClaim">{ru ? "Открывайте музыку через людей, чьему вкусу вы доверяете." : "Discover music through people whose taste you trust."}</p>
            <p className="pitchSupport">{ru ? "Spotify уже показывает, что слушали вы и что сейчас слушает друг. Follow Taste превращает осознанные сигналы культурных авторитетов в подписной discovery-канал с понятной атрибуцией." : "Spotify already shows what you heard and what a friend is playing. Follow Taste turns intentional signals from trusted people into a followable discovery channel with clear attribution."}</p>
          </div>
          <div className="pitchHeroVisual" aria-label="Follow Taste product preview">
            <div className="pitchHeroArtist"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="Travis Scott" /><span><small>{ru ? "Вы подписаны на Taste" : "Following Taste"}</small><strong>Travis Scott</strong></span></div>
            <div className="pitchHeroTrack"><TrackArtwork src={tracks.euphoria.coverUrl} alt="euphoria" /><span><small>{ru ? "РЕКОМЕНДУЕТ · 14 ПРОСЛУШИВАНИЙ" : "RECOMMENDED · 14 PLAYS"}</small><strong>euphoria</strong><em>Kendrick Lamar</em></span><Icon name="play" size={24} /></div>
            <blockquote>{ru ? "«Обратите внимание на переход во второй половине»." : "“Listen for the switch in the second half.”"}</blockquote>
          </div>
        </section> : null}

        {slide === 1 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">THE GAP</span><h2>{ru ? "Все детали существуют. Не существует слоя человеческого влияния." : "Every primitive exists. The human influence layer does not."}</h2></header>
          <div className="pitchComparison">
            <div><span>Recents</span><strong>{ru ? "Моя память" : "My memory"}</strong><small>{ru ? "Собственная история" : "Personal history"}</small></div>
            <div><span>Listening Activity</span><strong>{ru ? "Присутствие друга" : "Friend presence"}</strong><small>{ru ? "Текущий или последний трек" : "Current or last track"}</small></div>
            <div><span>Following</span><strong>{ru ? "Релизы артиста" : "Artist output"}</strong><small>{ru ? "Что артист выпустил" : "What the artist released"}</small></div>
            <div><span>Artist Pick</span><strong>{ru ? "Ручная редактура" : "Manual curation"}</strong><small>{ru ? "Один закреплённый выбор" : "One pinned selection"}</small></div>
            <div><span>Taste Profile</span><strong>{ru ? "Алгоритмическая модель меня" : "Algorithmic model of me"}</strong><small>{ru ? "Настраивает персонализацию" : "Tunes personalization"}</small></div>
            <div className="pitchComparisonAnswer"><span>Follow Taste</span><strong>{ru ? "Кому я доверяю открытие" : "Who I trust for discovery"}</strong><small>{ru ? "Подписной, объяснимый сигнал влияния" : "Followable, explainable human influence"}</small></div>
          </div>
          <div className="pitchSources"><span>{ru ? "Основано на официальных поверхностях Spotify:" : "Grounded in current Spotify surfaces:"}</span><a href="https://support.spotify.com/article/recent-activity/" target="_blank" rel="noreferrer">Recents</a><a href="https://support.spotify.com/article/listening-activity/" target="_blank" rel="noreferrer">Listening Activity</a><a href="https://newsroom.spotify.com/2026-03-13/taste-profile-beta-announcement/" target="_blank" rel="noreferrer">Taste Profile</a></div>
        </section> : null}

        {slide === 2 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">THE PRODUCT</span><h2>{ru ? "Один новый CTA. Один естественный путь discovery." : "One new follow action. One native discovery loop."}</h2></header>
          <div className="pitchJourney">
            <Link href="/tastemaker/travis-scott"><b>1</b><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="" /><span><strong>{ru ? "Открыть Taste артиста" : "Open an artist's Taste"}</strong><small>{ru ? "Нативная вкладка в профиле" : "A native artist-profile tab"}</small></span></Link>
            <Link href="/tastemaker/travis-scott"><b>2</b><Icon name="taste" size={28} /><span><strong>{ru ? "Подписаться на вкус" : "Follow their taste"}</strong><small>{ru ? "Отдельно от Follow Artist" : "Separate from Follow Artist"}</small></span></Link>
            <Link href="/feed"><b>3</b><TrackArtwork src={tracks.gone.coverUrl} alt="" /><span><strong>{ru ? "Получать значимые сигналы" : "Receive meaningful signals"}</strong><small>{ru ? "Повторы, сохранения, рекомендации" : "Repeats, saves, recommendations"}</small></span></Link>
            <Link href="/player/euphoria"><b>4</b><Icon name="play" size={28} /><span><strong>{ru ? "Слушать с объяснением" : "Listen with provenance"}</strong><small>{ru ? "Кто повлиял и почему трек здесь" : "Who influenced this discovery and why"}</small></span></Link>
          </div>
          <div className="pitchProductPrinciple"><Icon name="spark" size={22} /><span><strong>{ru ? "Контент создаётся поведением, но публикуется намерением." : "Behavior creates the signal; intent decides what gets published."}</strong><small>{ru ? "Функция остаётся лёгкой для автора и понятной для слушателя." : "Low effort for the tastemaker, high context for the listener."}</small></span></div>
        </section> : null}

        {slide === 3 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">TRUST BY DESIGN</span><h2>{ru ? "Прослушал не значит рекомендует." : "A play is not an endorsement."}</h2><p>{ru ? "Follow Taste публикует не сырую историю, а сигналы с понятной силой намерения." : "Follow Taste publishes intent-aware signals, not a raw surveillance feed."}</p></header>
          <div className="pitchSignalLadder">
            <div className="private"><Icon name="hide" /><span><strong>{ru ? "Разовый запуск" : "One-off play"}</strong><small>{ru ? "Приватно по умолчанию" : "Private by default"}</small></span></div>
            <div><Icon name="feed" /><span><strong>{ru ? "Повтор" : "Repeat listen"}</strong><small>{ru ? "Автосигнал после порога" : "Auto-signal after threshold"}</small></span></div>
            <div><Icon name="save" /><span><strong>{ru ? "Сохранение" : "Saved discovery"}</strong><small>{ru ? "Высокое намерение" : "High intent"}</small></span></div>
            <div className="recommended"><Icon name="comment" /><span><strong>{ru ? "Рекомендация" : "Recommendation"}</strong><small>{ru ? "Явный комментарий автора" : "Explicit tastemaker note"}</small></span></div>
          </div>
          <div className="pitchTrustControls"><span><Icon name="privacy" />Opt-in</span><span><Icon name="clock" />{ru ? "Задержка 24 часа" : "24h delay"}</span><span><Icon name="hide" />{ru ? "Скрытие треков и артистов" : "Track and artist exclusions"}</span><span><Icon name="info" />{ru ? "Маркировка промо" : "Promotion labels"}</span></div>
        </section> : null}

        {slide === 4 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">MEASURABLE INFLUENCE</span><h2>{ru ? "Не ещё один счётчик кликов." : "Not another click counter."}</h2><p>{ru ? "Qualified Discovery измеряет, превратилось ли человеческое влияние в устойчивое слушательское поведение." : "Qualified Discovery measures whether human influence became durable listener behavior."}</p></header>
          <div className="pitchFunnel">
            <div style={{ width: "100%" }}><span>{ru ? "Запуски из Taste" : "Taste-sourced starts"}</span><strong>{hubMetrics.attributedStarts}</strong></div>
            <div style={{ width: "78%" }}><span>{ru ? "Первые прослушивания" : "First listens"}</span><strong>{hubMetrics.firstListens}</strong></div>
            <div style={{ width: "58%" }}><span>{ru ? "Сохранения" : "Saves"}</span><strong>{hubMetrics.saves}</strong></div>
            <div style={{ width: "40%" }}><span>{ru ? "Повторы через 28 дней" : "28-day repeats"}</span><strong>{hubMetrics.repeats}</strong></div>
            <div style={{ width: "26%" }}><span>{ru ? "Подписки на артиста" : "Artist follows"}</span><strong>{hubMetrics.artistFollows}</strong></div>
          </div>
          <div className="pitchMetricDefinition"><strong>{ru ? "Квалифицированное открытие" : "Qualified discovery"}</strong><span>{ru ? "Первый запуск из Follow Taste + сохранение, повтор или подписка на артиста в течение 28 дней." : "First play from Follow Taste + save, repeat or artist follow within 28 days."}</span></div>
        </section> : null}

        {slide === 5 ? <section className="pitchSlide">
          <header className="pitchSlideHeader"><span className="pitchKicker">THE PILOT</span><h2>{ru ? "Доказываем ценность до масштабирования и монетизации." : "Prove value before scale or monetization."}</h2></header>
          <div className="pitchPilotGrid">
            <div><span>50</span><strong>{ru ? "тейстмейкеров" : "tastemakers"}</strong><small>{ru ? "Диджеи, продюсеры, журналисты и кураторы — не A-list-знаменитости." : "DJs, producers, journalists and curators — not A-list celebrities."}</small></div>
            <div><span>10K</span><strong>{ru ? "слушателей" : "listeners"}</strong><small>{ru ? "Приглашённая аудитория с активным музыкальным discovery." : "Invited listeners with active discovery behavior."}</small></div>
            <div><span>4</span><strong>{ru ? "недели" : "weeks"}</strong><small>{ru ? "Достаточно, чтобы измерить сохранения и ранние повторы." : "Enough to measure saves and early repeat behavior."}</small></div>
          </div>
          <div className="pitchPilotMeasure"><div><Icon name="check" /><span><strong>{ru ? "Успех" : "Success"}</strong><small>{ru ? "Рост сохранений и повторов новых артистов относительно контрольного discovery." : "Lift in saves and repeats of new artists versus control discovery."}</small></span></div><div><Icon name="privacy" /><span><strong>Guardrails</strong><small>{ru ? "Скрытия, жалобы, отключение sharing и доля промо-сигналов." : "Hides, reports, sharing opt-outs and promoted-signal share."}</small></span></div></div>
        </section> : null}

        {slide === 6 ? <section className="pitchSlide pitchAskSlide">
          <div>
            <span className="pitchKicker">THE ASK</span>
            <h2>{ru ? "Провести закрытый pilot Follow Taste внутри Spotify." : "Run a closed Follow Taste pilot inside Spotify."}</h2>
            <p>{ru ? "Нам нужен разговор с командами Social, Personalization и Spotify for Artists, чтобы проверить модель на first-party playback data и реальных opt-in кураторах." : "We are asking for a working session with Social, Personalization and Spotify for Artists to test the model on first-party playback data and real opt-in curators."}</p>
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
