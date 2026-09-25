"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { ToastProvider } from "@/components/ToastProvider";
import { TastePlaybackProvider } from "@/components/TasteQueuePlayer";
import { useI18n } from "@/lib/i18n";

const primaryItems = [
  { href: "/", labelKey: "nav.home", icon: "home" },
  { href: "/search", labelKey: "nav.search", icon: "search" },
  { href: "/my-taste", labelKey: "nav.my", icon: "library" },
] as const;

const tasteItems = [
  { href: "/feed", labelKey: "nav.feed", icon: "feed" },
  { href: "/tastemaker/travis-scott", labelKey: "nav.tastemaker", icon: "taste" },
  { href: "/hub", labelKey: "nav.hub", icon: "hub" },
] as const;

const mobileItems = [
  { href: "/", labelKey: "nav.home", icon: "home", en: "Home", ru: "Главная" },
  { href: "/search", labelKey: "nav.search", icon: "search", en: "Search", ru: "Поиск" },
  { href: "/feed", labelKey: "nav.feed", icon: "feed", en: "Feed", ru: "Лента" },
  { href: "/notifications", labelKey: "nav.inbox", icon: "bell", en: "Inbox", ru: "Входящие" },
  { href: "/my-taste", labelKey: "nav.my", icon: "library", en: "Your Taste", ru: "Мой Taste" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  useEffect(() => setMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  if (pathname === "/pitch" || pathname === "/demo") return <ToastProvider>{children}</ToastProvider>;

  return (
    <ToastProvider>
      <TastePlaybackProvider>
      <div className={`appShell spxShell ${immersivePlayer ? "spxShellPlayer" : ""}`}>
        <aside className="sidebar spxSidebar" aria-label={locale === "ru" ? "Основная навигация" : "Primary navigation"}>
          <Link href="/feed" className="brandMark spxBrand" aria-label="Spotify Taste">
            <span className="spxSpotifyMark" aria-hidden="true"><i /><i /><i /></span>
            <span><strong>Spotify</strong><small>Taste concept</small></span>
          </Link>
          <nav className="desktopNav spxPrimaryNav">
            {primaryItems.map((item, index) => (
              <Link key={`${item.href}-${index}`} href={item.href} className={isActive(pathname, item.href) ? "active" : ""}>
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
          <div className="spxPresentationNav">
            <span className="spxPresentationLabel">{locale === "ru" ? "Презентация" : "Presentation"}</span>
            <Link href="/pitch" title={locale === "ru" ? "Открыть питч" : "Open product pitch"}>
              <Icon name="info" size={19} />
              <span>{locale === "ru" ? "Питч продукта" : "Product pitch"}</span>
            </Link>
            <Link href="/demo" title={locale === "ru" ? "Смотреть демо-видео" : "Watch demo video"}>
              <Icon name="player" size={19} />
              <span>{locale === "ru" ? "Демо · 41 секунда" : "Demo · 41 seconds"}</span>
            </Link>
          </div>
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
        {!immersivePlayer ? (
          <button
            className="spxMobileMoreButton"
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="spx-mobile-menu"
            aria-label={mobileMenuOpen ? (locale === "ru" ? "Закрыть меню" : "Close menu") : (locale === "ru" ? "Открыть меню" : "Open menu")}
            onClick={() => setMobileMenuOpen(current => !current)}
          >
            <Icon name={mobileMenuOpen ? "close" : "more"} size={20} />
          </button>
        ) : null}
        {!immersivePlayer && mobileMenuOpen ? (
          <>
            <button className="spxMobileMenuBackdrop" type="button" onClick={() => setMobileMenuOpen(false)} aria-label={locale === "ru" ? "Закрыть меню" : "Close menu"} />
            <aside className="spxMobileMenuSheet" id="spx-mobile-menu" role="dialog" aria-modal="true" aria-labelledby="spx-mobile-menu-title">
              <header>
                <span><span className="spxSpotifyMark" aria-hidden="true"><i /><i /><i /></span><strong id="spx-mobile-menu-title">Spotify Taste</strong></span>
                <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label={locale === "ru" ? "Закрыть меню" : "Close menu"}><Icon name="close" /></button>
              </header>
              <nav aria-label={locale === "ru" ? "Дополнительная навигация" : "More navigation"}>
                <span>{locale === "ru" ? "Инструменты Taste" : "Taste tools"}</span>
                <Link href="/hub"><i><Icon name="hub" size={19} /></i><strong>{locale === "ru" ? "Кабинет автора" : "Tastemaker Hub"}</strong><Icon name="chevronRight" size={18} /></Link>
                <Link href="/privacy"><i><Icon name="privacy" size={19} /></i><strong>{locale === "ru" ? "Приватность и публикация" : "Privacy and sharing"}</strong><Icon name="chevronRight" size={18} /></Link>
                <Link href="/artist-onboarding"><i><Icon name="user" size={19} /></i><strong>{locale === "ru" ? "Подключение артиста" : "Artist activation"}</strong><Icon name="chevronRight" size={18} /></Link>
                <span>{locale === "ru" ? "О проекте" : "Project"}</span>
                <Link href="/pitch"><i><Icon name="info" size={19} /></i><strong>{locale === "ru" ? "Питч продукта" : "Product proposal"}</strong><Icon name="chevronRight" size={18} /></Link>
                <Link href="/demo"><i><Icon name="player" size={19} /></i><strong>{locale === "ru" ? "Демо-видео" : "Product video"}</strong><Icon name="chevronRight" size={18} /></Link>
              </nav>
              <div className="spxMobileMenuLanguage">
                <span>{locale === "ru" ? "Язык" : "Language"}</span>
                <div aria-label={locale === "ru" ? "Язык интерфейса" : "Interface language"}>
                  <button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")} aria-pressed={locale === "en"}>English</button>
                  <button type="button" className={locale === "ru" ? "active" : ""} onClick={() => setLocale("ru")} aria-pressed={locale === "ru"}>Русский</button>
                </div>
              </div>
            </aside>
          </>
        ) : null}
        {!immersivePlayer ? (
          <nav className="mobileNav spxMobileNav" aria-label={locale === "ru" ? "Мобильная навигация" : "Mobile navigation"}>
            {mobileItems.map((item, index) => (
              <Link key={`${item.href}-${index}`} href={item.href} className={isActive(pathname, item.href) ? "active" : ""}>
                <Icon name={item.icon} size={22} />
                <span>{locale === "ru" ? item.ru : item.en}</span>
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
      </TastePlaybackProvider>
    </ToastProvider>
  );
}
