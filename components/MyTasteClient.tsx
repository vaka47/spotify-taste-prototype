"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AvatarImage } from "@/components/AvatarImage";
import { ConnectionsDialog } from "@/components/ConnectionsDialog";
import { Icon } from "@/components/Icons";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { useI18n } from "@/lib/i18n";

type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms?: number;
  artists?: Array<{ id: string; name: string }>;
  album?: { name?: string; images?: Array<{ url: string }> };
  external_urls?: { spotify?: string };
};

type SessionUser = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  bio: string;
  shareEnabled: boolean;
  shareDelayHours: number;
  selectedSessionsOnly: boolean;
  lastSyncedAt: string | null;
  stats: { followers: number; following: number; events: number; duration_ms_7d: string | number; unique_tracks_7d: number };
  topTracks: SpotifyTrack[];
  topArtists: Array<{ id: string; name: string; images?: Array<{ url: string }> }>;
};

type TasteEvent = {
  id: string;
  playedAt: string;
  authorNote: string | null;
  isPublic: boolean;
  repeatCount: number;
  track: {
    id: string;
    title: string;
    artist: string;
    coverUrl: string | null;
    spotifyUrl: string;
    spotifyEmbedUrl: string;
  };
};

type WeeklyTrack = {
  eventId: string;
  playCount: number;
  popularity: number;
  lastPlayedAt: string;
  previousPlayedAt: string | null;
  totalDurationMs: number;
  track: TasteEvent["track"];
};

type SessionResponse = { configured: boolean; user: SessionUser | null };
type ProfileResponse = { events: TasteEvent[]; weeklyHistory: WeeklyTrack[] };
type ViewState = "loading" | "disconnected" | "connected" | "error";
type OwnerTab = "listening" | "shared" | "settings";

function formatDate(value: string | null, locale: "en" | "ru") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function weeklyBehavior(item: WeeklyTrack, locale: "en" | "ru") {
  if (item.previousPlayedAt) {
    const days = Math.max(1, Math.round((new Date(item.lastPlayedAt).getTime() - new Date(item.previousPlayedAt).getTime()) / 86_400_000));
    if (days >= 60) return locale === "ru" ? `Вернулись спустя ${Math.round(days / 30)} мес.` : `Back after ${Math.round(days / 30)} months`;
    return locale === "ru" ? `Вернулись спустя ${days} дн.` : `Back after ${days} days`;
  }
  if (item.playCount > 1) return locale === "ru" ? "На повторе" : "On repeat";
  return locale === "ru" ? "Одно прослушивание" : "Played once";
}

function weeklyPlayCount(value: number, locale: "en" | "ru") {
  if (locale === "en") return `${value} ${value === 1 ? "play" : "plays"} in 7 days`;
  const mod100 = value % 100;
  const mod10 = value % 10;
  const noun = mod100 >= 11 && mod100 <= 14 ? "прослушиваний" : mod10 === 1 ? "прослушивание" : mod10 >= 2 && mod10 <= 4 ? "прослушивания" : "прослушиваний";
  return `${value} ${noun} за 7 дней`;
}

function SkeletonRows() {
  return (
    <div className="spotifyList" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="spotifyRow" key={index}>
          <div className="spotifyThumb skeleton" />
          <div className="rowGrow">
            <div className="skeleton" style={{ width: "min(210px, 72%)", height: 16 }} />
            <div className="skeleton" style={{ width: "min(142px, 52%)", height: 12, marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MyTasteClient() {
  const { locale, t } = useI18n();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ViewState>("loading");
  const [configured, setConfigured] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [events, setEvents] = useState<TasteEvent[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyTrack[]>([]);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ handle: "", role: "", bio: "" });
  const [noteEventId, setNoteEventId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [connectionType, setConnectionType] = useState<"followers" | "following" | null>(null);
  const [activeTab, setActiveTab] = useState<OwnerTab>("listening");
  const autoSyncStarted = useRef(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await sessionResponse.json() as SessionResponse;
      setConfigured(session.configured);
      if (!session.user) {
        setUser(null);
        setEvents([]);
        setWeeklyHistory([]);
        setState("disconnected");
        return;
      }
      setUser(session.user);
      setProfileDraft({ handle: session.user.handle, role: session.user.role, bio: session.user.bio });
      const profileResponse = await fetch(`/api/profiles/${encodeURIComponent(session.user.handle)}`, { cache: "no-store" });
      if (profileResponse.ok) {
        const profile = await profileResponse.json() as ProfileResponse;
        setEvents(profile.events);
        setWeeklyHistory(profile.weeklyHistory || []);
      }
      setState("connected");
    } catch (caught) {
      setError((caught as Error).message);
      setState("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!noteEventId) return;
    const frame = window.requestAnimationFrame(() => document.querySelector(`[data-note-editor="${noteEventId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    return () => window.cancelAnimationFrame(frame);
  }, [noteEventId]);

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError) {
      const message = authError === "access_denied"
        ? (locale === "ru" ? "Авторизация Spotify отменена." : "Spotify authorization was cancelled.")
        : authError === "database" ? t("my.databaseMissing")
        : authError === "state" ? (locale === "ru" ? "Сессия авторизации истекла. Попробуйте ещё раз." : "The authorization session expired. Please try again.")
        : authError === "allowlist" ? t("my.allowlist")
        : authError === "rate_limit" ? (locale === "ru" ? "Spotify временно ограничил запросы. Повторите через минуту." : "Spotify temporarily rate-limited requests. Try again in a minute.")
        : (locale === "ru" ? "Spotify не завершил авторизацию. Попробуйте ещё раз." : "Spotify did not complete authorization. Please try again.");
      setError(message);
    }
    if (searchParams.get("connected") === "1") showToast(locale === "ru" ? "Spotify подключён. Синхронизируем историю." : "Spotify connected. Syncing listening history.");
  }, [locale, searchParams, showToast, t]);

  async function sync() {
    setSyncing(true);
    setError("");
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const payload = await response.json() as { inserted?: number; error?: string };
      if (!response.ok) {
        if (payload.error === "allowlist") throw new Error(t("my.allowlist"));
        if (payload.error === "rate_limit") throw new Error(locale === "ru" ? "Spotify временно ограничил запросы. Повторите через минуту." : "Spotify temporarily rate-limited requests. Try again in a minute.");
        throw new Error(locale === "ru" ? "Не удалось синхронизировать Spotify." : "Spotify sync failed.");
      }
      showToast(locale === "ru" ? `Добавлено новых прослушиваний: ${payload.inserted || 0}` : `${payload.inserted || 0} new listening events added`);
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    const lastSync = user?.lastSyncedAt ? new Date(user.lastSyncedAt).getTime() : 0;
    const stale = !lastSync || Date.now() - lastSync > 10 * 60_000;
    if (state === "connected" && stale && !syncing && !autoSyncStarted.current) {
      autoSyncStarted.current = true;
      void sync();
    }
    // Sync once on an owner visit when the stored snapshot is stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user?.lastSyncedAt]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setEvents([]);
    setWeeklyHistory([]);
    setState("disconnected");
    showToast(locale === "ru" ? "Вы вышли из аккаунта." : "You have been logged out.");
  }

  async function updateProfile() {
    setSavingProfile(true);
    const response = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileDraft),
    });
    const payload = await response.json() as { error?: string };
    setSavingProfile(false);
    if (!response.ok) {
      setError(payload.error === "handle_taken"
        ? (locale === "ru" ? "Этот публичный адрес уже занят." : "That public handle is already taken.")
        : (locale === "ru" ? "Не удалось обновить профиль." : "Could not update the profile."));
      return;
    }
    showToast(locale === "ru" ? "Публичный профиль обновлён." : "Public profile updated.");
    await load();
  }

  async function updateEvent(eventId: string, changes: { authorNote?: string | null; isPublic?: boolean }) {
    const response = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!response.ok) {
      setError(locale === "ru" ? "Не удалось обновить прослушивание." : "Could not update this listening event.");
      return;
    }
    setNoteEventId(null);
    showToast(locale === "ru" ? "Событие обновлено для подписчиков." : "Taste event updated for followers.");
    await load();
  }

  async function copyProfile() {
    if (!user) return;
    const url = `${window.location.origin}/taste/${user.handle}`;
    await navigator.clipboard.writeText(url);
    showToast(t("my.copied"));
  }

  const minutes7d = useMemo(() => Math.round(Number(user?.stats.duration_ms_7d || 0) / 60_000), [user]);

  return (
    <main className="spxMyTastePage">
      <header className="spxMyTasteHeader">
        <span>{state === "connected" ? (locale === "ru" ? "ВАШ ПУБЛИЧНЫЙ СИГНАЛ" : "YOUR PUBLIC TASTE SIGNAL") : "SPOTIFY TASTE"}</span>
        <h1>{state === "connected" ? (locale === "ru" ? "Ваш Taste" : "Your Taste") : t("nav.my")}</h1>
        <p>{state === "connected" ? (locale === "ru" ? "История, которую видят ваши подписчики" : "The listening history your followers can see") : (locale === "ru" ? "Подключите Spotify, чтобы делиться музыкой и подписываться на Taste друзей." : "Connect Spotify to share music and follow your friends' Taste.")}</p>
      </header>

      {error ? <section className="spxError" role="alert"><Icon name="info" /><span><strong>{locale === "ru" ? "Не удалось выполнить действие" : "Action needed"}</strong><p>{error}</p></span></section> : null}
      {state === "loading" ? <section className="spxLoading"><SkeletonRows /></section> : null}

      {state === "disconnected" || state === "error" ? (
        <section className="spxConnectPanel">
          <span><Icon name="user" size={30} /></span>
          <div><h2>{t("my.connect")}</h2><p>{t("my.disconnectedBody")}</p><small><Icon name="privacy" size={14} />{t("my.noSecret")}</small></div>
          <a className={`spxPrimaryButton ${!configured ? "disabled" : ""}`} href={configured ? "/api/auth/spotify/start?returnTo=/my-taste" : undefined} aria-disabled={!configured}>{t("my.connect")}</a>
        </section>
      ) : null}

      {state === "connected" && user ? (
        <>
          <section className="spxOwnerHero">
            <span className="spxOwnerAvatar"><AvatarImage src={user.avatarUrl || ""} alt={user.displayName} /></span>
            <div className="spxOwnerCopy"><small>{t("common.spotifyData")}</small><h2>{user.displayName}</h2><p>@{user.handle} · {locale === "ru" && user.role === "Spotify listener" ? "слушатель Spotify" : user.role}</p><em>{t("my.lastSync")}: {user.lastSyncedAt ? formatDate(user.lastSyncedAt, locale) : t("my.never")}</em></div>
            <div className="spxOwnerActions"><button type="button" onClick={sync} disabled={syncing} aria-label={syncing ? t("my.syncing") : t("my.sync")}><Icon name="feed" /></button><Link href={`/taste/${user.handle}`} aria-label={t("my.openProfile")}><Icon name="external" /></Link><button type="button" onClick={copyProfile} aria-label={t("my.copy")}><Icon name="spark" /></button></div>
          </section>

          <section className="spxOwnerStats" aria-label={locale === "ru" ? "Статистика Taste" : "Taste statistics"}>
            <button type="button" onClick={() => setConnectionType("followers")}><strong>{user.stats.followers}</strong><span>{t("my.followers")}</span></button>
            <button type="button" onClick={() => setConnectionType("following")}><strong>{user.stats.following}</strong><span>{locale === "ru" ? "Подписки" : "Following"}</span></button>
            <div><strong>{minutes7d}</strong><span>{locale === "ru" ? "Минут за 7 дней" : "Minutes in 7 days"}</span></div>
            <div><strong>{user.stats.unique_tracks_7d}</strong><span>{locale === "ru" ? "Уникальные треки" : "Unique tracks"}</span></div>
          </section>

          <nav className="spxOwnerTabs" role="tablist" aria-label={locale === "ru" ? "Разделы вашего Taste" : "Your Taste sections"}>
            <button id="owner-tab-listening" type="button" role="tab" aria-controls="owner-panel-listening" aria-selected={activeTab === "listening"} className={activeTab === "listening" ? "active" : ""} onClick={() => setActiveTab("listening")}>{locale === "ru" ? "История" : "Listening"}</button>
            <button id="owner-tab-shared" type="button" role="tab" aria-controls="owner-panel-shared" aria-selected={activeTab === "shared"} className={activeTab === "shared" ? "active" : ""} onClick={() => setActiveTab("shared")}><span>{locale === "ru" ? "Публикации" : "Shared"}</span><small>{events.filter(event => event.isPublic).length}</small></button>
            <button id="owner-tab-settings" type="button" role="tab" aria-controls="owner-panel-settings" aria-selected={activeTab === "settings"} className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>{locale === "ru" ? "Настройки" : "Settings"}</button>
          </nav>

          {activeTab === "listening" ? <section id="owner-panel-listening" className="spxOwnerSection" role="tabpanel" aria-labelledby="owner-tab-listening">
            <div className="spxSectionHeading"><h2>{locale === "ru" ? "История за неделю" : "This week's listening"}</h2><span>{locale === "ru" ? "По повторам и популярности" : "By repeats, then popularity"}</span></div>
            {weeklyHistory.length ? <div className="spxOwnerHistory">{weeklyHistory.map((item, index) => <a href={item.track.spotifyUrl} target="_blank" rel="noreferrer" key={item.track.id}><span>{index + 1}</span><TrackArtwork src={item.track.coverUrl || ""} alt={`${item.track.title} cover`} className="spxOwnerTrackCover" /><span><strong>{item.track.title}</strong><small>{item.track.artist}</small><em>{weeklyBehavior(item, locale)} · {formatDate(item.lastPlayedAt, locale)}</em></span><b>{item.playCount}<small>{locale === "ru" ? "прослушиваний" : "plays"}</small></b><Icon name="external" size={16} /></a>)}</div> : <div className="spxFeedEmpty">{t("my.empty")}</div>}
          </section> : null}

          {activeTab === "shared" ? <section id="owner-panel-shared" className="spxOwnerSection" role="tabpanel" aria-labelledby="owner-tab-shared">
            <div className="spxSectionHeading"><h2>{locale === "ru" ? "Что увидят подписчики" : "What followers see"}</h2><span>{locale === "ru" ? `Опубликовано: ${events.filter(event => event.isPublic).length}` : `${events.filter(event => event.isPublic).length} public`}</span></div>
            {events.length ? <div className="spxOwnerEvents">{events.map(event => <article key={event.id}><TrackArtwork src={event.track.coverUrl || ""} alt={`${event.track.title} cover`} className="spxOwnerTrackCover" /><div><strong>{event.track.title}</strong><small>{event.track.artist}</small><em>{formatDate(event.playedAt, locale)} · {weeklyPlayCount(event.repeatCount, locale)} · <b className={event.isPublic ? "isPublic" : "isPrivate"}>{event.isPublic ? (locale === "ru" ? "В ленте" : "In feed") : (locale === "ru" ? "Скрыто" : "Hidden")}</b></em>{event.authorNote ? <p>“{event.authorNote}”</p> : null}</div><div><button className={event.isPublic ? "active" : ""} type="button" title={event.isPublic ? (locale === "ru" ? "Скрыть из ленты" : "Hide from feed") : (locale === "ru" ? "Опубликовать в ленте" : "Publish to feed")} aria-label={event.isPublic ? (locale === "ru" ? "Скрыть из ленты" : "Hide from feed") : (locale === "ru" ? "Опубликовать в ленте" : "Publish to feed")} onClick={() => updateEvent(event.id, { isPublic: !event.isPublic })}><Icon name={event.isPublic ? "check" : "hide"} size={17} /></button><button type="button" title={event.authorNote ? t("my.editNote") : t("my.addNote")} aria-label={event.authorNote ? t("my.editNote") : t("my.addNote")} onClick={() => { setNoteEventId(event.id); setNoteDraft(event.authorNote || ""); }}><Icon name="comment" size={17} /></button></div>{noteEventId === event.id ? <div className="spxOwnerNote" data-note-editor={event.id}><textarea value={noteDraft} onChange={change => setNoteDraft(change.target.value)} placeholder={t("my.notePlaceholder")} autoFocus /><button type="button" onClick={() => updateEvent(event.id, { authorNote: noteDraft })}>{t("common.save")}</button><button type="button" onClick={() => setNoteEventId(null)}>{t("common.cancel")}</button></div> : null}</article>)}</div> : <div className="spxFeedEmpty">{t("my.empty")}</div>}
          </section> : null}

          {activeTab === "settings" ? <section id="owner-panel-settings" className="spxOwnerSettings spxOwnerSettingsPanel" role="tabpanel" aria-labelledby="owner-tab-settings">
            <div className="spxSectionHeading"><h2>{locale === "ru" ? "Профиль и настройки" : "Profile and settings"}</h2><span>{locale === "ru" ? "Публичный профиль и приватность" : "Public profile and privacy"}</span></div>
            <div className="spxOwnerForm"><label><span>{t("my.handle")}</span><input value={profileDraft.handle} onChange={event => setProfileDraft(current => ({ ...current, handle: event.target.value }))} /></label><label><span>{t("my.role")}</span><input value={profileDraft.role} onChange={event => setProfileDraft(current => ({ ...current, role: event.target.value }))} /></label><label className="wide"><span>{t("my.bio")}</span><textarea value={profileDraft.bio} onChange={event => setProfileDraft(current => ({ ...current, bio: event.target.value }))} /></label><button type="button" onClick={updateProfile} disabled={savingProfile}>{t("my.updateProfile")}</button></div>
            <div className="spxOwnerSettingsLinks"><Link href="/privacy"><Icon name="privacy" size={16} />{t("nav.privacy")}</Link><button type="button" onClick={logout}><Icon name="logout" size={16} />{locale === "ru" ? "Выйти" : "Log out"}</button></div>
          </section> : null}
          <ConnectionsDialog open={connectionType !== null} onClose={() => setConnectionType(null)} handle={user.handle} initialType={connectionType || "followers"} />
        </>
      ) : null}
    </main>
  );
}
