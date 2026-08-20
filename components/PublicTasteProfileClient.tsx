"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { TasteQueuePlayer } from "@/components/TasteQueuePlayer";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import { useI18n } from "@/lib/i18n";
import type { TasteQueueItem, TrackRef } from "@/types/taste";
import {
  SOCIAL_COMMENTS_KEY,
  decodeSnapshot,
  profileFromSnapshot,
  pushNotification,
  readFollowingProfiles,
  readJson,
  seededTasteProfiles,
  writeFollowingProfiles,
  writeJson,
  type PublicTasteProfile,
} from "@/lib/social-taste";

type ServerComment = {
  id: string;
  event_id?: string;
  eventId?: string;
  body: string;
  created_at?: string;
  createdAt?: string;
  author_handle?: string;
  authorHandle?: string;
  author_name?: string;
  authorName?: string;
  author_avatar?: string | null;
  authorAvatar?: string | null;
};

type ServerEvent = {
  id: string;
  playedAt: string;
  authorNote: string | null;
  isPublic: boolean;
  repeatCount: number;
  commentCount: number;
  comments: ServerComment[];
  track: {
    id: string;
    title: string;
    artist: string;
    albumName: string | null;
    coverUrl: string | null;
    spotifyUrl: string;
    spotifyEmbedUrl: string;
    durationMs: number;
  };
};

type ServerWeeklyTrack = {
  eventId: string;
  playCount: number;
  popularity: number;
  lastPlayedAt: string;
  totalDurationMs: number;
  track: ServerEvent["track"];
};

type ServerProfile = {
  id: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  bio: string;
  verified: boolean;
  followers: number;
  following: number;
  totalEvents: number;
  durationMs7d: number;
  uniqueTracks7d: number;
  lastSyncedAt: string | null;
  viewerFollows: boolean;
  isOwner: boolean;
  source: "spotify_authorized";
};

type ServerProfileResponse = { profile: ServerProfile; events: ServerEvent[]; weeklyHistory: ServerWeeklyTrack[] };
type LocalComment = { id: string; eventId: string; profileHandle: string; author: string; text: string; createdAt: string };
type LoadState = "loading" | "ready" | "not_found" | "private" | "error";

function fallbackProfile(handle: string): PublicTasteProfile {
  return { ...seededTasteProfiles.ivan, handle, name: "Shared Taste profile", source: "seeded" };
}

function formatPlayedAt(value: string, locale: "en" | "ru") {
  const date = new Date(value);
  const deltaMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (deltaMinutes < 1) return locale === "ru" ? "только что" : "just now";
  if (deltaMinutes < 60) return locale === "ru" ? `${deltaMinutes} мин назад` : `${deltaMinutes} min ago`;
  if (deltaMinutes < 1440) return locale === "ru" ? `${Math.round(deltaMinutes / 60)} ч назад` : `${Math.round(deltaMinutes / 60)}h ago`;
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short" }).format(date);
}

function russianRepeatLabel(value: number) {
  const mod100 = value % 100;
  const mod10 = value % 10;
  if (mod100 >= 11 && mod100 <= 14) return "повторов";
  if (mod10 === 1) return "повтор";
  if (mod10 >= 2 && mod10 <= 4) return "повтора";
  return "повторов";
}

export function PublicTasteProfileClient({ handle }: { handle: string }) {
  const searchParams = useSearchParams();
  const { locale, t } = useI18n();
  const { showToast } = useToast();
  const snapshot = useMemo(() => decodeSnapshot(searchParams.get("snapshot")), [searchParams]);
  const requestedEventId = searchParams.get("event");
  const demoProfile = useMemo(() => snapshot ? profileFromSnapshot(snapshot) : (seededTasteProfiles[handle] ?? fallbackProfile(handle)), [handle, snapshot]);
  const hasKnownDemo = Boolean(snapshot || seededTasteProfiles[handle]);
  const [state, setState] = useState<LoadState>("loading");
  const [serverProfile, setServerProfile] = useState<ServerProfile | null>(null);
  const [serverEvents, setServerEvents] = useState<ServerEvent[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<ServerWeeklyTrack[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [following, setFollowing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState<LocalComment[]>([]);
  const [connected, setConnected] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [profileResponse, sessionResponse] = await Promise.all([
        fetch(`/api/profiles/${encodeURIComponent(handle)}`, { cache: "no-store", signal: AbortSignal.timeout(hasKnownDemo ? 2500 : 12_000) }),
        fetch("/api/auth/session", { cache: "no-store", signal: AbortSignal.timeout(hasKnownDemo ? 2500 : 12_000) }),
      ]);
      if (sessionResponse.ok) {
        const session = await sessionResponse.json() as { user?: unknown };
        setConnected(Boolean(session.user));
      }
      if (profileResponse.ok) {
        const data = await profileResponse.json() as ServerProfileResponse;
        setServerProfile(data.profile);
        setServerEvents(data.events);
        setWeeklyHistory(data.weeklyHistory || []);
        setSelectedId(current => data.events.some(event => event.id === requestedEventId) ? requestedEventId! : data.weeklyHistory.some(item => item.eventId === current) ? current : data.weeklyHistory[0]?.eventId || data.events[0]?.id || "");
        setFollowing(data.profile.viewerFollows);
        setState("ready");
        return;
      }
      if (hasKnownDemo) {
        setServerProfile(null);
        setServerEvents([]);
        setWeeklyHistory([]);
        setSelectedId(current => demoProfile.events.some(event => event.id === current) ? current : demoProfile.events[0]?.id || "");
        setFollowing(readFollowingProfiles().includes(demoProfile.handle));
        setLocalComments(readJson<LocalComment[]>(SOCIAL_COMMENTS_KEY, []));
        setState("ready");
        return;
      }
      setState(profileResponse.status === 403 ? "private" : profileResponse.status === 404 ? "not_found" : "error");
    } catch {
      if (hasKnownDemo) {
        setServerProfile(null);
        setSelectedId(demoProfile.events[0]?.id || "");
        setState("ready");
      } else setState("error");
    }
  }, [demoProfile, handle, hasKnownDemo, requestedEventId]);

  useEffect(() => { void load(); }, [load]);

  const isReal = Boolean(serverProfile);
  const selectedServerEvent = serverEvents.find(event => event.id === selectedId) || serverEvents[0];
  const selectedDemoEvent = demoProfile.events.find(event => event.id === selectedId) || demoProfile.events[0];
  const profileName = serverProfile?.name || demoProfile.name;
  const profileHandle = serverProfile?.handle || demoProfile.handle;
  const selectedTrack = selectedServerEvent?.track || selectedDemoEvent?.track;
  const demoRu = locale === "ru" ? {
    role: handle === "maya" ? "Диджей и селектор" : "Продуктовый куратор вкуса",
    bio: handle === "maya"
      ? "Второй демонстрационный профиль показывает, как независимые тейстмейкеры могут превращать влияние в отдельный актив."
      : "Добровольно опубликованные рекомендации, повторы и открытия. Подписчики видят музыку вместе с контекстом автора.",
    signals: {
      ivan_ev_euphoria: "Рекомендация автора",
      ivan_ev_chamber: "Сохранённое открытие",
      ivan_ev_lvbag: "Сохранено после первого прослушивания",
      ivan_ev_fein: "На повторе",
      maya_ev_nissan: "После клубного сета",
      maya_ev_likehim: "Опубликовано из приватной сессии",
    } as Record<string, string>,
    notes: {
      ivan_ev_euphoria: "Пример трека, где контекст так же важен, как само прослушивание.",
      ivan_ev_chamber: "Мягкий поворот после рэп-секции. Хороший пример расширения вкуса.",
      ivan_ev_lvbag: "Идеальный момент для уведомления: короткий комментарий и мгновенный переход к треку.",
      ivan_ev_fein: "Даже массовый трек может быть полезной опорной точкой в графе вкуса.",
      maya_ev_nissan: "В треке достаточно энергии для позднего сета, но он не звучит очевидно.",
      maya_ev_likehim: "Тихое сохранение: не отдельный плейлист, а естественный Taste-сигнал.",
    } as Record<string, string>,
    times: {
      ivan_ev_euphoria: "4 мин назад",
      ivan_ev_chamber: "28 мин назад",
      ivan_ev_lvbag: "1 ч назад",
      ivan_ev_fein: "вчера",
      maya_ev_nissan: "7 мин назад",
      maya_ev_likehim: "52 мин назад",
    } as Record<string, string>,
  } : null;
  const demoWeeklyHistory = useMemo(() => demoProfile.events.map((event, index) => ({
    eventId: event.id,
    track: event.track,
    playCount: Math.max(2, 8 - index * 2),
    popularity: [82, 84, 72, 91, 75, 88][index] || 70,
    lastPlayedAt: demoRu?.times[event.id] || event.listenedAt,
  })).sort((a, b) => b.playCount - a.playCount || b.popularity - a.popularity), [demoProfile.events, demoRu]);

  async function toggleFollow() {
    if (serverProfile) {
      if (serverProfile.isOwner) return;
      if (!connected) {
        window.location.href = `/api/auth/spotify/start?returnTo=/taste/${encodeURIComponent(handle)}`;
        return;
      }
      const response = await fetch(`/api/follows/${encodeURIComponent(handle)}`, { method: "POST" });
      if (!response.ok) {
        showToast(t("profile.loginToFollow"));
        return;
      }
      const payload = await response.json() as { following: boolean };
      setFollowing(payload.following);
      showToast(payload.following
        ? (locale === "ru" ? `Вы подписались на Taste ${profileName}` : `Following ${profileName}'s Taste`)
        : (locale === "ru" ? `Вы отписались от Taste ${profileName}` : `Unfollowed ${profileName}'s Taste`));
      await load();
      return;
    }

    const current = readFollowingProfiles();
    const nextFollowing = !following;
    writeFollowingProfiles(nextFollowing ? Array.from(new Set([...current, profileHandle])) : current.filter(item => item !== profileHandle));
    setFollowing(nextFollowing);
    if (nextFollowing) pushNotification({ title: `Following ${profileName}`, body: "New demo listens will appear in this browser's Taste inbox.", href: `/taste/${profileHandle}` });
  }

  async function addComment() {
    const body = commentText.trim();
    if (!body || body.length < 2) return;
    if (serverProfile && selectedServerEvent) {
      if (!connected) {
        window.location.href = `/api/auth/spotify/start?returnTo=/taste/${encodeURIComponent(handle)}`;
        return;
      }
      setSubmitting(true);
      const response = await fetch(`/api/events/${selectedServerEvent.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      setSubmitting(false);
      if (!response.ok) {
        showToast(t("profile.loginToComment"));
        return;
      }
      setCommentText("");
      showToast(locale === "ru" ? "Комментарий опубликован." : "Comment posted.");
      await load();
      return;
    }
    if (!selectedDemoEvent) return;
    const nextComment: LocalComment = { id: crypto.randomUUID(), eventId: selectedDemoEvent.id, profileHandle, author: locale === "ru" ? "Вы" : "You", text: body, createdAt: new Date().toISOString() };
    const next = [nextComment, ...localComments].slice(0, 60);
    setLocalComments(next);
    writeJson(SOCIAL_COMMENTS_KEY, next);
    setCommentText("");
  }

  if (state === "loading") return <main className="page"><section className="panel profileLoading"><div className="skeleton profileSkeletonAvatar" /><div className="rowGrow"><div className="skeleton" style={{ width: 260, height: 28 }} /><div className="skeleton" style={{ width: "60%", height: 16, marginTop: 14 }} /></div></section></main>;
  if (state !== "ready") return <main className="page pageNarrow"><section className="emptyState standaloneState"><Icon name="privacy" size={30} /><h1>{state === "private" ? t("profile.private") : t("profile.notFound")}</h1><Link className="btn btnPrimary" href="/feed">{t("nav.feed")}</Link></section></main>;

  const avatarUrl = isReal ? serverProfile?.avatarUrl : demoProfile.avatarUrl;
  const avatarFallbackUrl = isReal ? undefined : demoProfile.fallbackAvatarUrl;
  const useLocalizedSeedCopy = !isReal && demoProfile.source === "seeded";
  const role = isReal ? serverProfile?.role : (useLocalizedSeedCopy ? demoRu?.role : demoProfile.role) || demoProfile.role;
  const bio = isReal ? serverProfile?.bio : (useLocalizedSeedCopy ? demoRu?.bio : demoProfile.bio) || demoProfile.bio;
  const verified = isReal ? Boolean(serverProfile?.verified) : demoProfile.verified;
  const publicCount = isReal ? weeklyHistory.length : demoWeeklyHistory.length;
  const comments = isReal
    ? (selectedServerEvent?.comments || [])
    : localComments.filter(comment => comment.profileHandle === profileHandle && comment.eventId === selectedDemoEvent?.id);
  const profileQueue: TasteQueueItem[] = (isReal ? weeklyHistory : demoWeeklyHistory).map(item => {
    const realItem = isReal ? item as ServerWeeklyTrack : null;
    const demoItem = !isReal ? item as typeof demoWeeklyHistory[number] : null;
    const rawTrack = realItem?.track || demoItem!.track;
    const spotifyId = realItem ? rawTrack.id : rawTrack.id.replace(/^spotify_track_/, "");
    const track: TrackRef = {
      id: realItem ? `spotify_track_${rawTrack.id}` : rawTrack.id,
      slug: spotifyId,
      spotifyId,
      spotifyUri: `spotify:track:${spotifyId}`,
      spotifyUrl: rawTrack.spotifyUrl,
      spotifyEmbedUrl: rawTrack.spotifyEmbedUrl,
      title: rawTrack.title,
      artist: rawTrack.artist,
      coverUrl: rawTrack.coverUrl || "",
      fallbackCoverUrl: "fallbackCoverUrl" in rawTrack ? rawTrack.fallbackCoverUrl : undefined,
      origin: "spotify",
    };
    const event = !isReal ? demoProfile.events.find(value => value.id === demoItem!.eventId) : null;
    return {
      id: `profile_queue_${realItem?.eventId || demoItem!.eventId}`,
      track,
      tastemaker: { id: profileHandle, name: profileName, avatarUrl: avatarUrl || "", fallbackAvatarUrl: avatarFallbackUrl },
      signal: locale === "ru" ? `${realItem?.playCount ?? demoItem!.playCount} повторов за неделю` : `${realItem?.playCount ?? demoItem!.playCount} plays this week`,
      authorNote: isReal ? serverEvents.find(value => value.id === realItem?.eventId)?.authorNote : event?.authorComment,
    };
  });

  return (
    <main className="spxPublicPage">
      <section className="spxPublicHero">
        <span className="spxPublicAvatar"><AvatarImage src={avatarUrl || ""} fallbackSrc={avatarFallbackUrl} alt={`${profileName} avatar`} /></span>
        <div className="spxPublicIdentity"><small>{isReal ? t("profile.live") : t("profile.demo")}</small><h1>{profileName}{verified ? <i className="spxVerified"><Icon name="check" size={10} /></i> : null}</h1><p>@{profileHandle} · {role}</p><em>{bio}</em><div>{serverProfile?.isOwner ? <Link className="spxFollowButton" href="/my-taste">{t("profile.own")}</Link> : <button className={`spxFollowButton ${following ? "active" : ""}`} type="button" onClick={toggleFollow}>{following ? t("profile.following") : t("profile.follow")}</button>}<TasteQueuePlayer items={profileQueue} triggerLabel={locale === "ru" ? "Слушать Taste" : "Play Taste"} triggerAriaLabel={locale === "ru" ? `Слушать Taste ${profileName}` : `Play ${profileName}'s Taste`} triggerClassName="spxTastePlay" iconOnly /><Link className="spxPublicBell" href="/notifications" aria-label={t("profile.inbox")}><Icon name="bell" /></Link></div></div>
        <div className="spxPublicStats"><div><strong>{serverProfile?.followers ?? demoProfile.tasteFollowers}</strong><span>{t("my.followers")}</span></div><div><strong>{isReal ? Math.round((serverProfile?.durationMs7d || 0) / 60_000) : demoProfile.influenceStreams}</strong><span>{isReal ? t("profile.weeklyMinutes") : (locale === "ru" ? "Открытия через Taste" : "Taste-sourced starts")}</span></div><div><strong>{isReal ? serverProfile?.uniqueTracks7d : demoProfile.discoverySaves}</strong><span>{isReal ? t("profile.uniqueTracks") : (locale === "ru" ? "Сохранения" : "Discovery saves")}</span></div></div>
      </section>

      <section className="spxPublicGrid">
        <div className="spxPublicHistory">
          <div className="spxSectionHeading"><h2>{locale === "ru" ? "История за 7 дней" : "Last 7 days"}</h2><span>{locale === "ru" ? `${publicCount} треков` : `${publicCount} tracks`}</span></div>
          <div className="spxPublicList">
            {(isReal ? weeklyHistory : demoWeeklyHistory).map(item => {
              const realItem = isReal ? item as ServerWeeklyTrack : null;
              const demoItem = !isReal ? item as typeof demoWeeklyHistory[number] : null;
              const demoEvent = !isReal ? demoProfile.events.find(event => event.id === demoItem!.eventId)! : null;
              const track = realItem?.track || demoItem!.track;
              const eventId = realItem?.eventId || demoItem!.eventId;
              const active = eventId === selectedId;
              return (
                <button className={active ? "active" : ""} type="button" key={eventId} onClick={() => setSelectedId(eventId)}>
                  <TrackArtwork src={track.coverUrl || ""} fallbackSrc={demoEvent?.track.fallbackCoverUrl} alt={`${track.title} cover`} className="spxPublicTrackCover" />
                  <span><strong>{track.title}</strong><small>{track.artist}</small><em>{realItem ? formatPlayedAt(realItem.lastPlayedAt, locale) : `${demoItem!.lastPlayedAt} · ${demoRu?.signals[demoEvent!.id] || demoEvent!.signal}`}</em></span>
                  <b>{realItem?.playCount ?? demoItem!.playCount}<small>{locale === "ru" ? russianRepeatLabel(realItem?.playCount ?? demoItem!.playCount) : "plays"}</small></b>
                  <Icon name="play" size={15} />
                </button>
              );
            })}
            {!publicCount ? <div className="spxFeedEmpty">{t("profile.empty")}</div> : null}
          </div>
        </div>

        {selectedTrack ? (
          <aside className="spxPublicPlayer">
            <div className="spxPublicPlayerHead"><div><small>{isReal ? t("common.spotifyData") : t("common.demoData")}</small><h2>{selectedTrack.title}</h2><p>{selectedTrack.artist}</p></div><a href={selectedTrack.spotifyUrl} target="_blank" rel="noreferrer" aria-label={t("common.openSpotify")}><Icon name="external" /></a></div>
            <SpotifyEmbed src={selectedTrack.spotifyEmbedUrl} title={`Spotify: ${selectedTrack.title}`} />
            <div className="spxPublicNote"><span><Icon name="comment" size={16} />{t("profile.authorNote")}</span><p>{selectedServerEvent?.authorNote || (selectedDemoEvent ? demoRu?.notes[selectedDemoEvent.id] || selectedDemoEvent.authorComment : null) || t("profile.noNote")}</p></div>
            <div className="spxPublicComposer"><label htmlFor="taste-comment">{t("profile.addComment")}</label><textarea id="taste-comment" value={commentText} onChange={event => setCommentText(event.target.value)} placeholder={t("profile.commentPlaceholder")} /><button type="button" onClick={addComment} disabled={submitting}>{t("profile.postComment")}</button>{isReal && !connected ? <p>{t("profile.loginToComment")}</p> : null}</div>
            <div className="spxPublicComments"><strong>{t("profile.thread")}</strong>
              {(selectedServerEvent?.authorNote || selectedDemoEvent?.authorComment) ? <div className="author"><strong>{profileName}</strong><span>{selectedServerEvent?.authorNote || (selectedDemoEvent ? demoRu?.notes[selectedDemoEvent.id] || selectedDemoEvent.authorComment : null)}</span></div> : null}
              {comments.map(comment => {
                const serverComment = comment as ServerComment;
                const localComment = comment as LocalComment;
                return <div key={comment.id}><strong>{isReal ? serverComment.author_name || serverComment.authorName : localComment.author}</strong><span>{isReal ? serverComment.body : localComment.text}</span></div>;
              })}
            </div>
          </aside>
        ) : null}
      </section>
      <p className="spxPublicDisclosure"><Icon name="info" size={13} />{isReal ? t("profile.source") : t("common.demoData")}</p>
    </main>
  );
}
