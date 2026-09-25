import "./globals.css";
import "./spotify-native.css";
import type React from "react";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { LocaleProvider, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL("https://spotify-taste-prototype.vercel.app"),
  title: "Follow Taste | Human-led discovery for Spotify",
  description: "A working product proposal that turns opt-in listening activity into trusted, followable music discovery.",
  openGraph: {
    title: "Follow Taste | Human-led discovery for Spotify",
    description: "Follow the musical taste of people you trust. Play their shared history, context, and discoveries in one continuous queue.",
    url: "/pitch",
    siteName: "Follow Taste",
    images: [{ url: "/social/follow-taste-og.png", width: 1200, height: 630, alt: "Follow Taste product proposal for Spotify" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Follow Taste | Human-led discovery for Spotify",
    description: "A working product proposal for trusted, human-led music discovery.",
    images: ["/social/follow-taste-og.png"],
  },
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
