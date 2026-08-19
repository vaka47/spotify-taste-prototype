"use client";

import Link from "next/link";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { feedEvents, tracks, travis } from "@/lib/mock-data";
import { useFollowingTaste } from "@/lib/use-following-taste";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { locale } = useI18n();
  const { following } = useFollowingTaste(travis.id);
  const ru = locale === "ru";
  const highlights = feedEvents.slice(0, 3);

  return (
    <main className="page nativeHomePage">
      <header className="nativePageHeader">
        <h1>{ru ? "Добрый вечер" : "Good evening"}</h1>
      </header>

      <section className="homeQuickGrid" aria-label={ru ? "Быстрый доступ" : "Quick access"}>
        <Link className="homeQuickItem" href="/feed">
          <span className="homeQuickIcon"><Icon name="feed" /></span>
          <strong>{ru ? "Лента Taste" : "Taste Feed"}</strong>
        </Link>
        <Link className="homeQuickItem" href="/tastemaker/travis-scott">
          <span className="homeQuickArt"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="" /></span>
          <strong>Taste · Travis Scott</strong>
        </Link>
        <Link className="homeQuickItem" href="/my-taste">
          <span className="homeQuickIcon"><Icon name="library" /></span>
          <strong>{ru ? "Мой Taste" : "My Taste"}</strong>
        </Link>
        <Link className="homeQuickItem" href="/notifications">
          <span className="homeQuickIcon"><Icon name="bell" /></span>
          <strong>{ru ? "Новые сигналы" : "New signals"}</strong>
        </Link>
      </section>

      <section className="nativeSection">
        <div className="nativeSectionHeader">
          <div>
            <h2>{ru ? "От людей, за которыми вы следите" : "From people you follow"}</h2>
            <p>{following
              ? (ru ? "Недавние прослушивания и комментарии из вашей сети Taste." : "Recent listening and notes from your Taste network.")
              : (ru ? "Подпишитесь на музыкальный вкус артиста, чтобы собрать свою ленту." : "Follow an artist's taste to build your feed.")}</p>
          </div>
          <Link href="/feed">{ru ? "Показать все" : "Show all"}</Link>
        </div>

        {following ? (
          <div className="homeTasteRows">
            {highlights.map(event => (
              <Link className="homeTasteRow" href={`/player/${event.track.slug}`} key={event.id}>
                <span className="homeTastePerson"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt={travis.name} /></span>
                <span className="homeTasteCopy">
                  <strong>{event.track.title}</strong>
                  <span>{event.track.artist}</span>
                  <em>{travis.name} · {ru ? ({ now_playing: "слушает сейчас", on_repeat: "на повторе", new_discovery: "новое открытие", deep_cut: "редкая находка" } as const)[event.kind] : event.kind.replaceAll("_", " ")}</em>
                </span>
                <TrackArtwork src={event.track.coverUrl} fallbackSrc={event.track.fallbackCoverUrl} alt={`${event.track.title} cover`} className="homeTasteCover" />
                <span className="rowPlay"><Icon name="play" size={18} /></span>
              </Link>
            ))}
          </div>
        ) : (
          <Link className="followSuggestion" href="/tastemaker/travis-scott">
            <span className="followSuggestionAvatar"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt={travis.name} /></span>
            <span><strong>Travis Scott</strong><small>{ru ? "64,7 млн слушателей в месяц" : "64.7M monthly listeners"}</small></span>
            <span className="nativeOutlineButton">Taste</span>
          </Link>
        )}
      </section>

      <section className="nativeSection">
        <div className="nativeSectionHeader">
          <div><h2>{ru ? "Недавние открытия" : "Recently discovered"}</h2><p>{ru ? "Треки, найденные через Taste." : "Tracks discovered through Taste."}</p></div>
        </div>
        <div className="nativeShelf">
          {[tracks.euphoria, tracks.chamber, tracks.gone, tracks.likehim, tracks.lvbag].map(track => (
            <Link className="nativeShelfItem" href={`/player/${track.slug}`} key={track.id}>
              <TrackArtwork src={track.coverUrl} fallbackSrc={track.fallbackCoverUrl} alt={`${track.title} cover`} className="nativeShelfCover" />
              <strong>{track.title}</strong>
              <span>{track.artist}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
