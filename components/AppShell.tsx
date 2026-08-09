"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icons";
import { ToastProvider } from "@/components/ToastProvider";

const navItems = [
  { href: "/", label: "Overview", mobileLabel: "Home", icon: "home" },
  { href: "/feed", label: "Taste Feed", mobileLabel: "Feed", icon: "feed" },
  { href: "/taste/ivan", label: "Public Taste", mobileLabel: "Public", icon: "spark" },
  { href: "/tastemaker/travis-scott", label: "Tastemaker", mobileLabel: "Taste", icon: "taste" },
  { href: "/player/euphoria", label: "Player", mobileLabel: "Player", icon: "player" },
  { href: "/hub", label: "Hub", mobileLabel: "Hub", icon: "hub" },
  { href: "/notifications", label: "Taste Inbox", mobileLabel: "Inbox", icon: "info" },
  { href: "/my-taste", label: "My Taste", mobileLabel: "My", icon: "user" },
  { href: "/privacy", label: "Privacy", mobileLabel: "Privacy", icon: "privacy" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = navItems.find(item => isActive(pathname, item.href)) ?? navItems[0];

  return (
    <ToastProvider>
      <div className="appShell">
        <aside className="sidebar" aria-label="Primary navigation">
          <Link href="/" className="brandMark" aria-label="Spotify Taste overview">
            <span className="brandDisc" aria-hidden="true" />
            <span>
              <strong>Taste</strong>
              <small>Product concept</small>
            </span>
          </Link>
          <nav className="desktopNav">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className={isActive(pathname, item.href) ? "active" : ""}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebarFooter">
            <p>Independent product concept. Not affiliated with, endorsed by, or sponsored by Spotify.</p>
          </div>
        </aside>
        <div className="mainColumn">
          <header className="topBar">
            <div>
              <span className="topContext">Spotify Taste</span>
              <strong>{current.label}</strong>
            </div>
            <div className="modePill">
              <span />
              Prototype mode
            </div>
          </header>
          {children}
          <footer className="footerNote">
            Independent product concept for Spotify social discovery. All public celebrity activity, Influence Streams,
            Discovery Saves and earnings are illustrative unless explicitly marked as authorized Spotify data.
          </footer>
        </div>
        <nav className="mobileNav" aria-label="Mobile navigation">
          {navItems.filter(item => ["/", "/feed", "/taste/ivan", "/hub", "/my-taste"].includes(item.href)).map(item => (
            <Link key={item.href} href={item.href} className={isActive(pathname, item.href) ? "active" : ""}>
              <Icon name={item.icon} size={21} />
              <span>{item.mobileLabel}</span>
            </Link>
          ))}
        </nav>
      </div>
    </ToastProvider>
  );
}
