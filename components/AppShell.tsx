"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icons";
import { ToastProvider } from "@/components/ToastProvider";
import { useI18n } from "@/lib/i18n";

const primaryItems = [
  { href: "/", labelKey: "nav.home", icon: "home" },
  { href: "/feed#people-search", labelKey: "nav.search", icon: "search" },
  { href: "/my-taste", labelKey: "nav.my", icon: "library" },
] as const;

const tasteItems = [
  { href: "/feed", labelKey: "nav.feed", icon: "feed" },
  { href: "/tastemaker/travis-scott", labelKey: "nav.tastemaker", icon: "taste" },
  { href: "/hub", labelKey: "nav.hub", icon: "hub" },
] as const;

const mobileItems = [
  { href: "/feed", labelKey: "nav.home", icon: "home" },
  { href: "/feed#people-search", labelKey: "nav.search", icon: "search" },
  { href: "/my-taste", labelKey: "nav.my", icon: "library" },
] as const;

function isActive(pathname: string, href: string) {
  const cleanHref = href.split("#")[0];
  if (cleanHref === "/") return pathname === "/";
  if (cleanHref === "/feed") return pathname === "/feed";
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const current = [...primaryItems, ...tasteItems].find(item => isActive(pathname, item.href)) ?? primaryItems[0];
  const currentLabelKey = pathname.startsWith("/player/") ? "nav.player"
    : pathname.startsWith("/taste/") ? "nav.public"
    : pathname.startsWith("/notifications") ? "nav.inbox"
    : pathname.startsWith("/privacy") ? "nav.privacy"
    : pathname.startsWith("/artist-onboarding") ? "nav.onboarding"
    : pathname.startsWith("/hub") ? "nav.hub"
    : pathname === "/feed" ? "nav.feed"
    : current.labelKey;
  const immersivePlayer = pathname.startsWith("/player/");

  if (pathname === "/pitch") return <ToastProvider>{children}</ToastProvider>;

  return (
    <ToastProvider>
      <div className={`appShell spxShell ${immersivePlayer ? "spxShellPlayer" : ""}`}>
        <aside className="sidebar spxSidebar" aria-label={locale === "ru" ? "Основная навигация" : "Primary navigation"}>
          <Link href="/feed" className="brandMark spxBrand" aria-label="Spotify Taste">
            <span className="spxSpotifyMark" aria-hidden="true"><i /><i /><i /></span>
            <span><strong>Spotify</strong><small>Taste concept</small></span>
          </Link>
          <nav className="desktopNav spxPrimaryNav">
            {primaryItems.map((item, index) => (
              <Link key={`${item.href}-${index}`} href={item.href} className={index !== 1 && isActive(pathname, item.href) ? "active" : ""}>
                <Icon name={item.icon} />
                <span>{t(item.labelKey)}</span>
              </Link>
            ))}
          </nav>
          <div className="spxLibraryHead"><Icon name="library" size={20} /><strong>{locale === "ru" ? "Моя медиатека" : "Your Library"}</strong></div>
          <nav className="desktopNav spxTasteNav">
            {tasteItems.map(item => (
              <Link key={item.href} href={item.href} className={isActive(pathname, item.href) ? "active" : ""}>
                <span className="spxNavTile"><Icon name={item.icon} size={18} /></span>
                <span>{t(item.labelKey)}</span>
              </Link>
            ))}
            <Link href="/notifications" className={isActive(pathname, "/notifications") ? "active" : ""}>
              <span className="spxNavTile"><Icon name="bell" size={18} /></span><span>{t("nav.inbox")}</span>
            </Link>
            <Link href="/privacy" className={isActive(pathname, "/privacy") ? "active" : ""}>
              <span className="spxNavTile"><Icon name="privacy" size={18} /></span><span>{t("nav.privacy")}</span>
            </Link>
          </nav>
        </aside>
        <div className="mainColumn spxMainColumn">
          <header className="topBar spxTopBar">
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
          <footer className="footerNote spxFooter">{t("shell.disclaimer")}</footer>
        </div>
        {!immersivePlayer ? <button className="spxMobileLanguage" type="button" onClick={() => setLocale(locale === "en" ? "ru" : "en")} aria-label={locale === "en" ? "Switch to Russian" : "Переключить на английский"}>{locale === "en" ? "RU" : "EN"}</button> : null}
        {!immersivePlayer ? (
          <nav className="mobileNav spxMobileNav" aria-label={locale === "ru" ? "Мобильная навигация" : "Mobile navigation"}>
            {mobileItems.map((item, index) => (
              <Link key={`${item.href}-${index}`} href={item.href} className={index !== 1 && isActive(pathname, item.href) ? "active" : ""}>
                <Icon name={item.icon} size={22} />
                <span>{t(item.labelKey)}</span>
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </ToastProvider>
  );
}
