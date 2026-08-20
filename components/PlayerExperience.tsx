"use client";

import Link from "next/link";
import { Icon } from "@/components/Icons";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { getTrackBySlug } from "@/lib/format";
import { tracks, travis } from "@/lib/mock-data";
import { recordAttributionEvent } from "@/lib/prototype-events";
import { useI18n } from "@/lib/i18n";

export function PlayerExperience({ trackSlug }: { trackSlug: string }) {
  const track = getTrackBySlug(tracks, trackSlug);
  const { showToast } = useToast();
  const { locale } = useI18n();
  const ru = locale === "ru";
  const authorNote = trackSlug === "euphoria"
    ? (ru ? "Обратите внимание на переход во второй половине." : "Listen for the switch in the second half.")
    : trackSlug === "iykyk"
      ? (ru ? "Во вступлении ровно столько воздуха, сколько нужно." : "The opening leaves exactly the right amount of space.")
      : null;

  return (
    <main className="nativePlayerPage">
      <header className="nativePlayerTop">
        <Link className="nativeIconAction" href="/feed" aria-label={ru ? "Вернуться в ленту Taste" : "Back to Taste Feed"}><Icon name="chevronLeft" /></Link>
        <div><small>{ru ? "ИЗ FOLLOW TASTE" : "PLAYING FROM FOLLOW TASTE"}</small><strong>{travis.name}</strong></div>
        <button className="nativeIconAction" type="button" aria-label={ru ? "Параметры трека" : "Track options"} onClick={() => showToast(ru ? "Открыто меню трека" : "Track menu opened")}><Icon name="more" /></button>
      </header>

      <section className="nativePlayerLayout">
        <div className="nativePlayerCoverWrap">
          <TrackArtwork src={track.coverUrl} fallbackSrc={track.fallbackCoverUrl} alt={`${track.title} cover`} className="nativePlayerCover" />
          {authorNote ? (
            <div className="nativePlayerNote" role="note">
              <Icon name="comment" size={16} />
              <span><small>{ru ? "Комментарий Трэвиса" : "A note from Travis"}</small><strong>{authorNote}</strong></span>
              <Icon name="volume" size={16} />
            </div>
          ) : null}
        </div>

        <div className="nativePlayerDetails">
          <div className="nativePlayerTitleRow">
            <div><h1>{track.title}</h1><p>{track.artist}</p></div>
            <button className="nativeIconAction saveTrackButton" type="button" aria-label={ru ? "Сохранить трек" : "Save track"} onClick={() => { recordAttributionEvent("save_intent", travis.id, track.id); showToast(ru ? "Трек сохранён · влияние учтено" : "Track saved · influence attributed"); }}><Icon name="save" /></button>
          </div>

          <Link className="nativeAttribution" href="/tastemaker/travis-scott">
            <span className="nativeAttributionAvatar"><img src={travis.avatarUrl} alt="" onError={event => { if (travis.fallbackAvatarUrl) event.currentTarget.src = travis.fallbackAvatarUrl; }} /></span>
            <span><small>{ru ? "Рекомендовано через Follow Taste" : "Recommended through Follow Taste"}</small><strong>{travis.name}</strong></span>
            <Icon name="chevronRight" size={18} />
          </Link>

          <p className="nativePlayerDisclosure"><Icon name="info" size={14} />{ru ? "Иллюстративный Taste-сигнал · трек и плеер Spotify настоящие" : "Illustrative Taste signal · real Spotify track and player"}</p>

          <SpotifyEmbed src={track.spotifyEmbedUrl} title={`Spotify: ${track.title}`} size="large" />

          <div className="nativePlayerLinks">
            <a href={track.spotifyUrl} target="_blank" rel="noreferrer"><Icon name="external" size={17} />{ru ? "Открыть в Spotify" : "Open in Spotify"}</a>
            <button type="button" onClick={() => showToast(ru ? "Трек добавлен в очередь" : "Track added to queue")}><Icon name="feed" size={17} />{ru ? "В очередь" : "Add to queue"}</button>
          </div>
        </div>
      </section>

      <section className="nativeWhySection">
        <h2>{ru ? "Почему этот трек в вашей ленте" : "Why this is in your feed"}</h2>
        {authorNote ? <div><Icon name="comment" /><span><strong>{ru ? "Трэвис рекомендует этот трек" : "Recommended by Travis"}</strong><small>“{authorNote}”</small></span></div> : null}
        <div><Icon name="feed" /><span><strong>{ru ? "14 прослушиваний за неделю" : "14 plays this week"}</strong><small>{ru ? "Рекомендация подтверждена повторными прослушиваниями, а не одним случайным запуском." : "The recommendation is backed by repeat listening, not a one-off play."}</small></span></div>
        <div><Icon name="user" /><span><strong>{ru ? "Квалифицированное открытие" : "Qualified discovery"}</strong><small>{ru ? "Первый запуск связывается с Трэвисом; сохранение или повтор подтверждают влияние." : "The first play is attributed to Travis; a save or repeat qualifies the influence."}</small></span></div>
      </section>
    </main>
  );
}
