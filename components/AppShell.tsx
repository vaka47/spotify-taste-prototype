"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icons";
import { ToastProvider } from "@/components/ToastProvider";
import { useI18n } from "@/lib/i18n";

const navItems = [
  { href: "/", labelKey: "nav.home", mobileKey: "nav.home", icon: "home" },
  { href: "/feed", labelKey: "nav.feed", mobileKey: "nav.feed", icon: "feed" },
  { href: "/tastemaker/travis-scott", labelKey: "nav.tastemaker", mobileKey: "nav.tastemaker", icon: "taste" },
  { href: "/my-taste", labelKey: "nav.my", mobileKey: "nav.my", icon: "library" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const current = navItems.find(item => isActive(pathname, item.href)) ?? navItems[0];
  const currentLabelKey = pathname.startsWith("/player/") ? "nav.player"
    : pathname.startsWith("/taste/") ? "nav.public"
    : pathname.startsWith("/notifications") ? "nav.inbox"
    : pathname.startsWith("/privacy") ? "nav.privacy"
    : pathname.startsWith("/hub") ? "nav.hub"
    : current.labelKey;

  return (
    <ToastProvider>
      <div className="appShell">
        <aside className="sidebar" aria-label="Primary navigation">
          <Link href="/" className="brandMark" aria-label="Spotify Taste overview">
            <span className="brandDisc" aria-hidden="true" />
            <span>
              <strong>Taste</strong>
              <small>{t("shell.concept")}</small>
            </span>
          </Link>
          <nav className="desktopNav">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className={isActive(pathname, item.href) ? "active" : ""}>
                <Icon name={item.icon} />
                <span>{t(item.labelKey)}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebarSectionLabel">{locale === "ru" ? "Ваши разделы" : "Your Spotify"}</div>
          <nav className="desktopNav secondaryNav">
            <Link href="/notifications" className={isActive(pathname, "/notifications") ? "active" : ""}>
              <Icon name="bell" />
              <span>{t("nav.inbox")}</span>
            </Link>
            <Link href="/privacy" className={isActive(pathname, "/privacy") ? "active" : ""}>
              <Icon name="privacy" />
              <span>{t("nav.privacy")}</span>
            </Link>
          </nav>
          <div className="sidebarFooter">
            <p>{t("shell.independent")}</p>
          </div>
        </aside>
        <div className="mainColumn">
          <header className="topBar">
            <div className="historyControls" aria-label={locale === "ru" ? "Навигация" : "Navigation"}>
              <button type="button" className="topIconButton" aria-label={locale === "ru" ? "Назад" : "Back"} onClick={() => window.history.back()}><Icon name="chevronLeft" /></button>
              <button type="button" className="topIconButton" aria-label={locale === "ru" ? "Вперёд" : "Forward"} onClick={() => window.history.forward()}><Icon name="chevronRight" /></button>
              <strong className="topRouteTitle">{t(currentLabelKey)}</strong>
            </div>
            <div className="topActions">
              <div className="languageSwitch" aria-label="Language">
                <button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
                <button type="button" className={locale === "ru" ? "active" : ""} onClick={() => setLocale("ru")} aria-pressed={locale === "ru"}>RU</button>
              </div>
              <Link className="topIconButton" href="/notifications" aria-label={t("nav.inbox")}><Icon name="bell" /></Link>
              <Link className="accountButton" href="/my-taste"><Icon name="user" size={17} />{t("nav.my")}</Link>
            </div>
          </header>
          {children}
          <footer className="footerNote">
            {t("shell.disclaimer")}
          </footer>
        </div>
        <nav className="mobileNav" aria-label="Mobile navigation">
          {navItems.filter(item => ["/", "/feed", "/my-taste"].includes(item.href)).map(item => (
            <Link key={item.href} href={item.href} className={isActive(pathname, item.href) ? "active" : ""}>
              <Icon name={item.icon} size={21} />
              <span>{t(item.mobileKey)}</span>
            </Link>
          ))}
        </nav>
      </div>
    </ToastProvider>
  );
}
