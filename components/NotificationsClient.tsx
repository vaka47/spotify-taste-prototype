"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { useI18n } from "@/lib/i18n";
import { markNotificationsRead, readNotifications, type TasteNotification } from "@/lib/social-taste";

type ServerNotification = {
  id: string;
  kind: string;
  body: string;
  event_id: string | null;
  read_at: string | null;
  created_at: string;
  actor_handle: string | null;
  actor_name: string | null;
  event_owner_handle: string | null;
};

function timeLabel(value: string, locale: "en" | "ru") {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return locale === "ru" ? "только что" : "just now";
  if (minutes < 60) return locale === "ru" ? `${minutes} мин назад` : `${minutes} min ago`;
  if (minutes < 1440) return locale === "ru" ? `${Math.round(minutes / 60)} ч назад` : `${Math.round(minutes / 60)}h ago`;
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short" }).format(new Date(value));
}

export function NotificationsClient() {
  const { locale, t } = useI18n();
  const [serverNotifications, setServerNotifications] = useState<ServerNotification[] | null>(null);
  const [localNotifications, setLocalNotifications] = useState<TasteNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (response.ok) {
      const payload = await response.json() as { notifications: ServerNotification[] };
      setServerNotifications(payload.notifications);
      setConnected(true);
    } else {
      setServerNotifications(null);
      setConnected(false);
      setLocalNotifications(readNotifications());
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function markRead() {
    if (connected) await fetch("/api/notifications", { method: "PATCH" });
    else markNotificationsRead();
    await load();
  }

  const unread = connected
    ? (serverNotifications || []).filter(notification => !notification.read_at).length
    : localNotifications.filter(notification => !notification.read).length;

  return (
    <main className="page pageNarrow nativeNotificationsPage">
      <div className="nativeSectionHeader">
        <div><h1 className="pageTitle">{t("nav.inbox")}</h1><p>{connected ? t("inbox.lead") : (locale === "ru" ? "До подключения здесь показаны примеры уведомлений. После входа появятся события от ваших подписок." : "Demo examples are shown until you connect. After sign-in, notifications will come from people you follow.")}</p></div>
        <DemoBadge>{t("inbox.unread", { count: unread })}</DemoBadge>
      </div>

      <div className="nativeNotificationActions">
        <button className="nativeOutlineButton" type="button" onClick={markRead} disabled={!unread}><Icon name="check" size={16} />{t("inbox.mark")}</button>
        {!connected ? <a className="nativeTextLink" href="/api/auth/spotify/start?returnTo=/notifications">{t("my.connect")}</a> : null}
      </div>

      <section className="notificationList section">
        {loading ? Array.from({ length: 4 }).map((_, index) => <div className="notificationCard" key={index}><span className="notificationIcon skeleton" /><span className="rowGrow"><span className="skeleton" style={{ height: 16, width: "42%" }} /><span className="skeleton" style={{ height: 13, width: "76%", marginTop: 8 }} /></span></div>) : null}
        {!loading && connected ? (serverNotifications || []).map(notification => {
          const href = notification.event_owner_handle ? `/taste/${notification.event_owner_handle}` : notification.actor_handle ? `/taste/${notification.actor_handle}` : "/my-taste";
          return (
            <Link className={`notificationCard ${notification.read_at ? "" : "unread"}`} href={href} key={notification.id}>
              <span className="notificationIcon"><Icon name={notification.read_at ? "check" : "feed"} /></span>
              <span><strong>{notification.actor_name || "Taste"}</strong><span>{notification.body}</span><em>{timeLabel(notification.created_at, locale)}</em></span>
            </Link>
          );
        }) : null}
        {!loading && !connected ? localNotifications.map(notification => (
          <Link className={`notificationCard ${notification.read ? "" : "unread"}`} href={notification.href} key={notification.id}>
            <span className="notificationIcon"><Icon name={notification.read ? "check" : "feed"} /></span>
            <span>
              <strong>{locale === "ru" ? ({ seed_note_1: "Иван добавил комментарий", seed_note_2: "Майя слушает на повторе", seed_note_3: "Новое квалифицированное открытие" } as Record<string, string>)[notification.id] || notification.title : notification.title}</strong>
              <span>{locale === "ru" ? ({ seed_note_1: "Короткий комментарий автора и мгновенный переход к треку.", seed_note_2: "NISSAN ALTIMA быстро набирает повторные прослушивания среди её Taste-подписчиков.", seed_note_3: "Ваш граф подписок создал 7 новых сохранений из Taste в этом браузере." } as Record<string, string>)[notification.id] || notification.body : notification.body}</span>
              <em>{locale === "ru" ? notification.createdAt.replace("min ago", "мин назад").replace("Today", "Сегодня") : notification.createdAt}</em>
            </span>
          </Link>
        )) : null}
        {!loading && ((connected && !serverNotifications?.length) || (!connected && !localNotifications.length)) ? <div className="emptyState">{connected ? t("inbox.empty") : t("inbox.connect")}</div> : null}
      </section>
    </main>
  );
}
