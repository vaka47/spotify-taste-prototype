"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { useI18n } from "@/lib/i18n";

export type ConnectionProfile = {
  handle: string;
  name: string;
  avatarUrl: string | null;
  fallbackAvatarUrl?: string;
  role: string;
  verified?: boolean;
  href?: string;
};

export function ConnectionsDialog({
  open,
  onClose,
  handle,
  initialType,
  demoProfiles,
  singleType = false,
}: {
  open: boolean;
  onClose: () => void;
  handle?: string;
  initialType: "followers" | "following";
  demoProfiles?: ConnectionProfile[];
  singleType?: boolean;
}) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const [type, setType] = useState(initialType);
  const [profiles, setProfiles] = useState<ConnectionProfile[]>(demoProfiles || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) setType(initialType); }, [initialType, open]);

  useEffect(() => {
    if (open && !handle) setProfiles(demoProfiles || []);
  }, [demoProfiles, handle, open]);

  useEffect(() => {
    if (!open || !handle) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/profiles/${encodeURIComponent(handle)}/connections?type=${type}`, { cache: "no-store", signal: controller.signal })
      .then(async response => response.ok ? response.json() as Promise<{ profiles: ConnectionProfile[] }> : { profiles: [] })
      .then(payload => setProfiles(payload.profiles))
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [handle, open, type]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="spxConnectionsBackdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="spxConnectionsDialog" role="dialog" aria-modal="true" aria-labelledby="connections-title">
        <header>
          <h2 id="connections-title">{singleType ? (ru ? "Подписчики Taste" : "Taste followers") : (ru ? "Связи Taste" : "Taste connections")}</h2>
          <button type="button" onClick={onClose} aria-label={ru ? "Закрыть" : "Close"}><Icon name="close" size={20} /></button>
        </header>
        {!singleType ? <div className="spxConnectionsTabs">
          <button type="button" className={type === "followers" ? "active" : ""} onClick={() => setType("followers")}>{ru ? "Подписчики" : "Followers"}</button>
          <button type="button" className={type === "following" ? "active" : ""} onClick={() => setType("following")}>{ru ? "Подписки" : "Following"}</button>
        </div> : null}
        <div className="spxConnectionsList">
          {loading ? <p className="spxConnectionsStatus">{ru ? "Загружаем…" : "Loading…"}</p> : null}
          {!loading && profiles.map(profile => (
            <Link href={profile.href || `/taste/${profile.handle}`} onClick={onClose} key={profile.handle}>
              <span><AvatarImage src={profile.avatarUrl || ""} fallbackSrc={profile.fallbackAvatarUrl} alt={profile.name} /></span>
              <span><strong>{profile.name}{profile.verified ? <i className="spxVerified"><Icon name="check" size={9} /></i> : null}</strong><small>@{profile.handle} · {ru && profile.role === "Spotify listener" ? "слушатель Spotify" : profile.role}</small></span>
              <Icon name="chevronRight" size={18} />
            </Link>
          ))}
          {!loading && !profiles.length ? <p className="spxConnectionsStatus">{type === "followers" ? (ru ? "Подписчиков пока нет" : "No followers yet") : (ru ? "Подписок пока нет" : "Not following anyone yet")}</p> : null}
        </div>
      </section>
    </div>
  );
}
