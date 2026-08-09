"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AvatarImage } from "@/components/AvatarImage";
import { DemoBadge } from "@/components/DemoBadge";
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
  totalDurationMs: number;
  track: TasteEvent["track"];
};

type SessionResponse = { configured: boolean; user: SessionUser | null };
type ProfileResponse = { events: TasteEvent[]; weeklyHistory: WeeklyTrack[] };
type ViewState = "loading" | "disconnected" | "connected" | "error";

function formatDate(value: string | null, locale: "en" | "ru") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
    const authError = searchParams.get("error");
    if (authError) {
      const message = authError === "access_denied"
        ? (locale === "ru" ? "Авторизация Spotify отменена." : "Spotify authorization was cancelled.")
        : authError === "database" ? t("my.databaseMissing")
        : authError === "state" ? (locale === "ru" ? "Сессия авторизации истекла. Попробуйте ещё раз." : "The authorization session expired. Please try again.")
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

  async function disconnect() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setEvents([]);
    setWeeklyHistory([]);
    setState("disconnected");
    showToast(locale === "ru" ? "Spotify отключён от этого браузера." : "Spotify disconnected from this browser.");
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
    <main className="page">
      <div className="myTasteHeader">
        <div>
          <div className="eyebrow">{t("my.eyebrow")}</div>
          <h1 className="pageTitle">{t("my.title")}</h1>
          <p className="lead">{t("my.lead")}</p>
        </div>
        {state === "connected" ? (
          <div className="buttonRow headerActions">
            <button className="btn btnPrimary" type="button" onClick={sync} disabled={syncing}>
              <Icon name="feed" />{syncing ? t("my.syncing") : t("my.sync")}
            </button>
            <button className="btn btnGhost" type="button" onClick={disconnect}>{t("my.disconnect")}</button>
          </div>
        ) : (
          <a className={`btn btnPrimary ${!configured ? "disabled" : ""}`} href={configured ? "/api/auth/spotify/start?returnTo=/my-taste" : undefined} aria-disabled={!configured}>
            <Icon name="user" />{t("my.connect")}
          </a>
        )}
      </div>

      {error ? <section className="errorState section" role="alert"><strong>{locale === "ru" ? "Нужна проверка" : "Needs attention"}</strong><p>{error}</p></section> : null}

      {state === "loading" ? <section className="panel section"><SkeletonRows /></section> : null}

      {state === "disconnected" || state === "error" ? (
        <section className="connectExperience section">
          <article className="panel connectPrimary">
            <div className="connectIcon"><Icon name="taste" size={32} /></div>
            <DemoBadge>{t("common.demoData")}</DemoBadge>
            <h2>{t("my.disconnectedTitle")}</h2>
            <p className="muted">{t("my.disconnectedBody")}</p>
            <a className={`btn btnPrimary ${!configured ? "disabled" : ""}`} href={configured ? "/api/auth/spotify/start?returnTo=/my-taste" : undefined} aria-disabled={!configured}>
              <Icon name="user" />{t("my.connect")}
            </a>
          </article>
          <aside className="panel trustPanel">
            <div className="whyList">
              <div className="whyItem"><span className="whyIcon"><Icon name="privacy" /></span><span>{t("my.noSecret")}</span></div>
              <div className="whyItem"><span className="whyIcon"><Icon name="feed" /></span><span>{t("my.allowlist")}</span></div>
              <div className="whyItem"><span className="whyIcon"><Icon name="taste" /></span><span>{t("my.shareBody")}</span></div>
            </div>
          </aside>
        </section>
      ) : null}

      {state === "connected" && user ? (
        <>
          <section className="accountHero section">
            <div className="accountIdentity">
              <div className="accountAvatar"><AvatarImage src={user.avatarUrl || ""} alt={user.displayName} /></div>
              <div>
                <DemoBadge>{t("common.spotifyData")}</DemoBadge>
                <h2>{t("my.connectedAs", { name: user.displayName })}</h2>
                <p className="muted">@{user.handle} · {t("my.lastSync")}: {user.lastSyncedAt ? formatDate(user.lastSyncedAt, locale) : t("my.never")}</p>
              </div>
            </div>
            <div className="buttonRow">
              <Link className="btn btnPrimary" href={`/taste/${user.handle}`}><Icon name="external" />{t("my.openProfile")}</Link>
              <button className="btn btnSubtle" type="button" onClick={copyProfile}><Icon name="spark" />{t("my.copy")}</button>
            </div>
          </section>

          <section className="grid4 section" aria-label="Taste account statistics">
            <article className="metricCard"><div className="metricLabel">{t("my.followers")}</div><div className="metricNumber">{user.stats.followers}</div><div className="metricDelta">{t("profile.realStats")}</div></article>
            <article className="metricCard"><div className="metricLabel">{t("my.listens")}</div><div className="metricNumber">{user.stats.events}</div><div className="metricDelta">{t("profile.realStats")}</div></article>
            <article className="metricCard"><div className="metricLabel">{t("my.minutes")}</div><div className="metricNumber">{minutes7d}</div><div className="metricDelta">{t("profile.realStats")}</div></article>
            <article className="metricCard"><div className="metricLabel">{t("my.unique")}</div><div className="metricNumber">{user.stats.unique_tracks_7d}</div><div className="metricDelta">{t("profile.realStats")}</div></article>
          </section>

          <section className="section weeklyHistorySection">
            <div className="sectionHeader">
              <div className="sectionTitleStack"><div className="eyebrow">Taste · 7 days</div><h2>{locale === "ru" ? "Ваша недельная история" : "Your weekly history"}</h2></div>
              <DemoBadge>{locale === "ru" ? `Треков: ${weeklyHistory.length}` : `${weeklyHistory.length} tracks`}</DemoBadge>
            </div>
            {weeklyHistory.length ? (
              <div className="weeklyTrackList">
                {weeklyHistory.map((item, index) => (
                  <a className="weeklyTrackRow" href={item.track.spotifyUrl} target="_blank" rel="noreferrer" key={item.track.id}>
                    <span className="trackNumber">{index + 1}</span>
                    <TrackArtwork src={item.track.coverUrl || ""} alt={`${item.track.title} cover`} className="trackThumb" />
                    <span className="weeklyTrackCopy"><strong>{item.track.title}</strong><span>{item.track.artist}</span><em>{formatDate(item.lastPlayedAt, locale)}</em></span>
                    <span className="weeklyTrackMetrics">
                      <span className="weeklyTrackMetric"><strong>{item.playCount}</strong><span>{locale === "ru" ? "за 7 дней" : "7-day plays"}</span></span>
                      <span className="weeklyTrackMetric"><strong>{item.popularity}</strong><span>{locale === "ru" ? "популярность" : "popularity"}</span></span>
                    </span>
                    <span className="rowOpenIcon"><Icon name="external" size={17} /></span>
                  </a>
                ))}
              </div>
            ) : <div className="emptyState">{t("my.empty")}</div>}
          </section>

          <section className="profileEditor section">
            <div>
              <div className="eyebrow">{t("my.profile")}</div>
              <h2>{t("my.shareTitle")}</h2>
              <p className="muted">{t("my.shareBody")}</p>
            </div>
            <div className="formGrid">
              <label><span>{t("my.handle")}</span><input value={profileDraft.handle} onChange={event => setProfileDraft(current => ({ ...current, handle: event.target.value }))} /></label>
              <label><span>{t("my.role")}</span><input value={profileDraft.role} onChange={event => setProfileDraft(current => ({ ...current, role: event.target.value }))} /></label>
              <label className="formWide"><span>{t("my.bio")}</span><textarea value={profileDraft.bio} onChange={event => setProfileDraft(current => ({ ...current, bio: event.target.value }))} /></label>
              <button className="btn btnPrimary formAction" type="button" onClick={updateProfile} disabled={savingProfile}><Icon name="check" />{t("my.updateProfile")}</button>
            </div>
          </section>

          <section className="section">
            <div className="sectionHeader">
              <div><div className="eyebrow">{t("my.recent")}</div><h2>{t("profile.whatFollowersSee")}</h2></div>
              <DemoBadge>{t("profile.publicEvents", { count: events.filter(event => event.isPublic).length })}</DemoBadge>
            </div>
            {events.length ? (
              <div className="ownerEventList">
                {events.map(event => (
                  <article className="ownerEventCard" key={event.id}>
                    <TrackArtwork src={event.track.coverUrl || ""} alt={`${event.track.title} cover`} className="trackThumb" />
                    <div className="ownerEventMain">
                      <strong>{event.track.title}</strong>
                      <span>{event.track.artist}</span>
                      <em>{formatDate(event.playedAt, locale)} · {t("profile.repeat", { count: event.repeatCount })}</em>
                      {event.authorNote ? <p>{event.authorNote}</p> : null}
                    </div>
                    <div className="ownerEventActions">
                      <button className={`visibilityButton ${event.isPublic ? "public" : ""}`} type="button" onClick={() => updateEvent(event.id, { isPublic: !event.isPublic })} aria-pressed={event.isPublic}>
                        <Icon name={event.isPublic ? "check" : "hide"} size={17} />{event.isPublic ? t("my.publish") : t("my.private")}
                      </button>
                      <button className="btn btnSubtle btnCompact" type="button" onClick={() => { setNoteEventId(event.id); setNoteDraft(event.authorNote || ""); }}><Icon name="feed" size={17} />{event.authorNote ? t("my.editNote") : t("my.addNote")}</button>
                    </div>
                    {noteEventId === event.id ? (
                      <div className="inlineNoteEditor">
                        <textarea value={noteDraft} onChange={change => setNoteDraft(change.target.value)} placeholder={t("my.notePlaceholder")} autoFocus />
                        <div className="buttonRow">
                          <button className="btn btnPrimary btnCompact" type="button" onClick={() => updateEvent(event.id, { authorNote: noteDraft })}>{t("common.save")}</button>
                          <button className="btn btnSubtle btnCompact" type="button" onClick={() => setNoteEventId(null)}>{t("common.cancel")}</button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : <div className="emptyState">{t("my.empty")}</div>}
          </section>

          {user.topTracks?.length ? (
            <section className="panel section">
              <div className="sectionHeader"><h2>{locale === "ru" ? "Топ треков за короткий период" : "Short-term top tracks"}</h2><DemoBadge>{t("common.spotifyData")}</DemoBadge></div>
              <div className="spotifyList compactSpotifyList">
                {user.topTracks.slice(0, 8).map(track => (
                  <a className="spotifyRow" href={track.external_urls?.spotify} target="_blank" rel="noreferrer" key={track.id}>
                    <TrackArtwork src={track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || ""} alt={`${track.name} cover`} className="spotifyThumb" />
                    <div className="rowGrow"><div className="trackTitle">{track.name}</div><div className="trackArtist">{track.artists?.map(artist => artist.name).join(", ")}</div></div>
                    <Icon name="external" size={18} />
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
