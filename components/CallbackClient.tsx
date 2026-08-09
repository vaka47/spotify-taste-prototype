"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { exchangeSpotifyCode, type SpotifyError } from "@/lib/spotify-pkce";

export function CallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("Completing Spotify authorization...");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const denied = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (denied) {
      router.replace(`/my-taste?auth_error=${encodeURIComponent(denied)}`);
      return;
    }

    if (!code) {
      setFailed(true);
      setMessage("Spotify did not return an authorization code.");
      return;
    }

    exchangeSpotifyCode(code, state)
      .then(() => {
        setMessage("Spotify connected. Redirecting to My Taste...");
        router.replace("/my-taste?connected=1");
      })
      .catch((caught: SpotifyError) => {
        setFailed(true);
        setMessage(caught.status ? `Spotify authorization failed (${caught.status}).` : caught.message);
      });
  }, [router, searchParams]);

  return (
    <main className="page pageNarrow">
      <section className={failed ? "errorState" : "panel"}>
        <DemoBadge>Spotify callback</DemoBadge>
        <h1>{failed ? "Authorization needs attention" : "Connecting Spotify"}</h1>
        <p className="muted">{message}</p>
        {failed ? (
          <div className="buttonRow">
            <Link className="btn btnPrimary" href="/my-taste">
              <Icon name="user" />
              Return to My Taste
            </Link>
          </div>
        ) : (
          <div className="spotifyList" style={{ marginTop: 20 }}>
            <div className="skeleton" style={{ height: 14 }} />
            <div className="skeleton" style={{ height: 14, width: "72%" }} />
          </div>
        )}
      </section>
    </main>
  );
}
