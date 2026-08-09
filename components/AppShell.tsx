"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icons";
import { ToastProvider } from "@/components/ToastProvider";
import { useI18n } from "@/lib/i18n";

const navItems = [
  { href: "/", labelKey: "nav.overview", mobileKey: "nav.home", icon: "home" },
  { href: "/feed", labelKey: "nav.feed", mobileKey: "nav.feed", icon: "feed" },
  { href: "/taste/ivan", labelKey: "nav.public", mobileKey: "nav.public", icon: "spark" },
  { href: "/tastemaker/travis-scott", labelKey: "nav.tastemaker", mobileKey: "nav.tastemaker", icon: "taste" },
  { href: "/player/euphoria", labelKey: "nav.player", mobileKey: "nav.player", icon: "player" },
  { href: "/hub", labelKey: "nav.hub", mobileKey: "nav.hub", icon: "hub" },
  { href: "/notifications", labelKey: "nav.inbox", mobileKey: "nav.inbox", icon: "info" },
  { href: "/my-taste", labelKey: "nav.my", mobileKey: "nav.my", icon: "user" },
  { href: "/privacy", labelKey: "nav.privacy", mobileKey: "nav.privacy", icon: "privacy" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const current = navItems.find(item => isActive(pathname, item.href)) ?? navItems[0];

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
          <div className="sidebarFooter">
            <p>{t("shell.independent")}</p>
          </div>
        </aside>
        <div className="mainColumn">
          <header className="topBar">
            <div>
              <span className="topContext">Spotify Taste</span>
              <strong>{t(current.labelKey)}</strong>
            </div>
            <div className="topActions">
              <div className="languageSwitch" aria-label="Language">
                <button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
                <button type="button" className={locale === "ru" ? "active" : ""} onClick={() => setLocale("ru")} aria-pressed={locale === "ru"}>RU</button>
              </div>
              <div className="modePill">
                <span />
                {t("shell.prototype")}
              </div>
            </div>
          </header>
          {children}
          <footer className="footerNote">
            {t("shell.disclaimer")}
          </footer>
        </div>
        <nav className="mobileNav" aria-label="Mobile navigation">
          {navItems.filter(item => ["/", "/feed", "/taste/ivan", "/hub", "/my-taste"].includes(item.href)).map(item => (
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
