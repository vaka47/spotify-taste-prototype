import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile visual QA",
  robots: { index: false, follow: false },
};

const routes: Record<string, string> = {
  home: "/",
  feed: "/feed",
  artist: "/tastemaker/travis-scott",
  player: "/player/euphoria",
  profile: "/taste/vaka47",
  privacy: "/privacy",
};

export default async function MobileQaPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = "feed" } = await searchParams;
  const src = routes[view] || routes.feed;

  return (
    <main style={{ minHeight: "100vh", margin: 0, padding: 0, display: "grid", placeItems: "start center", background: "#242424" }}>
      <iframe
        src={src}
        title={`390 pixel visual QA: ${view}`}
        style={{ width: 390, height: 844, border: 0, background: "#000" }}
      />
    </main>
  );
}
