import "./globals.css";
import "./spotify-native.css";
import type React from "react";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { LocaleProvider, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Follow Taste - product proposal for Spotify",
  description: "A pitch-ready proposal for trusted, human-led music discovery with measurable attribution.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieLocale = (await cookies()).get("spotify_taste_locale_v2")?.value;
  const initialLocale: Locale = cookieLocale === "ru" ? "ru" : "en";
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
