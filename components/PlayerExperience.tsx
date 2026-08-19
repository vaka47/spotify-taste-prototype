"use client";

import Link from "next/link";
import { Icon } from "@/components/Icons";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { getTrackBySlug } from "@/lib/format";
import { tracks, travis } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";

export function PlayerExperience({ trackSlug }: { trackSlug: string }) {
  const track = getTrackBySlug(tracks, trackSlug);
  const { showToast } = useToast();
  const { locale } = useI18n();
  const ru = locale === "ru";

  return (
    <main className="nativePlayerPage">
      <header className="nativePlayerTop">
        <Link className="nativeIconAction" href="/feed" aria-label={ru ? "Вернуться в ленту Taste" : "Back to Taste Feed"}><Icon name="chevronLeft" /></Link>
        <div><small>{ru ? "ИЗ ЛЕНТЫ TASTE" : "PLAYING FROM TASTE"}</small><strong>{travis.name}</strong></div>
        <button className="nativeIconAction" type="button" aria-label={ru ? "Параметры трека" : "Track options"} onClick={() => showToast(ru ? "Открыто меню трека" : "Track menu opened")}><Icon name="more" /></button>
      </header>

      <section className="nativePlayerLayout">
        <TrackArtwork src={track.coverUrl} fallbackSrc={track.fallbackCoverUrl} alt={`${track.title} cover`} className="nativePlayerCover" />

        <div className="nativePlayerDetails">
          <div className="nativePlayerTitleRow">
            <div><h1>{track.title}</h1><p>{track.artist}</p></div>
            <button className="nativeIconAction saveTrackButton" type="button" aria-label={ru ? "Сохранить трек" : "Save track"} onClick={() => showToast(ru ? "Трек сохранён" : "Track saved")}><Icon name="save" /></button>
          </div>

          <Link className="nativeAttribution" href="/tastemaker/travis-scott">
            <span className="nativeAttributionAvatar"><img src={travis.avatarUrl} alt="" onError={event => { if (travis.fallbackAvatarUrl) event.currentTarget.src = travis.fallbackAvatarUrl; }} /></span>
            <span><small>{ru ? "Найдено через Taste" : "Discovered through Taste"}</small><strong>{travis.name}</strong></span>
            <Icon name="chevronRight" size={18} />
          </Link>

          <SpotifyEmbed src={track.spotifyEmbedUrl} title={`Spotify: ${track.title}`} size="large" />

          <div className="nativePlayerLinks">
            <a href={track.spotifyUrl} target="_blank" rel="noreferrer"><Icon name="external" size={17} />{ru ? "Открыть в Spotify" : "Open in Spotify"}</a>
            <button type="button" onClick={() => showToast(ru ? "Трек добавлен в очередь" : "Track added to queue")}><Icon name="feed" size={17} />{ru ? "В очередь" : "Add to queue"}</button>
          </div>
        </div>
      </section>

      <section className="nativeWhySection">
        <h2>{ru ? "Почему этот трек в вашей ленте" : "Why this is in your feed"}</h2>
        <div><Icon name="feed" /><span><strong>{ru ? "14 прослушиваний за неделю" : "14 plays this week"}</strong><small>{ru ? "Трэвис чаще всего возвращался к этому треку." : "This is the track Travis returned to most."}</small></span></div>
        <div><Icon name="user" /><span><strong>{ru ? "Найдено благодаря Трэвису" : "Discovered through Travis"}</strong><small>{ru ? "Если вы продолжите слушать или сохраните трек, Taste учтёт влияние." : "A repeat play or save contributes to Taste influence."}</small></span></div>
      </section>
    </main>
  );
}
