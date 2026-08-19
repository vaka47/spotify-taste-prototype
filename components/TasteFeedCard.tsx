"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { kindLabels } from "@/lib/format";
import { recordTrackOpen } from "@/lib/prototype-events";
import type { TasteFeedEvent } from "@/types/taste";
import { useI18n } from "@/lib/i18n";

export function TasteFeedCard({ event }: { event: TasteFeedEvent }) {
  const router = useRouter();
  const { locale } = useI18n();
  const ru = locale === "ru";
  const labels = ru ? { recommended: "Рекомендует", on_repeat: "На повторе", saved_discovery: "Сохранённое открытие", rediscovered: "Вернулся к треку" } : kindLabels;
  const signals = ru ? {
    recommended: "Добавил комментарий после 14 прослушиваний",
    on_repeat: "11 прослушиваний за эту неделю",
    saved_discovery: "Сохранено после первого прослушивания",
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
    <article className="nativeFeedCard">
      <button className="nativeFeedCardMain" type="button" onClick={openTrack}>
        <div className="nativeFeedAvatarWrap">
          <div className="nativeFeedAvatar">
            <img
              className="avatarImage"
              src={event.tastemaker.avatarUrl}
              alt={`${event.tastemaker.name} artist image from Spotify`}
              onError={imageEvent => {
                if (event.tastemaker.fallbackAvatarUrl) imageEvent.currentTarget.src = event.tastemaker.fallbackAvatarUrl;
              }}
            />
          </div>
        </div>
        <div className="nativeFeedText">
          <div className="nativeFeedMeta">
            <strong>{event.tastemaker.name}</strong>
            <span>{timestamp}</span>
            <span className="nativeStatus">{labels[event.kind]}</span>
          </div>
          <div className="nativeFeedTrackTitle">{event.track.title}</div>
          <div className="nativeFeedArtist">{event.track.artist}</div>
          {event.authorNote ? <div className="nativeFeedAuthorNote">“{ru && event.id === "ev_recommended" ? "Обратите внимание на переход во второй половине." : event.authorNote}”</div> : null}
          <div className="nativeFeedSignal">
            <Icon name={event.kind === "recommended" ? "comment" : event.kind === "saved_discovery" ? "save" : event.kind === "rediscovered" ? "clock" : "feed"} size={18} />
            {signals?.[event.kind] || event.humanSignal}
          </div>
        </div>
        <TrackArtwork
          src={event.track.coverUrl}
          fallbackSrc={event.track.fallbackCoverUrl}
          alt={`${event.track.title} album cover from Spotify`}
          className="nativeFeedCover"
        />
      </button>
      <button
        className="nativeMoreButton"
        type="button"
        aria-label={`Open Taste options for ${event.track.title}`}
        onClick={openTrack}
      >
        <Icon name="more" />
      </button>
    </article>
  );
}
