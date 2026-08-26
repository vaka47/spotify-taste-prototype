"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { Icon } from "@/components/Icons";
import { travis } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";

type ProfileSearchResult = {
  handle: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  verified: boolean;
  following: boolean;
  followers: number;
};

export default function SearchPage() {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) { setProfiles([]); setLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/profiles/search?q=${encodeURIComponent(value)}`, { cache: "no-store", signal: controller.signal })
        .then(async response => response.ok ? response.json() as Promise<{ profiles: ProfileSearchResult[] }> : { profiles: [] })
        .then(payload => setProfiles(payload.profiles))
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const normalized = query.trim().toLowerCase();
  const showTravis = normalized.length >= 2 && `${travis.name} ${travis.slug}`.toLowerCase().includes(normalized);
  const hasResults = showTravis || profiles.length > 0;

  return <main className="spxSearchPage">
    <header><h1>{ru ? "Поиск" : "Search"}</h1><label><Icon name="search" size={22} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder={ru ? "Люди, артисты и авторы" : "People, artists, and creators"} aria-label={ru ? "Поиск профилей Taste" : "Search Taste profiles"} />{query ? <button type="button" onClick={() => setQuery("")} aria-label={ru ? "Очистить" : "Clear"}><Icon name="close" size={18} /></button> : null}</label></header>
    {normalized.length < 2 ? <section className="spxSearchBrowse"><h2>{ru ? "Откройте новый вкус" : "Discover a new point of view"}</h2><Link href="/tastemaker/travis-scott"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="Travis Scott" /><span><strong>Travis Scott<i className="spxVerified"><Icon name="check" size={10} /></i></strong><small>{ru ? "Артист · демонстрационный Taste" : "Artist · Taste product demo"}</small></span><Icon name="chevronRight" size={18} /></Link><p>{ru ? "Введите имя или точный никнейм Spotify. В поиске появляются пользователи, которые подключили и опубликовали Taste." : "Search by a Spotify name or handle. Results include people who connected Spotify and published their Taste."}</p></section> : <section className="spxSearchResults"><div><h2>{ru ? "Профили Taste" : "Taste profiles"}</h2>{loading ? <span>{ru ? "Поиск..." : "Searching..."}</span> : null}</div>{showTravis ? <Link href="/tastemaker/travis-scott"><AvatarImage src={travis.avatarUrl} fallbackSrc={travis.fallbackAvatarUrl} alt="Travis Scott" /><span><strong>Travis Scott<i className="spxVerified"><Icon name="check" size={10} /></i></strong><small>{ru ? "Артист · демонстрационный Taste" : "Artist · Taste product demo"}</small></span><Icon name="chevronRight" size={18} /></Link> : null}{profiles.map(profile => <Link href={`/taste/${profile.handle}`} key={profile.handle}><AvatarImage src={profile.avatarUrl || ""} alt={profile.name} /><span><strong>{profile.name}{profile.verified ? <i className="spxVerified"><Icon name="check" size={10} /></i> : null}</strong><small>@{profile.handle} · {profile.followers} {ru ? "подписчиков" : "followers"}</small></span><Icon name="chevronRight" size={18} /></Link>)}{!loading && !hasResults ? <div className="spxSearchEmpty"><Icon name="search" size={28} /><strong>{ru ? "Профиль не найден" : "No Taste profile found"}</strong><span>{ru ? "Проверьте никнейм или попросите друга опубликовать Taste." : "Check the handle or ask your friend to publish their Taste."}</span></div> : null}</section>}
  </main>;
}
