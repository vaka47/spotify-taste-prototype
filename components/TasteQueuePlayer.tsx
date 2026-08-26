"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useI18n } from "@/lib/i18n";
import type { TasteQueueItem } from "@/types/taste";

type PlaybackUpdate = {
  data: {
    playingURI: string;
    isPaused: boolean;
    isBuffering: boolean;
    duration: number;
    position: number;
  };
};

type PlaybackStarted = { data: { playingURI: string } };

interface EmbedController {
  loadEntity: (uri: string) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  addListener(event: "ready", callback: () => void): void;
  addListener(event: "playback_update", callback: (event: PlaybackUpdate) => void): void;
  addListener(event: "playback_started", callback: (event: PlaybackStarted) => void): void;
  destroy: () => void;
}

type SpotifyIframeApi = {
  createController: (
    element: HTMLElement,
    options: { width: string; height: string; uri: string },
    callback: (controller: EmbedController) => void,
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void;
    __followTasteSpotifyIframeApi?: SpotifyIframeApi;
    webkitAudioContext?: typeof AudioContext;
  }
}

let iframeApiPromise: Promise<SpotifyIframeApi> | null = null;

function loadSpotifyIframeApi() {
  if (window.__followTasteSpotifyIframeApi) return Promise.resolve(window.__followTasteSpotifyIframeApi);
  if (iframeApiPromise) return iframeApiPromise;

  iframeApiPromise = new Promise(resolve => {
    const previous = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = api => {
      window.__followTasteSpotifyIframeApi = api;
      previous?.(api);
      resolve(api);
    };

    if (!document.querySelector('script[src="https://open.spotify.com/embed/iframe-api/v1"]')) {
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return iframeApiPromise;
}

function cueComment(context: AudioContext) {
  const now = context.currentTime;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  gain.connect(context.destination);

  [660, 880].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(now + index * 0.09);
    oscillator.stop(now + 0.34);
  });
}

export function TasteQueuePlayer({
  items,
  triggerLabel,
  triggerAriaLabel,
  triggerClassName = "tasteQueueTrigger",
  iconOnly = false,
}: {
  items: TasteQueueItem[];
  triggerLabel: string;
  triggerAriaLabel: string;
  triggerClassName?: string;
  iconOnly?: boolean;
}) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [controllerReady, setControllerReady] = useState(false);
  const [commentSound, setCommentSound] = useState(true);
  const embedTargetRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<EmbedController | null>(null);
  const activeIndexRef = useRef(0);
  const advanceLockRef = useRef(false);
  const cuePlayedRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(true);
  const itemsRef = useRef(items);

  const current = items[currentIndex];

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { activeIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { soundEnabledRef.current = commentSound; }, [commentSound]);

  useEffect(() => {
    if (!open || !embedTargetRef.current || controllerRef.current || !current) return;
    let cancelled = false;

    loadSpotifyIframeApi().then(api => {
      if (cancelled || !embedTargetRef.current) return;
      api.createController(embedTargetRef.current, {
        width: "100%",
        height: "152",
        uri: current.track.spotifyUri,
      }, controller => {
        if (cancelled) {
          controller.destroy();
          return;
        }
        controllerRef.current = controller;
        setControllerReady(true);
        controller.addListener("ready", () => {
          controller.play();
        });
        controller.addListener("playback_started", () => {
          advanceLockRef.current = false;
          const activeItem = itemsRef.current[activeIndexRef.current];
          if (activeItem?.authorNote && cuePlayedRef.current !== activeItem.id && soundEnabledRef.current && audioContextRef.current) {
            cuePlayedRef.current = activeItem.id;
            void audioContextRef.current.resume().then(() => cueComment(audioContextRef.current!));
          }
        });
        controller.addListener("playback_update", event => {
          const nearEnd = event.data.duration > 0 && event.data.position >= event.data.duration - 1250;
          if (!event.data.isPaused && nearEnd && !advanceLockRef.current) {
            const nextIndex = activeIndexRef.current + 1;
            if (nextIndex < itemsRef.current.length) {
              advanceLockRef.current = true;
              setCurrentIndex(nextIndex);
            }
          }
        });
      });
    });

    return () => { cancelled = true; };
  }, [open, current]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!open || !controller || !current) return;
    advanceLockRef.current = false;
    controller.loadEntity(current.track.spotifyUri);
    controller.play();
  }, [currentIndex, current, open]);

  useEffect(() => () => controllerRef.current?.destroy(), []);

  function startQueue() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextConstructor && !audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }
    void audioContextRef.current?.resume();
    setCurrentIndex(0);
    setOpen(true);
    controllerRef.current?.loadEntity(items[0]?.track.spotifyUri || "");
    controllerRef.current?.play();
  }

  function goTo(index: number) {
    if (index < 0 || index >= items.length) return;
    setCurrentIndex(index);
  }

  function closeQueue() {
    controllerRef.current?.pause();
    controllerRef.current?.destroy();
    controllerRef.current = null;
    setControllerReady(false);
    setOpen(false);
  }

  if (!items.length) return null;

  return (
    <>
      <button className={triggerClassName} type="button" onClick={startQueue} aria-label={triggerAriaLabel} title={triggerAriaLabel}>
        <Icon name="play" size={iconOnly ? 25 : 18} />
        {!iconOnly ? <span>{triggerLabel}</span> : null}
      </button>

      {open && current ? (
        <aside className="tasteQueueDock" aria-label={ru ? "Очередь Taste" : "Taste queue"}>
          <div className="tasteQueueArtworkWrap">
            <TrackArtwork src={current.track.coverUrl} fallbackSrc={current.track.fallbackCoverUrl} alt={`${current.track.title} cover`} className="tasteQueueArtwork" />
            {current.authorNote ? <div className="tasteQueueComment"><Icon name="comment" size={15} /><span><small>{ru ? "Комментарий автора" : "Tastemaker note"}</small>{current.authorNote}</span></div> : null}
          </div>

          <div className="tasteQueueNowPlaying">
            <span className="tasteQueueEyebrow">{ru ? "ИГРАЕТ ИЗ TASTE" : "PLAYING FROM TASTE"} · {currentIndex + 1}/{items.length}</span>
            <strong>{current.track.title}</strong>
            <span className="tasteQueueArtist">{current.track.artist}</span>
            <div className="tasteQueueSource">
              <AvatarImage src={current.tastemaker.avatarUrl} fallbackSrc={current.tastemaker.fallbackAvatarUrl} alt="" />
              <span><small>{ru ? "По рекомендации" : "Recommended by"}</small><b>{current.tastemaker.name}</b></span>
            </div>
            <p>{current.signal}</p>
          </div>

          <div className="tasteQueueEmbed">
            <a
              className="tasteQueueEmbedFallback"
              href={current.track.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${ru ? "Открыть в Spotify" : "Open in Spotify"}: ${current.track.title}`}
            >
              <span><Icon name="play" size={18} /></span>
              <span><strong>{current.track.title}</strong><small>{ru ? "Открыть в Spotify" : "Open in Spotify"}</small></span>
            </a>
            <div className="tasteQueueEmbedController" ref={embedTargetRef} />
            {!controllerReady ? (
              <iframe
                key={current.track.spotifyId}
                title={`Spotify: ${current.track.title}`}
                src={current.track.spotifyEmbedUrl}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : null}
          </div>

          <div className="tasteQueueActions">
            <button type="button" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0} aria-label={ru ? "Предыдущий трек" : "Previous track"}><Icon name="chevronLeft" /></button>
            <button type="button" onClick={() => goTo(currentIndex + 1)} disabled={currentIndex === items.length - 1} aria-label={ru ? "Следующий трек" : "Next track"}><Icon name="chevronRight" /></button>
            <button className={commentSound ? "active" : ""} type="button" onClick={() => setCommentSound(value => !value)} aria-label={commentSound ? (ru ? "Выключить звук комментариев" : "Mute comment cue") : (ru ? "Включить звук комментариев" : "Enable comment cue")} title={ru ? "Звук комментариев" : "Comment sound"}><Icon name={commentSound ? "volume" : "volumeOff"} /></button>
            <button type="button" onClick={closeQueue} aria-label={ru ? "Закрыть очередь" : "Close queue"}><Icon name="close" /></button>
          </div>
          {current.authorNote ? <div className="tasteQueueMobileNote"><Icon name="comment" size={15} /><span><small>{ru ? "Комментарий автора" : "Tastemaker note"}</small>{current.authorNote}</span></div> : null}
        </aside>
      ) : null}
    </>
  );
}
