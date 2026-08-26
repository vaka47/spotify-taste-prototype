"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
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

interface EmbedController {
  loadEntity: (uri: string) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  seek?: (positionSeconds: number) => void;
  addListener(event: "ready", callback: () => void): void;
  addListener(event: "playback_update", callback: (event: PlaybackUpdate) => void): void;
  addListener(event: "playback_started", callback: (event: { data: { playingURI: string } }) => void): void;
  destroy: () => void;
}

type SpotifyIframeApi = {
  createController: (
    element: HTMLElement,
    options: { width: string; height: string; uri: string },
    callback: (controller: EmbedController) => void,
  ) => void;
};

type SpotifyWebPlayerState = {
  paused: boolean;
  duration: number;
  position: number;
  track_window?: { current_track?: { uri?: string } };
};

interface SpotifyWebPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  activateElement: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  addListener(event: "ready", callback: (event: { device_id: string }) => void): void;
  addListener(event: "player_state_changed", callback: (state: SpotifyWebPlayerState | null) => void): void;
  addListener(event: "initialization_error" | "authentication_error" | "account_error" | "playback_error", callback: () => void): void;
}

type SpotifyWebPlaybackSdk = {
  Player: new (options: {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume: number;
    enableMediaSession: boolean;
  }) => SpotifyWebPlayer;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void;
    __followTasteSpotifyIframeApi?: SpotifyIframeApi;
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: SpotifyWebPlaybackSdk;
    webkitAudioContext?: typeof AudioContext;
  }
}

type PlaybackCapability = "loading" | "embed" | "reauthorize" | "premium";
type RepeatMode = "off" | "all" | "one";

type TastePlaybackContextValue = {
  playQueue: (items: TasteQueueItem[], startIndex?: number) => void;
  activeItemId: string | null;
};

const TastePlaybackContext = createContext<TastePlaybackContextValue | null>(null);
let iframeApiPromise: Promise<SpotifyIframeApi> | null = null;
let webPlaybackSdkPromise: Promise<SpotifyWebPlaybackSdk> | null = null;

function loadSpotifyIframeApi() {
  if (window.__followTasteSpotifyIframeApi) return Promise.resolve(window.__followTasteSpotifyIframeApi);
  if (iframeApiPromise) return iframeApiPromise;
  iframeApiPromise = new Promise((resolve, reject) => {
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
      script.onerror = () => reject(new Error("Spotify Embed API failed to load"));
      document.body.appendChild(script);
    }
  });
  return iframeApiPromise;
}

function loadSpotifyWebPlaybackSdk() {
  if (window.Spotify) return Promise.resolve(window.Spotify);
  if (webPlaybackSdkPromise) return webPlaybackSdkPromise;
  webPlaybackSdkPromise = new Promise((resolve, reject) => {
    const previous = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      previous?.();
      if (window.Spotify) resolve(window.Spotify);
      else reject(new Error("Spotify Web Playback SDK did not initialize"));
    };
    if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      script.onerror = () => reject(new Error("Spotify Web Playback SDK failed to load"));
      document.body.appendChild(script);
    }
  });
  return webPlaybackSdkPromise;
}

async function spotifyPlaybackToken() {
  const response = await fetch("/api/auth/spotify/token", { cache: "no-store" });
  if (!response.ok) return { status: response.status, accessToken: null };
  const payload = await response.json() as { accessToken: string };
  return { status: response.status, accessToken: payload.accessToken };
}

async function playOnSpotifyDevice(deviceId: string, uri: string) {
  const response = await fetch("/api/playback", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, uri }),
  });
  return response.ok;
}

function cueComment(context: AudioContext) {
  const now = context.currentTime;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.1, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  gain.connect(context.destination);
  [660, 880].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(now + index * 0.08);
    oscillator.stop(now + 0.32);
  });
}

function formatTime(valueMs: number) {
  if (!Number.isFinite(valueMs) || valueMs < 0) return "0:00";
  const total = Math.floor(valueMs / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function useTastePlayback() {
  const value = useContext(TastePlaybackContext);
  if (!value) throw new Error("useTastePlayback must be used inside TastePlaybackProvider");
  return value;
}

export function TastePlaybackProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const [items, setItems] = useState<TasteQueueItem[]>([]);
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [controllerReady, setControllerReady] = useState(false);
  const [commentSound, setCommentSound] = useState(true);
  const [capability, setCapability] = useState<PlaybackCapability>("loading");
  const [mode, setMode] = useState<"embed" | "premium">("embed");
  const [paused, setPaused] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [queueVisible, setQueueVisible] = useState(false);
  const embedTargetRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<EmbedController | null>(null);
  const premiumPlayerRef = useRef<SpotifyWebPlayer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const itemsRef = useRef(items);
  const indexRef = useRef(currentIndex);
  const openRef = useRef(open);
  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const soundRef = useRef(commentSound);
  const cuePlayedRef = useRef<string | null>(null);
  const advanceLockRef = useRef(false);
  const advanceRef = useRef<(automatic?: boolean) => void>(() => undefined);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackProgressRef = useRef({ uri: "", position: 0, duration: 0 });
  const current = items[currentIndex];

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { indexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { soundRef.current = commentSound; }, [commentSound]);

  function playCommentCue() {
    const active = itemsRef.current[indexRef.current];
    if (!active?.authorNote || !soundRef.current || cuePlayedRef.current === active.id || !audioContextRef.current) return;
    cuePlayedRef.current = active.id;
    void audioContextRef.current.resume().then(() => cueComment(audioContextRef.current!));
  }

  function clearEndTimer() {
    if (!endTimerRef.current) return;
    clearTimeout(endTimerRef.current);
    endTimerRef.current = null;
  }

  function scheduleAutomaticAdvance(playingUri: string, position: number, duration: number, isPaused: boolean) {
    const active = itemsRef.current[indexRef.current];
    if (!active || playingUri !== active.track.spotifyUri || duration <= 0) {
      clearEndTimer();
      return;
    }

    const previous = playbackProgressRef.current;
    const remaining = Math.max(0, duration - position);
    const reachedEnd = remaining <= 1_500
      || (previous.uri === playingUri && previous.duration > 0 && previous.duration - previous.position <= 1_800)
      || (position < 250 && previous.uri === playingUri && previous.position > 5_000);

    if (isPaused) {
      clearEndTimer();
      if (reachedEnd && !advanceLockRef.current) {
        advanceLockRef.current = true;
        queueMicrotask(() => advanceRef.current(true));
      }
      return;
    }

    playbackProgressRef.current = { uri: playingUri, position, duration };
    clearEndTimer();
    endTimerRef.current = setTimeout(() => {
      const latest = itemsRef.current[indexRef.current];
      if (!latest || latest.track.spotifyUri !== playingUri || advanceLockRef.current) return;
      advanceLockRef.current = true;
      advanceRef.current(true);
    }, remaining + 350);
  }

  function restartCurrent() {
    const active = itemsRef.current[indexRef.current];
    if (!active) return;
    advanceLockRef.current = true;
    clearEndTimer();
    setPositionMs(0);
    if (mode === "premium" && deviceId) void playOnSpotifyDevice(deviceId, active.track.spotifyUri);
    else {
      controllerRef.current?.loadEntity(active.track.spotifyUri);
      controllerRef.current?.play();
    }
  }

  function nextTrack(automatic = false) {
    const queue = itemsRef.current;
    if (!queue.length) return;
    if (automatic && repeatRef.current === "one") {
      restartCurrent();
      return;
    }
    let next = indexRef.current + 1;
    if (shuffleRef.current && queue.length > 1) {
      do next = Math.floor(Math.random() * queue.length); while (next === indexRef.current);
    } else if (next >= queue.length) {
      if (repeatRef.current === "all") next = 0;
      else {
        clearEndTimer();
        setPaused(true);
        setPositionMs(durationMs);
        return;
      }
    }
    advanceLockRef.current = true;
    clearEndTimer();
    setCurrentIndex(next);
  }
  advanceRef.current = nextTrack;

  function previousTrack() {
    if (positionMs > 3500) {
      setPositionMs(0);
      if (mode === "premium") void premiumPlayerRef.current?.seek(0);
      else controllerRef.current?.seek?.(0);
      return;
    }
    const previous = indexRef.current > 0 ? indexRef.current - 1 : repeatRef.current === "all" ? itemsRef.current.length - 1 : 0;
    advanceLockRef.current = true;
    clearEndTimer();
    setCurrentIndex(previous);
  }

  useEffect(() => {
    let cancelled = false;
    let player: SpotifyWebPlayer | null = null;
    spotifyPlaybackToken().then(async token => {
      if (cancelled) return;
      if (token.status === 409) {
        setCapability("reauthorize");
        return;
      }
      if (!token.accessToken) {
        setCapability("embed");
        return;
      }
      const sdk = await loadSpotifyWebPlaybackSdk();
      if (cancelled) return;
      player = new sdk.Player({
        name: "Spotify Taste",
        volume: 0.8,
        enableMediaSession: true,
        getOAuthToken(callback) {
          void spotifyPlaybackToken().then(fresh => { if (fresh.accessToken) callback(fresh.accessToken); });
        },
      });
      premiumPlayerRef.current = player;
      player.addListener("ready", ({ device_id }) => {
        if (cancelled) return;
        setDeviceId(device_id);
        setCapability("premium");
        if (openRef.current) {
          const active = itemsRef.current[indexRef.current];
          setMode("premium");
          if (active) void player?.activateElement().then(() => playOnSpotifyDevice(device_id, active.track.spotifyUri));
        }
      });
      player.addListener("player_state_changed", state => {
        if (!state) return;
        const active = itemsRef.current[indexRef.current];
        const playingUri = state.track_window?.current_track?.uri || active?.track.spotifyUri || "";
        if (!active || playingUri !== active.track.spotifyUri) return;
        advanceLockRef.current = false;
        setPaused(state.paused);
        setPositionMs(state.position);
        setDurationMs(state.duration);
        if (!state.paused && state.position < 1800) playCommentCue();
        scheduleAutomaticAdvance(playingUri, state.position, state.duration, state.paused);
      });
      const fallback = () => { setCapability("embed"); setMode("embed"); };
      player.addListener("initialization_error", fallback);
      player.addListener("authentication_error", fallback);
      player.addListener("account_error", fallback);
      player.addListener("playback_error", fallback);
      if (!await player.connect() && !cancelled) fallback();
    }).catch(() => { if (!cancelled) setCapability("embed"); });
    return () => {
      cancelled = true;
      player?.disconnect();
      if (premiumPlayerRef.current === player) premiumPlayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open || mode !== "embed" || !embedTargetRef.current || controllerRef.current || !current) return;
    let cancelled = false;
    loadSpotifyIframeApi().then(api => {
      if (cancelled || !embedTargetRef.current) return;
      api.createController(embedTargetRef.current, { width: "100%", height: "80", uri: current.track.spotifyUri }, controller => {
        if (cancelled) { controller.destroy(); return; }
        controllerRef.current = controller;
        setControllerReady(true);
        controller.addListener("ready", () => controller.play());
        controller.addListener("playback_started", event => {
          const active = itemsRef.current[indexRef.current];
          if (!active || event.data.playingURI !== active.track.spotifyUri) return;
          advanceLockRef.current = false;
          setPaused(false);
          playCommentCue();
        });
        controller.addListener("playback_update", event => {
          const active = itemsRef.current[indexRef.current];
          if (!active || event.data.playingURI !== active.track.spotifyUri) return;
          advanceLockRef.current = false;
          setPaused(event.data.isPaused);
          setPositionMs(event.data.position);
          setDurationMs(event.data.duration);
          scheduleAutomaticAdvance(event.data.playingURI, event.data.position, event.data.duration, event.data.isPaused);
        });
      });
    }).catch(() => setControllerReady(false));
    return () => { cancelled = true; };
  }, [open, current, mode]);

  useEffect(() => {
    if (mode !== "premium") return;
    controllerRef.current?.destroy();
    controllerRef.current = null;
    setControllerReady(false);
  }, [mode]);

  useEffect(() => {
    if (!open || !current) return;
    setPositionMs(0);
    setDurationMs(0);
    advanceLockRef.current = true;
    clearEndTimer();
    playbackProgressRef.current = { uri: current.track.spotifyUri, position: 0, duration: 0 };
    cuePlayedRef.current = null;
    if (mode === "premium" && deviceId) {
      void playOnSpotifyDevice(deviceId, current.track.spotifyUri);
    } else if (mode === "embed" && controllerRef.current) {
      controllerRef.current.loadEntity(current.track.spotifyUri);
      controllerRef.current.play();
    }
  }, [current, deviceId, mode, open]);

  useEffect(() => () => {
    clearEndTimer();
    controllerRef.current?.destroy();
    premiumPlayerRef.current?.disconnect();
  }, []);

  function playQueue(nextItems: TasteQueueItem[], startIndex = 0) {
    if (!nextItems.length) return;
    if (capability === "reauthorize") {
      window.location.href = `/api/auth/spotify/start?returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    const safeIndex = Math.max(0, Math.min(startIndex, nextItems.length - 1));
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextConstructor && !audioContextRef.current) audioContextRef.current = new AudioContextConstructor();
    void audioContextRef.current?.resume();
    setItems(nextItems);
    setCurrentIndex(safeIndex);
    setOpen(true);
    setQueueVisible(false);
    setPositionMs(0);
    setDurationMs(0);
    clearEndTimer();
    advanceLockRef.current = true;
    playbackProgressRef.current = { uri: nextItems[safeIndex].track.spotifyUri, position: 0, duration: 0 };
    itemsRef.current = nextItems;
    indexRef.current = safeIndex;
    openRef.current = true;
    if (capability === "premium" && deviceId && premiumPlayerRef.current) {
      setMode("premium");
      void premiumPlayerRef.current.activateElement().then(() => playOnSpotifyDevice(deviceId, nextItems[safeIndex].track.spotifyUri));
    } else {
      setMode("embed");
      controllerRef.current?.loadEntity(nextItems[safeIndex].track.spotifyUri);
      controllerRef.current?.play();
    }
  }

  function closeQueue() {
    clearEndTimer();
    controllerRef.current?.pause();
    void premiumPlayerRef.current?.pause();
    setOpen(false);
    setQueueVisible(false);
  }

  function togglePlayback() {
    if (mode === "premium") {
      if (paused) void premiumPlayerRef.current?.resume();
      else {
        clearEndTimer();
        void premiumPlayerRef.current?.pause();
      }
      return;
    }
    if (paused) controllerRef.current?.resume();
    else {
      clearEndTimer();
      controllerRef.current?.pause();
    }
  }

  function seek(position: number) {
    setPositionMs(position);
    if (mode === "premium") void premiumPlayerRef.current?.seek(position);
    else controllerRef.current?.seek?.(position / 1000);
  }

  function cycleRepeat() {
    setRepeat(value => value === "off" ? "all" : value === "all" ? "one" : "off");
  }

  // Do not memoize playQueue: its Premium capability and device are resolved asynchronously.
  const contextValue = { playQueue, activeItemId: open && current ? current.id : null };

  return (
    <TastePlaybackContext.Provider value={contextValue}>
      {children}
      {open && current ? (
        <aside className={`tasteQueueDock ${mode}${current.authorNote ? " hasNote" : ""}`} aria-label={ru ? "Очередь Taste" : "Taste queue"}>
          {queueVisible ? <div className="tasteQueueListPanel">
            <div className="tasteQueueListHeader">
              <span className="tasteQueueListTitle"><strong>{ru ? "Очередь Taste" : "Taste queue"}</strong><small>{items.length}</small></span>
              <span className="tasteQueuePanelControls">
                <button className={shuffle ? "active" : ""} type="button" onClick={() => setShuffle(value => !value)} aria-label={ru ? "В случайном порядке" : "Shuffle"}><Icon name="shuffle" size={17} /></button>
                <button className={repeat !== "off" ? "active" : ""} type="button" onClick={cycleRepeat} aria-label={ru ? "Режим повтора" : "Repeat mode"}><span className="tasteRepeatIcon"><Icon name="repeat" size={17} />{repeat === "one" ? <i>1</i> : null}</span></button>
                <button className={commentSound ? "active" : ""} type="button" onClick={() => setCommentSound(value => !value)} aria-label={commentSound ? (ru ? "Выключить звук комментариев" : "Mute comment cue") : (ru ? "Включить звук комментариев" : "Enable comment cue")}><Icon name={commentSound ? "volume" : "volumeOff"} size={17} /></button>
              </span>
            </div>
            <ol>{items.map((item, index) => <li key={`${item.id}-${index}`}>
              <button type="button" className={index === currentIndex ? "active" : ""} onClick={() => setCurrentIndex(index)}>
                <span>{index === currentIndex ? <Icon name={paused ? "play" : "volume"} size={15} /> : index + 1}</span>
                <TrackArtwork src={item.track.coverUrl} fallbackSrc={item.track.fallbackCoverUrl} alt="" />
                <span><strong>{item.track.title}</strong><small>{item.track.artist} · {item.tastemaker.name}</small></span>
                {item.authorNote ? <Icon name="comment" size={14} /> : null}
              </button>
            </li>)}</ol>
          </div> : null}

          <div className="tasteQueueArtworkWrap">
            <TrackArtwork src={current.track.coverUrl} fallbackSrc={current.track.fallbackCoverUrl} alt={`${current.track.title} cover`} className="tasteQueueArtwork" />
          </div>
          <div className="tasteQueueNowPlaying">
            <span className="tasteQueueEyebrow">{ru ? "ИГРАЕТ ИЗ TASTE" : "PLAYING FROM TASTE"} · {currentIndex + 1}/{items.length}</span>
            <strong>{current.track.title}</strong>
            <span className="tasteQueueArtist">{current.track.artist}</span>
            <div className="tasteQueueSource"><AvatarImage src={current.tastemaker.avatarUrl} fallbackSrc={current.tastemaker.fallbackAvatarUrl} alt="" /><span><small>{ru ? "По рекомендации" : "Recommended by"}</small><b>{current.tastemaker.name}</b></span></div>
            <p className={current.authorNote ? "tasteQueueInlineNote" : "tasteQueueSignal"} title={current.authorNote || current.signal}>{current.authorNote ? <Icon name="comment" size={12} /> : null}{current.authorNote ? `“${current.authorNote}”` : current.signal}</p>
          </div>

          {mode === "embed" ? <div className={`tasteQueueEmbed ${controllerReady ? "ready" : ""}`}>
            <a className="tasteQueueEmbedFallback" href={current.track.spotifyUrl} target="_blank" rel="noreferrer"><span><Icon name="play" size={18} /></span><span><strong>{current.track.title}</strong><small>{ru ? "Открыть в Spotify" : "Open in Spotify"}</small></span></a>
            <div className="tasteQueueEmbedController" ref={embedTargetRef} />
          </div> : current.authorNote ? <div className="tasteQueuePremiumNote" role="note"><Icon name="comment" size={16} /><span><small>{ru ? "Комментарий автора" : "Tastemaker note"}</small><strong>“{current.authorNote}”</strong></span></div> : null}

          <div className="tasteQueueActions">
            <button className={`tasteActionShuffle ${shuffle ? "active" : ""}`} type="button" onClick={() => setShuffle(value => !value)} aria-label={ru ? "В случайном порядке" : "Shuffle"}><Icon name="shuffle" size={18} /></button>
            <button className="tasteActionPrevious" type="button" onClick={previousTrack} aria-label={ru ? "Предыдущий трек" : "Previous track"}><Icon name="chevronLeft" /></button>
            {mode === "premium" ? <button className="tasteQueuePremiumToggle tasteActionPlay" type="button" onClick={togglePlayback} aria-label={paused ? (ru ? "Продолжить" : "Resume") : (ru ? "Пауза" : "Pause")}><Icon name={paused ? "play" : "pause"} /></button> : null}
            <button className="tasteActionNext" type="button" onClick={() => nextTrack(false)} aria-label={ru ? "Следующий трек" : "Next track"}><Icon name="chevronRight" /></button>
            <button className={`tasteActionRepeat ${repeat !== "off" ? "active" : ""}`} type="button" onClick={cycleRepeat} aria-label={ru ? "Режим повтора" : "Repeat mode"}><span className="tasteRepeatIcon"><Icon name="repeat" size={18} />{repeat === "one" ? <i>1</i> : null}</span></button>
            <button className={`tasteActionQueue ${queueVisible ? "active" : ""}`} type="button" onClick={() => setQueueVisible(value => !value)} aria-label={ru ? "Показать очередь" : "Show queue"}><Icon name="queue" size={18} /></button>
            <button className={`tasteActionSound ${commentSound ? "active" : ""}`} type="button" onClick={() => setCommentSound(value => !value)} aria-label={commentSound ? (ru ? "Выключить звук комментариев" : "Mute comment cue") : (ru ? "Включить звук комментариев" : "Enable comment cue")}><Icon name={commentSound ? "volume" : "volumeOff"} size={18} /></button>
            <button className="tasteActionClose" type="button" onClick={closeQueue} aria-label={ru ? "Закрыть плеер" : "Close player"}><Icon name="close" size={18} /></button>
          </div>

          {mode === "premium" ? <div className="tasteQueueProgress">
            <span>{formatTime(positionMs)}</span>
            <input type="range" min={0} max={Math.max(durationMs, 1)} value={Math.min(positionMs, Math.max(durationMs, 1))} onChange={event => seek(Number(event.target.value))} aria-label={ru ? "Позиция воспроизведения" : "Playback position"} />
            <span>{formatTime(durationMs)}</span>
          </div> : null}
          {current.authorNote ? <div className="tasteQueueMobileNote"><Icon name="comment" size={15} /><span><small>{ru ? "Комментарий автора" : "Tastemaker note"}</small>{current.authorNote}</span></div> : null}
        </aside>
      ) : null}
    </TastePlaybackContext.Provider>
  );
}

export function TasteQueuePlayer({
  items,
  triggerLabel,
  triggerAriaLabel,
  triggerClassName = "tasteQueueTrigger",
  iconOnly = false,
  startIndex = 0,
}: {
  items: TasteQueueItem[];
  triggerLabel: string;
  triggerAriaLabel: string;
  triggerClassName?: string;
  iconOnly?: boolean;
  startIndex?: number;
}) {
  const { playQueue } = useTastePlayback();
  if (!items.length) return null;
  return <button className={triggerClassName} type="button" onClick={() => playQueue(items, startIndex)} aria-label={triggerAriaLabel} title={triggerAriaLabel}><Icon name="play" size={iconOnly ? 25 : 18} />{!iconOnly ? <span>{triggerLabel}</span> : null}</button>;
}
