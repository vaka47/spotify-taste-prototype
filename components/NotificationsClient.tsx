"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { markNotificationsRead, readNotifications, seededNotifications, type TasteNotification } from "@/lib/social-taste";

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<TasteNotification[]>(seededNotifications);

  useEffect(() => {
    function refresh() {
      setNotifications(readNotifications());
    }
    refresh();
    window.addEventListener("spotify_taste.notifications_updated", refresh);
    return () => window.removeEventListener("spotify_taste.notifications_updated", refresh);
  }, []);

  function markRead() {
    markNotificationsRead();
    setNotifications(readNotifications());
  }

  const unread = notifications.filter(notification => !notification.read).length;

  return (
    <main className="page pageNarrow">
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">Taste inbox</div>
          <h1 className="pageTitle">Comments and listening updates from people you follow.</h1>
          <p className="lead">This is the notification layer for opt-in public listening, author notes and follower comments.</p>
        </div>
        <DemoBadge>{unread} unread</DemoBadge>
      </div>

      <div className="buttonRow">
        <button className="btn btnPrimary" type="button" onClick={markRead}>
          <Icon name="check" />
          Mark all read
        </button>
        <Link className="btn btnSubtle" href="/taste/ivan">
          <Icon name="taste" />
          Open Ivan
        </Link>
        <Link className="btn btnSubtle" href="/taste/maya">
          <Icon name="spark" />
          Open Maya
        </Link>
      </div>

      <section className="notificationList section">
        {notifications.map(notification => (
          <Link className={`notificationCard ${notification.read ? "" : "unread"}`} href={notification.href} key={notification.id}>
            <span className="notificationIcon">
              <Icon name={notification.read ? "check" : "feed"} />
            </span>
            <span>
              <strong>{notification.title}</strong>
              <span>{notification.body}</span>
              <em>{notification.createdAt}</em>
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
