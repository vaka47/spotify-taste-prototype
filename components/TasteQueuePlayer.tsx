"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { useToast } from "@/components/ToastProvider";
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
  getCurrentState: () => Promise<SpotifyWebPlayerState | null>;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  addListener(event: "ready", callback: (event: { device_id: string }) => void): void;
  addListener(event: "player_state_changed", callback: (state: SpotifyWebPlayerState | null) => void): void;
  addListener(event: "autoplay_failed", callback: () => void): void;
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
type PlaybackMode = "pending" | "embed" | "premium";
type RepeatMode = "off" | "all" | "one";

type TastePlaybackContextValue = {
  playQueue: (items: TasteQueueItem[], startIndex?: number) => void;
  activeItemId: string | null;
  activeEventId: string | null;
  activeTrackId: string | null;
  paused: boolean;
  togglePlayback: () => void;
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

async function spotifyPlaybackToken(attempt = 0): Promise<{ status: number; accessToken: string | null }> {
  try {
    const response = await fetch("/api/auth/spotify/token", { cache: "no-store" });
    if (response.status >= 500 && attempt < 1) {
      await new Promise(resolve => window.setTimeout(resolve, 400));
      return spotifyPlaybackToken(attempt + 1);
    }
    if (!response.ok) return { status: response.status, accessToken: null };
    const payload = await response.json() as { accessToken: string };
    return { status: response.status, accessToken: payload.accessToken };
  } catch {
    if (attempt < 1) {
      await new Promise(resolve => window.setTimeout(resolve, 400));
      return spotifyPlaybackToken(attempt + 1);
    }
    return { status: 0, accessToken: null };
  }
}

async function playOnSpotifyDevice(deviceId: string, uri: string) {
  const response = await fetch("/api/playback", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, uri }),
  });
  return response.ok;
}

async function playOnSpotifyDeviceWithRetry(deviceId: string, uri: string) {
  if (await playOnSpotifyDevice(deviceId, uri)) return true;
  await new Promise(resolve => window.setTimeout(resolve, 450));
  return playOnSpotifyDevice(deviceId, uri);
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
  const { showToast } = useToast();
  const ru = locale === "ru";
  const [items, setItems] = useState<TasteQueueItem[]>([]);
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [controllerReady, setControllerReady] = useState(false);
  const [commentSound, setCommentSound] = useState(true);
  const [capability, setCapability] = useState<PlaybackCapability>("loading");
  const [mode, setMode] = useState<PlaybackMode>("pending");
  const [paused, setPaused] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [queueVisible, setQueueVisible] = useState(false);
  const [reactions, setReactions] = useState<Record<string, { reacted: boolean; count: number }>>({});
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
  const playbackClockRef = useRef({ position: 0, updatedAt: Date.now() });
  const current = items[currentIndex];

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { indexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { soundRef.current = commentSound; }, [commentSound]);

  useEffect(() => {
    if (!open || paused || durationMs <= 0) return;
    const updateVisualPosition = () => {
      const clock = playbackClockRef.current;
      const elapsed = Date.now() - clock.updatedAt;
      setPositionMs(Math.min(clock.position + elapsed, durationMs));
    };
    updateVisualPosition();
    const interval = window.setInterval(updateVisualPosition, 250);
    return () => window.clearInterval(interval);
  }, [current?.id, durationMs, open, paused]);

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

  function syncPlaybackState(position: number, duration: number, isPaused: boolean) {
    const safeDuration = Math.max(0, duration);
    const safePosition = Math.max(0, Math.min(position, safeDuration || position));
    playbackClockRef.current = { position: safePosition, updatedAt: Date.now() };
    setPaused(isPaused);
    setPositionMs(safePosition);
    setDurationMs(safeDuration);
  }

  async function preparePremiumPlayer(player: SpotifyWebPlayer) {
    await player.activateElement().catch(() => undefined);
    const volume = await player.getVolume().catch(() => 0.8);
    if (volume <= 0.01) await player.setVolume(0.8).catch(() => undefined);
  }

  async function startPremiumTrack(player: SpotifyWebPlayer, targetDeviceId: string, uri: string) {
    await preparePremiumPlayer(player);
    if (!await playOnSpotifyDeviceWithRetry(targetDeviceId, uri)) return false;

    await new Promise(resolve => window.setTimeout(resolve, 700));
    const state = await player.getCurrentState().catch(() => null);
    const activeUri = state?.track_window?.current_track?.uri;
    if (!state || state.paused || activeUri !== uri) {
      await preparePremiumPlayer(player);
      if (!await playOnSpotifyDeviceWithRetry(targetDeviceId, uri)) return false;
      await player.resume().catch(() => undefined);
    }
    return true;
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
    playbackClockRef.current = { position: 0, updatedAt: Date.now() };
    setPositionMs(0);
    setPaused(true);
    if (mode === "premium" && deviceId && premiumPlayerRef.current) {
      void startPremiumTrack(premiumPlayerRef.current, deviceId, active.track.spotifyUri).then(started => {
        if (!started) setPaused(true);
      });
    }
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
      seek(0);
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
        if (openRef.current) setMode("pending");
        return;
      }
      if (!token.accessToken) {
        setCapability("embed");
        if (openRef.current) setMode("embed");
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
          setMode("premium");
          setPaused(true);
        }
      });
      player.addListener("player_state_changed", state => {
        if (!state) return;
        const active = itemsRef.current[indexRef.current];
        const playingUri = state.track_window?.current_track?.uri || active?.track.spotifyUri || "";
        if (!active || playingUri !== active.track.spotifyUri) return;
        advanceLockRef.current = false;
        syncPlaybackState(state.position, state.duration, state.paused);
        if (!state.paused && state.position < 1800) playCommentCue();
        scheduleAutomaticAdvance(playingUri, state.position, state.duration, state.paused);
      });
      const fallbackToEmbed = () => {
        if (cancelled) return;
        setCapability("embed");
        if (openRef.current) setMode("embed");
      };
      const requireAuthorization = () => {
        if (cancelled) return;
        setCapability("reauthorize");
        setPaused(true);
        if (openRef.current) setMode("pending");
      };
      const retainPremiumPlayer = () => {
        if (cancelled) return;
        setCapability("premium");
        setMode("premium");
        setPaused(true);
        clearEndTimer();
        showToast(ru ? "Воспроизведение прервано. Нажмите Play ещё раз" : "Playback was interrupted. Tap Play to retry");
      };
      player.addListener("initialization_error", fallbackToEmbed);
      player.addListener("authentication_error", requireAuthorization);
      player.addListener("account_error", fallbackToEmbed);
      player.addListener("playback_error", retainPremiumPlayer);
      player.addListener("autoplay_failed", () => {
        if (cancelled) return;
        setPaused(true);
        showToast(ru ? "Браузер остановил автозапуск. Нажмите Play" : "Your browser blocked autoplay. Tap Play");
      });
      if (!await player.connect() && !cancelled) fallbackToEmbed();
    }).catch(() => {
      if (cancelled) return;
      setCapability("embed");
      if (openRef.current) setMode("embed");
    });
    return () => {
      cancelled = true;
      player?.disconnect();
      if (premiumPlayerRef.current === player) premiumPlayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open || mode !== "pending") return;
    if (capability === "embed") setMode("embed");
    if (capability === "reauthorize") {
      window.location.href = `/api/auth/spotify/start?returnTo=${encodeURIComponent(window.location.pathname)}`;
    }
  }, [capability, mode, open]);

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
          playbackClockRef.current = { position: 0, updatedAt: Date.now() };
          setPaused(false);
          playCommentCue();
        });
        controller.addListener("playback_update", event => {
          const active = itemsRef.current[indexRef.current];
          if (!active || event.data.playingURI !== active.track.spotifyUri) return;
          advanceLockRef.current = false;
          syncPlaybackState(event.data.position, event.data.duration, event.data.isPaused);
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
    playbackClockRef.current = { position: 0, updatedAt: Date.now() };
    advanceLockRef.current = true;
    clearEndTimer();
    playbackProgressRef.current = { uri: current.track.spotifyUri, position: 0, duration: 0 };
    cuePlayedRef.current = null;
    setPaused(true);
    if (mode === "premium" && deviceId) {
      const player = premiumPlayerRef.current;
      if (!player) return;
      void startPremiumTrack(player, deviceId, current.track.spotifyUri).then(started => {
        if (!started) {
          setPaused(true);
          showToast(ru ? "Не удалось запустить трек. Нажмите Play ещё раз" : "Could not start the track. Tap Play to retry");
        }
      });
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
    setReactions(currentReactions => {
      const next = { ...currentReactions };
      nextItems.forEach(item => {
        if (!next[item.id]) next[item.id] = { reacted: Boolean(item.viewerReacted), count: item.reactionCount || 0 };
      });
      return next;
    });
    setCurrentIndex(safeIndex);
    setOpen(true);
    setQueueVisible(false);
    setPositionMs(0);
    setDurationMs(0);
    playbackClockRef.current = { position: 0, updatedAt: Date.now() };
    clearEndTimer();
    advanceLockRef.current = true;
    playbackProgressRef.current = { uri: nextItems[safeIndex].track.spotifyUri, position: 0, duration: 0 };
    itemsRef.current = nextItems;
    indexRef.current = safeIndex;
    openRef.current = true;
    if (capability === "premium" && deviceId && premiumPlayerRef.current) {
      setMode("premium");
      setPaused(true);
      void preparePremiumPlayer(premiumPlayerRef.current);
    } else if (capability === "embed") {
      setMode("embed");
      setPaused(true);
    } else {
      setMode("pending");
      setPaused(true);
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
    if (mode === "pending") {
      if (capability === "reauthorize") {
        window.location.href = `/api/auth/spotify/start?returnTo=${encodeURIComponent(window.location.pathname)}`;
      } else showToast(ru ? "Подключаем Spotify…" : "Connecting to Spotify…");
      return;
    }
    if (mode === "premium") {
      const player = premiumPlayerRef.current;
      if (!player) return;
      if (paused) {
        playbackClockRef.current = { position: positionMs, updatedAt: Date.now() };
        setPaused(true);
        void preparePremiumPlayer(player).then(async () => {
          if (durationMs <= 0 && deviceId && current) {
            const started = await startPremiumTrack(player, deviceId, current.track.spotifyUri);
            if (!started) setPaused(true);
          } else await player.resume().catch(() => setPaused(true));
        });
      } else {
        const clock = playbackClockRef.current;
        const livePosition = Math.min(clock.position + (Date.now() - clock.updatedAt), durationMs || Number.MAX_SAFE_INTEGER);
        playbackClockRef.current = { position: livePosition, updatedAt: Date.now() };
        setPositionMs(livePosition);
        setPaused(true);
        clearEndTimer();
        void player.pause().catch(() => {
          playbackClockRef.current = { position: livePosition, updatedAt: Date.now() };
          setPaused(false);
        });
      }
      return;
    }
    if (paused) {
      playbackClockRef.current = { position: positionMs, updatedAt: Date.now() };
      setPaused(false);
      if (positionMs <= 250) controllerRef.current?.play();
      else controllerRef.current?.resume();
    } else {
      const clock = playbackClockRef.current;
      const livePosition = Math.min(clock.position + (Date.now() - clock.updatedAt), durationMs || Number.MAX_SAFE_INTEGER);
      playbackClockRef.current = { position: livePosition, updatedAt: Date.now() };
      setPositionMs(livePosition);
      setPaused(true);
      clearEndTimer();
      controllerRef.current?.pause();
    }
  }

  function seek(position: number) {
    if (mode === "pending") return;
    const safePosition = Math.max(0, Math.min(position, durationMs || position));
    playbackClockRef.current = { position: safePosition, updatedAt: Date.now() };
    setPositionMs(safePosition);
    if (mode === "premium") void premiumPlayerRef.current?.seek(safePosition);
    else controllerRef.current?.seek?.(safePosition / 1000);
  }

  function cycleRepeat() {
    setRepeat(value => value === "off" ? "all" : value === "all" ? "one" : "off");
  }

  async function toggleReaction() {
    if (!current || current.canReact === false) return;
    const previous = reactions[current.id] || { reacted: Boolean(current.viewerReacted), count: current.reactionCount || 0 };
    const optimistic = { reacted: !previous.reacted, count: Math.max(0, previous.count + (previous.reacted ? -1 : 1)) };
    setReactions(value => ({ ...value, [current.id]: optimistic }));

    if (!current.eventId) {
      showToast(optimistic.reacted
        ? (ru ? "Трек понравился" : "Track liked")
        : (ru ? "Лайк убран" : "Like removed"));
      return;
    }

    const response = await fetch(`/api/events/${encodeURIComponent(current.eventId)}/reactions`, { method: "POST" });
    if (response.status === 401) {
      setReactions(value => ({ ...value, [current.id]: previous }));
      window.location.href = `/api/auth/spotify/start?returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (!response.ok) {
      setReactions(value => ({ ...value, [current.id]: previous }));
      showToast(ru ? "Не удалось сохранить реакцию" : "Could not save reaction");
      return;
    }
    const payload = await response.json() as { reacted: boolean; count: number };
    setReactions(value => ({ ...value, [current.id]: payload }));
    showToast(payload.reacted
      ? (ru ? "Вы поставили лайк треку" : "You liked this track")
      : (ru ? "Лайк убран" : "Like removed"));
  }

  // Do not memoize playQueue: its Premium capability and device are resolved asynchronously.
  const contextValue = {
    playQueue,
    activeItemId: open && current ? current.id : null,
    activeEventId: open && current?.eventId ? current.eventId : null,
    activeTrackId: open && current ? current.track.id : null,
    paused,
    togglePlayback,
  };
  const progressPercent = durationMs > 0 ? Math.min(100, Math.max(0, positionMs / durationMs * 100)) : 0;
  const progressStyle = { "--taste-progress": `${progressPercent}%` } as CSSProperties;
  const reaction = current ? reactions[current.id] || { reacted: Boolean(current.viewerReacted), count: current.reactionCount || 0 } : { reacted: false, count: 0 };
  const controlsPending = mode === "pending";
  const profileHref = current?.profileHref;
  const profileExternal = Boolean(profileHref?.startsWith("http"));

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
            <a className="tasteQueueTrackLink tasteQueueArtworkLink" href={current.track.spotifyUrl} target="_blank" rel="noreferrer" aria-label={ru ? `Открыть ${current.track.title} в Spotify` : `Open ${current.track.title} on Spotify`}>
              <TrackArtwork src={current.track.coverUrl} fallbackSrc={current.track.fallbackCoverUrl} alt={`${current.track.title} cover`} className="tasteQueueArtwork" />
            </a>
          </div>
          <div className="tasteQueueNowPlaying">
            <a className="tasteQueueTrackLink tasteQueueMetaLink" href={current.track.spotifyUrl} target="_blank" rel="noreferrer">
              <strong>{current.track.title}</strong>
              <span className="tasteQueueArtist">{current.track.artist}</span>
            </a>
          </div>
          <div className="tasteQueueSource">
            {profileHref ? (
              <Link
                className="tasteQueueSourceLink"
                href={profileHref}
                target={profileExternal ? "_blank" : undefined}
                rel={profileExternal ? "noreferrer" : undefined}
                aria-label={ru ? `Открыть профиль ${current.tastemaker.name} у текущего трека` : `Open ${current.tastemaker.name}'s profile at the current track`}
              >
                <AvatarImage src={current.tastemaker.avatarUrl} fallbackSrc={current.tastemaker.fallbackAvatarUrl} alt="" />
                <span><small>{ru ? "По рекомендации" : "Recommended by"}</small><b>{current.tastemaker.name}</b></span>
              </Link>
            ) : (
              <span className="tasteQueueSourceLink tasteQueueSourceStatic">
                <AvatarImage src={current.tastemaker.avatarUrl} fallbackSrc={current.tastemaker.fallbackAvatarUrl} alt="" />
                <span><small>{ru ? "По рекомендации" : "Recommended by"}</small><b>{current.tastemaker.name}</b></span>
              </span>
            )}
            <em>{current.signal}</em>
          </div>

          {mode === "embed" ? <div className={`tasteQueueEmbed ${controllerReady ? "ready" : ""}`}>
            <div className="tasteQueueEmbedController" ref={embedTargetRef} />
          </div> : null}
          {current.authorNote && !queueVisible ? <div className="tasteQueuePremiumNote" role="note"><Icon name="comment" size={16} /><span><small>{ru ? "Комментарий автора" : "Tastemaker note"}</small><strong>“{current.authorNote}”</strong></span></div> : null}

          <div className="tasteQueueTransport">
            <button className={`tasteActionShuffle ${shuffle ? "active" : ""}`} type="button" onClick={() => setShuffle(value => !value)} disabled={controlsPending} aria-label={ru ? "В случайном порядке" : "Shuffle"}><Icon name="shuffle" size={18} /></button>
            <button className="tasteActionPrevious" type="button" onClick={previousTrack} disabled={controlsPending} aria-label={ru ? "Предыдущий трек" : "Previous track"}><Icon name="chevronLeft" /></button>
            <button className={`tasteQueuePremiumToggle tasteActionPlay ${controlsPending ? "connecting" : ""}`} type="button" onClick={togglePlayback} disabled={controlsPending} aria-label={controlsPending ? (ru ? "Подключаем Spotify" : "Connecting to Spotify") : paused ? (ru ? "Продолжить" : "Resume") : (ru ? "Пауза" : "Pause")}>{controlsPending ? <span className="tasteQueueConnecting" /> : <Icon name={paused ? "play" : "pause"} />}</button>
            <button className="tasteActionNext" type="button" onClick={() => nextTrack(false)} disabled={controlsPending} aria-label={ru ? "Следующий трек" : "Next track"}><Icon name="chevronRight" /></button>
            <button className={`tasteActionRepeat ${repeat !== "off" ? "active" : ""}`} type="button" onClick={cycleRepeat} disabled={controlsPending} aria-label={ru ? "Режим повтора" : "Repeat mode"}><span className="tasteRepeatIcon"><Icon name="repeat" size={18} />{repeat === "one" ? <i>1</i> : null}</span></button>
          </div>
          <div className="tasteQueueUtilities">
            {current.canReact !== false ? <button className={`tasteActionReaction ${reaction.reacted ? "active" : ""}`} type="button" onClick={toggleReaction} aria-label={reaction.reacted ? (ru ? "Убрать лайк с трека" : "Unlike track") : (ru ? "Поставить лайк треку" : "Like track")} title={reaction.count ? `${reaction.count}` : undefined}><Icon name="heart" size={18} /></button> : null}
            <button className={`tasteActionQueue ${queueVisible ? "active" : ""}`} type="button" onClick={() => setQueueVisible(value => !value)} aria-label={ru ? "Показать очередь" : "Show queue"}><Icon name="queue" size={18} /></button>
            {items.some(item => item.authorNote) ? <button className={`tasteActionSound ${commentSound ? "active" : ""}`} type="button" onClick={() => setCommentSound(value => !value)} aria-label={commentSound ? (ru ? "Выключить звук комментариев" : "Mute comment cue") : (ru ? "Включить звук комментариев" : "Enable comment cue")}><Icon name={commentSound ? "volume" : "volumeOff"} size={18} /></button> : null}
            <button className="tasteActionClose" type="button" onClick={closeQueue} aria-label={ru ? "Закрыть плеер" : "Close player"}><Icon name="close" size={18} /></button>
          </div>

          <div className="tasteQueueProgress">
            <span>{formatTime(positionMs)}</span>
            <input type="range" min={0} max={Math.max(durationMs, 1)} step={250} value={Math.min(positionMs, Math.max(durationMs, 1))} onChange={event => seek(Number(event.target.value))} disabled={controlsPending || durationMs <= 0} style={progressStyle} aria-label={ru ? "Позиция воспроизведения" : "Playback position"} aria-valuetext={`${formatTime(positionMs)} / ${formatTime(durationMs)}`} />
            <span>{formatTime(durationMs)}</span>
          </div>
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
  const { playQueue, activeItemId, activeEventId, activeTrackId, paused, togglePlayback } = useTastePlayback();
  if (!items.length) return null;
  const queueActive = items.some(item => item.id === activeItemId
    || Boolean(item.eventId && item.eventId === activeEventId)
    || item.track.id === activeTrackId);
  const isPlaying = queueActive && !paused;
  const pauseLabel = triggerAriaLabel.startsWith("С") ? "Пауза" : "Pause";
  const actionLabel = isPlaying ? pauseLabel : triggerAriaLabel;
  return <button className={`${triggerClassName}${isPlaying ? " playing" : ""}`} type="button" onClick={() => queueActive ? togglePlayback() : playQueue(items, startIndex)} aria-label={actionLabel} title={actionLabel} aria-pressed={isPlaying}><Icon name={isPlaying ? "pause" : "play"} size={iconOnly ? 25 : 18} />{!iconOnly ? <span>{isPlaying ? pauseLabel : triggerLabel}</span> : null}</button>;
}
