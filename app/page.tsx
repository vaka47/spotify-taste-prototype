"use client";

import Link from "next/link";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { doechii, tracks, travis } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { locale } = useI18n();
  const ru = locale === "ru";
  return <main className="spxHomePage">
    <header><h1>{ru ? "Добрый день" : "Good afternoon"}</h1><p>{ru ? "Музыка, найденная через людей, чьему вкусу вы доверяете." : "Music discovered through people whose taste you trust."}</p></header>
    <section className="spxHomeShortcuts" aria-label={ru ? "Быстрый доступ" : "Quick access"}>
      <Link href="/feed"><span><Icon name="feed" size={22} /></span><strong>{ru ? "Лента Taste" : "Taste Feed"}</strong><Icon name="chevronRight" size={18} /></Link>
      <Link href="/tastemaker/travis-scott"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="" /><strong>{ru ? "Taste Трэвиса" : "Travis's Taste"}</strong><Icon name="chevronRight" size={18} /></Link>
      <Link href="/my-taste"><span><Icon name="library" size={22} /></span><strong>{ru ? "Мой Taste" : "Your Taste"}</strong><Icon name="chevronRight" size={18} /></Link>
    </section>
    <div className="spxSectionHeading"><h2>{ru ? "Вернуться к прослушиванию" : "Jump back in"}</h2><Link href="/feed">{ru ? "Вся лента" : "See feed"}</Link></div>
    <section className="spxHomeShelf">
      <Link href="/tastemaker/travis-scott"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="Travis Scott" /><strong>{ru ? "Taste Трэвиса" : "Travis's Taste"}</strong><small>{ru ? "История артиста за 7 дней" : "Artist listening, last 7 days"}</small></Link>
      <Link href="/feed"><TrackArtwork src={tracks.euphoria.coverUrl} fallbackSrc={tracks.euphoria.fallbackCoverUrl} alt="" /><strong>{ru ? "Рекомендации подписок" : "From people you follow"}</strong><small>{ru ? "Единая очередь Taste" : "Your continuous Taste queue"}</small></Link>
      <a href={doechii.spotifyUrl} target="_blank" rel="noreferrer"><AvatarImage src={doechii.avatarUrl} fallbackSrc={doechii.fallbackAvatarUrl} alt="Doechii" /><strong>Doechii</strong><small>{ru ? "Открыть профиль артиста" : "Open artist profile"}</small></a>
      <Link href="/search"><span className="spxHomeSearchArt"><Icon name="search" size={42} /></span><strong>{ru ? "Найти человека" : "Find a person"}</strong><small>{ru ? "Подпишитесь на его Taste" : "Follow their Taste"}</small></Link>
    </section>
  </main>;
}
