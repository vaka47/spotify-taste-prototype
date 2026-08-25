"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icons";
import { AvatarImage } from "@/components/AvatarImage";
import { TrackArtwork } from "@/components/TrackArtwork";
import { kindLabels } from "@/lib/format";
import { recordTrackOpen } from "@/lib/prototype-events";
import type { TasteFeedEvent } from "@/types/taste";
import { useI18n } from "@/lib/i18n";

export function TasteFeedCard({ event }: { event: TasteFeedEvent }) {
  const router = useRouter();
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

  function openTrack() {
    recordTrackOpen(event.tastemaker.id, event.track.id);
    router.push(`/player/${event.track.slug}`);
  }

  return (
    <article className="spxFeedEvent">
      <button className="spxFeedEventMain" type="button" onClick={openTrack}>
        <span className="spxFeedAvatar">
          <AvatarImage src={event.tastemaker.avatarUrl} fallbackSrc={event.tastemaker.fallbackAvatarUrl} alt={event.tastemaker.name} />
        </span>
        <span className="spxFeedEventCopy">
          <span className="spxFeedPerson"><strong>{event.tastemaker.name}</strong>{event.tastemaker.verified ? <i className="spxVerified"><Icon name="check" size={10} /></i> : null}</span>
          <span className="spxFeedTime">{timestamp} · <em>{labels[event.kind]}</em></span>
          <strong className="spxFeedTrackTitle">{event.track.title}</strong>
          <span className="spxFeedArtist">{event.track.artist}</span>
          {localizedNote ? <em className="spxFeedNote">“{localizedNote}”</em> : null}
        </span>
        <TrackArtwork src={event.track.coverUrl} fallbackSrc={event.track.fallbackCoverUrl} alt={`${event.track.title} cover`} className="spxFeedCover" />
        <span className="spxFeedSignal"><Icon name={event.kind === "recommended" ? "comment" : event.kind === "saved_discovery" ? "save" : event.kind === "rediscovered" ? "clock" : "feed"} size={18} />{signals?.[event.kind] || event.humanSignal}</span>
      </button>
      <button className="spxFeedMore" type="button" aria-label={ru ? `Открыть ${event.track.title}` : `Open ${event.track.title}`} onClick={openTrack}><Icon name="more" /></button>
    </article>
  );
}
