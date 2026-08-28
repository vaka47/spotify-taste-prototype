"use client";

import Link from "next/link";
import { Icon } from "@/components/Icons";
import { AvatarImage } from "@/components/AvatarImage";
import { TrackArtwork } from "@/components/TrackArtwork";
import { kindLabels } from "@/lib/format";
import { recordTrackOpen } from "@/lib/prototype-events";
import type { TasteFeedEvent } from "@/types/taste";
import { useI18n } from "@/lib/i18n";
import { useTastePlayback } from "@/components/TasteQueuePlayer";
import type { TasteQueueItem } from "@/types/taste";

export function TasteFeedCard({ event, queue, queueIndex }: { event: TasteFeedEvent; queue: TasteQueueItem[]; queueIndex: number }) {
  const { playQueue, activeItemId, activeTrackId, paused, togglePlayback } = useTastePlayback();
  const { locale } = useI18n();
  const ru = locale === "ru";
  const localizedNote = ru && event.authorNote === "Listen for the switch in the second half."
    ? "Обратите внимание на переход во второй половине."
    : ru && event.authorNote === "The opening leaves exactly the right amount of space."
      ? "Во вступлении ровно столько воздуха, сколько нужно."
      : event.authorNote;
  const labels = ru
    ? { recommended: "Рекомендация", on_repeat: "На повторе", saved_discovery: "Новое открытие", rediscovered: "Снова слушает" }
    : kindLabels;
  const signals = ru ? {
    recommended: "Добавил комментарий после 14 прослушиваний",
    on_repeat: "11 прослушиваний за эту неделю",
    saved_discovery: "Сегодня впервые сохранил этот трек",
    rediscovered: "Вернулся к треку спустя 4 месяца",
  } : null;
  const timestamp = ru
    ? event.timestampLabel
      .replace("min ago", "мин назад")
      .replace("hours ago", "ч назад")
      .replace("hour ago", "ч назад")
      .replace("Yesterday", "Вчера")
      .replace("ago", "назад")
    : event.timestampLabel;

  function playTrack() {
    recordTrackOpen(event.tastemaker.id, event.track.id);
    if (activeItemId === `feed_queue_${event.id}` || activeTrackId === event.track.id) togglePlayback();
    else playQueue(queue, queueIndex);
  }
  const active = activeItemId === `feed_queue_${event.id}` || activeTrackId === event.track.id;
  const profileHref = event.tastemaker.slug === "travis-scott"
    ? `/tastemaker/travis-scott?track=${encodeURIComponent(event.track.id)}`
    : event.tastemaker.spotifyUrl || "/feed";

  return (
    <article className={`spxFeedEvent ${active ? "playing" : ""}`}>
      <div className="spxFeedEventMain">
        <Link className="spxFeedAvatar" href={profileHref} target={profileHref.startsWith("http") ? "_blank" : undefined}>
          <AvatarImage src={event.tastemaker.avatarUrl} fallbackSrc={event.tastemaker.fallbackAvatarUrl} alt={event.tastemaker.name} />
        </Link>
        <span className="spxFeedEventCopy">
          <Link className="spxFeedPerson" href={profileHref} target={profileHref.startsWith("http") ? "_blank" : undefined}><strong>{event.tastemaker.name}</strong>{event.tastemaker.verified ? <i className="spxVerified"><Icon name="check" size={10} /></i> : null}</Link>
          <span className="spxFeedTime">{timestamp} · <em>{labels[event.kind]}</em></span>
          <button className="spxFeedTrackAction" type="button" onClick={playTrack}><strong className="spxFeedTrackTitle">{event.track.title}</strong><span className="spxFeedArtist">{event.track.artist}</span>{localizedNote ? <em className="spxFeedNote">“{localizedNote}”</em> : null}</button>
        </span>
        <button className="spxFeedCoverButton" type="button" onClick={playTrack} aria-label={ru ? `Воспроизвести ${event.track.title}` : `Play ${event.track.title}`}><TrackArtwork src={event.track.coverUrl} fallbackSrc={event.track.fallbackCoverUrl} alt={`${event.track.title} cover`} className="spxFeedCover" /></button>
        <button className="spxFeedSignal" type="button" onClick={playTrack}><Icon name={event.kind === "recommended" ? "comment" : event.kind === "saved_discovery" ? "save" : event.kind === "rediscovered" ? "clock" : "feed"} size={18} />{signals?.[event.kind] || event.humanSignal}</button>
      </div>
      <button className="spxFeedMore" type="button" aria-label={active && !paused ? (ru ? `Поставить ${event.track.title} на паузу` : `Pause ${event.track.title}`) : (ru ? `Воспроизвести ${event.track.title}` : `Play ${event.track.title}`)} onClick={playTrack}><Icon name={active && !paused ? "pause" : "play"} size={17} /></button>
    </article>
  );
}
