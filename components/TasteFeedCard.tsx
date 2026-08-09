"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { kindLabels } from "@/lib/format";
import { recordTrackOpen } from "@/lib/prototype-events";
import type { TasteFeedEvent } from "@/types/taste";

export function TasteFeedCard({ event }: { event: TasteFeedEvent }) {
  const router = useRouter();
  const { showToast } = useToast();

  function openTrack() {
    recordTrackOpen(event.tastemaker.id, event.track.id);
    showToast(`Opening real Spotify track: ${event.track.title}`);
    router.push(`/player/${event.track.slug}`);
  }

  return (
    <article className="feedCard">
      <button className="feedCardMain" type="button" onClick={openTrack}>
        <div className="feedAvatarWrap">
          <div className="feedAvatar">
            <img
              className="avatarImage"
              src={event.tastemaker.avatarUrl}
              alt={`${event.tastemaker.name} artist image from Spotify`}
              onError={imageEvent => {
                if (event.tastemaker.fallbackAvatarUrl) imageEvent.currentTarget.src = event.tastemaker.fallbackAvatarUrl;
              }}
            />
          </div>
          <span className="liveDot" aria-hidden="true" />
        </div>
        <div className="feedText">
          <div className="feedMeta">
            <strong>{event.tastemaker.name}</strong>
            <span>{event.timestampLabel}</span>
            <span className="statusPill">{kindLabels[event.kind]}</span>
          </div>
          <div className="feedTrack">{event.track.title}</div>
          <div className="feedArtist">{event.track.artist}</div>
          <div className="feedSignal">
            <Icon name={event.kind === "new_discovery" ? "save" : event.kind === "deep_cut" ? "clock" : "feed"} size={18} />
            {event.humanSignal}
          </div>
        </div>
        <TrackArtwork
          src={event.track.coverUrl}
          fallbackSrc={event.track.fallbackCoverUrl}
          alt={`${event.track.title} album cover from Spotify`}
          className="feedCover"
        />
      </button>
      <button
        className="moreButton"
        type="button"
        aria-label={`Open Taste options for ${event.track.title}`}
        onClick={() => showToast(`Taste options for ${event.track.title}`)}
      >
        <Icon name="more" />
      </button>
    </article>
  );
}
