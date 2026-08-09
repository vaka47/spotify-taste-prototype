import "./globals.css";
import type React from "react";
import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { LocaleProvider, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Spotify Taste - independent product concept",
  description: "Pitch-ready prototype for human-led music discovery through verified taste signals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieLocale = (await cookies()).get("spotify_taste_locale")?.value;
  const browserLanguages = (await headers()).get("accept-language") || "";
  const initialLocale: Locale = cookieLocale === "ru" || (cookieLocale !== "en" && /(^|,)\s*ru\b/i.test(browserLanguages)) ? "ru" : "en";
  return (
    <html lang={initialLocale}>
      <body>
        <LocaleProvider initialLocale={initialLocale}>
          <AppShell>{children}</AppShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
