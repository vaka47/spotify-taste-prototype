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
    <main className="spxPlayerPage">
      <header className="spxPlayerTop">
        <Link href="/feed" aria-label={ru ? "Вернуться в ленту" : "Back to Taste Feed"}><Icon name="chevronLeft" /></Link>
        <div><small>{ru ? "ИГРАЕТ ИЗ TASTE" : "PLAYING FROM TASTE"}</small><strong>{travis.name}</strong></div>
        <button type="button" aria-label={ru ? "Параметры трека" : "Track options"} onClick={() => showToast(ru ? "Меню трека открыто" : "Track menu opened")}><Icon name="more" /></button>
      </header>

      <section className="spxNowPlaying">
        <div className="spxPlayerArtworkWrap">
          <TrackArtwork src={track.coverUrl} fallbackSrc={track.fallbackCoverUrl} alt={`${track.title} cover`} className="spxPlayerArtwork" />
          {authorNote ? <div className="spxArtworkNote" role="note"><span className="spxNoteAvatar"><img src={travis.avatarUrl} alt="" onError={event => { if (travis.fallbackAvatarUrl) event.currentTarget.src = travis.fallbackAvatarUrl; }} /></span><span><small>{ru ? "Комментарий Трэвиса" : "A note from Travis"}</small><strong>{authorNote}</strong></span><Icon name="volume" size={16} /></div> : null}
        </div>

        <div className="spxPlayerTitle">
          <div><h1>{track.title}</h1><p>{track.artist}</p></div>
          <button type="button" aria-label={ru ? "Сохранить трек" : "Save track"} onClick={() => { recordAttributionEvent("save_intent", travis.id, track.id); showToast(ru ? "Сохранено · влияние учтено" : "Saved · influence attributed"); }}><Icon name="save" /></button>
        </div>

        <Link className="spxAttribution" href="/tastemaker/travis-scott">
          <span><img src={travis.avatarUrl} alt="" onError={event => { if (travis.fallbackAvatarUrl) event.currentTarget.src = travis.fallbackAvatarUrl; }} /></span>
          <span><strong>{ru ? "Найдено благодаря" : "Discovered through"} <em>{travis.name}</em></strong><small>{ru ? "Прослушивание учитывается в статистике влияния" : "This stream contributes to Influence Streams"}</small></span>
          <Icon name="info" size={16} />
        </Link>

        <div className="spxOfficialPlayer">
          <SpotifyEmbed src={track.spotifyEmbedUrl} title={`Spotify: ${track.title}`} size="compact" />
        </div>

        <div className="spxPlayerActions">
          <button type="button" onClick={() => showToast(ru ? "Перемешивание включено" : "Shuffle on")} aria-label={ru ? "Перемешать" : "Shuffle"}><Icon name="spark" /></button>
          <a href={track.spotifyUrl} target="_blank" rel="noreferrer" aria-label={ru ? "Открыть трек в Spotify" : "Open track in Spotify"}><Icon name="external" /></a>
          <button type="button" onClick={() => showToast(ru ? "Добавлено в очередь" : "Added to queue")} aria-label={ru ? "Добавить в очередь" : "Add to queue"}><Icon name="feed" /></button>
        </div>

        <section className="spxWhy">
          <h2>{ru ? "Почему вы это слышите" : "Why you're hearing this"}</h2>
          <div><span><Icon name="play" size={17} /></span><p>{ru ? "Трэвис включал этот трек 14 раз за неделю" : "Travis played this 14 times this week"}</p></div>
          {authorNote ? <div><span><Icon name="comment" size={17} /></span><p>{ru ? "Трэвис добавил к треку личный комментарий" : "Travis added a personal note to this track"}</p></div> : <div><span><Icon name="user" size={17} /></span><p>{ru ? "Вы подписаны на Taste Трэвиса" : "You follow Travis's Taste"}</p></div>}
        </section>

        <p className="spxPlayerDisclosure"><Icon name="info" size={13} />{ru ? "Сценарий рекомендации иллюстративный; трек и официальный плеер Spotify настоящие." : "Recommendation context is illustrative; the track and official Spotify player are real."}</p>
      </section>
    </main>
  );
}
