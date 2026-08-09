"use client";

import { useEffect, useState } from "react";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { useToast } from "@/components/ToastProvider";
import { useI18n } from "@/lib/i18n";

type PrivacyState = {
  share_enabled: boolean;
  share_delay_hours: number;
  selected_sessions_only: boolean;
  hidden_track_ids: string[];
  hidden_artist_ids: string[];
};

const defaults: PrivacyState = {
  share_enabled: true,
  share_delay_hours: 0,
  selected_sessions_only: false,
  hidden_track_ids: [],
  hidden_artist_ids: [],
};

export default function PrivacyPage() {
  const { locale, t } = useI18n();
  const { showToast } = useToast();
  const [privacy, setPrivacy] = useState(defaults);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hiddenTracks, setHiddenTracks] = useState("");
  const [hiddenArtists, setHiddenArtists] = useState("");

  useEffect(() => {
    fetch("/api/me/privacy", { cache: "no-store" }).then(async response => {
      if (!response.ok) return;
      const payload = await response.json() as { privacy: PrivacyState };
      setPrivacy(payload.privacy);
      setHiddenTracks((payload.privacy.hidden_track_ids || []).join(", "));
      setHiddenArtists((payload.privacy.hidden_artist_ids || []).join(", "));
      setConnected(true);
    }).finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!connected) return;
    setSaving(true);
    const response = await fetch("/api/me/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shareEnabled: privacy.share_enabled,
        shareDelayHours: privacy.share_delay_hours,
        selectedSessionsOnly: privacy.selected_sessions_only,
        hiddenTrackIds: hiddenTracks.split(",").map(value => value.trim()).filter(Boolean),
        hiddenArtistIds: hiddenArtists.split(",").map(value => value.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    if (response.ok) showToast(t("privacy.saved"));
    else showToast(locale === "ru" ? "Не удалось сохранить настройки." : "Could not save privacy controls.");
  }

  return (
    <main className="page pageNarrow">
      <div className="sectionHeader">
        <div><div className="eyebrow">{t("privacy.eyebrow")}</div><h1 className="pageTitle">{t("privacy.title")}</h1><p className="lead">{t("privacy.lead")}</p></div>
        <DemoBadge>{connected ? t("common.spotifyData") : (locale === "ru" ? "Система доверия" : "Trust guardrails")}</DemoBadge>
      </div>

      {!connected && !loading ? (
        <section className="panel section privacyConnect">
          <span className="privacyIcon"><Icon name="privacy" /></span>
          <div><h2>{t("privacy.connect")}</h2><p className="muted">{t("my.disconnectedBody")}</p></div>
          <a className="btn btnPrimary" href="/api/auth/spotify/start?returnTo=/privacy"><Icon name="user" />{t("my.connect")}</a>
        </section>
      ) : null}

      <section className={`privacyGrid section ${loading ? "isLoading" : ""}`} aria-label="Taste privacy controls">
        <article className="privacyRow">
          <span className="privacyIcon"><Icon name="taste" /></span>
          <div><strong>{t("privacy.sharing")}</strong><p className="finePrint">{t("privacy.sharingDesc")}</p></div>
          <button className={`switch ${privacy.share_enabled ? "on" : ""}`} type="button" role="switch" aria-checked={privacy.share_enabled} onClick={() => setPrivacy(current => ({ ...current, share_enabled: !current.share_enabled }))} disabled={!connected}><span /></button>
        </article>

        <article className="privacyRow privacyRowSelect">
          <span className="privacyIcon"><Icon name="clock" /></span>
          <div><strong>{t("privacy.delay")}</strong><p className="finePrint">{t("privacy.delayDesc")}</p></div>
          <select value={privacy.share_delay_hours} onChange={event => setPrivacy(current => ({ ...current, share_delay_hours: Number(event.target.value) }))} disabled={!connected} aria-label={t("privacy.delay")}>
            <option value={0}>{t("privacy.immediate")}</option>
            <option value={24}>{t("privacy.24h")}</option>
          </select>
        </article>

        <article className="privacyRow">
          <span className="privacyIcon"><Icon name="external" /></span>
          <div><strong>{t("privacy.selected")}</strong><p className="finePrint">{t("privacy.selectedDesc")}</p></div>
          <button className={`switch ${privacy.selected_sessions_only ? "on" : ""}`} type="button" role="switch" aria-checked={privacy.selected_sessions_only} onClick={() => setPrivacy(current => ({ ...current, selected_sessions_only: !current.selected_sessions_only }))} disabled={!connected}><span /></button>
        </article>

        <article className="privacyRow privacyTextControl">
          <span className="privacyIcon"><Icon name="hide" /></span>
          <div><strong>{t("privacy.hiddenTracks")}</strong><p className="finePrint">{t("privacy.hiddenDesc")}</p></div>
          <input value={hiddenTracks} onChange={event => setHiddenTracks(event.target.value)} placeholder="4VQNCzfZ3MdHEwwErNXpBo" disabled={!connected} />
        </article>

        <article className="privacyRow privacyTextControl">
          <span className="privacyIcon"><Icon name="hide" /></span>
          <div><strong>{t("privacy.hiddenArtists")}</strong><p className="finePrint">{t("privacy.hiddenDesc")}</p></div>
          <input value={hiddenArtists} onChange={event => setHiddenArtists(event.target.value)} placeholder="0Y5tJX1MQlPlqiwlOH1tJY" disabled={!connected} />
        </article>
      </section>

      {connected ? <div className="privacySaveBar"><button className="btn btnPrimary" type="button" onClick={save} disabled={saving}><Icon name="check" />{t("privacy.save")}</button></div> : null}

      <section className="panel section">
        <div className="sectionHeader"><h2>{t("privacy.disclosure")}</h2><DemoBadge>{locale === "ru" ? "Обязательное правило" : "Required trust rule"}</DemoBadge></div>
        <div className="whyList">
          <div className="whyItem"><span className="whyIcon"><Icon name="info" /></span><span>{t("privacy.sponsor")}</span></div>
          <div className="whyItem"><span className="whyIcon"><Icon name="privacy" /></span><span>{t("privacy.optin")}</span></div>
          <div className="whyItem"><span className="whyIcon"><Icon name="hide" /></span><span>{t("privacy.control")}</span></div>
        </div>
      </section>
    </main>
  );
}
