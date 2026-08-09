# Spotify Taste

Pitch-ready Next.js prototype for opt-in, human-led music discovery. It combines real Spotify playback and authorized listening history with public Taste profiles, following, comments, notifications and privacy controls.

This is an independent product concept. It is not affiliated with, endorsed by or sponsored by Spotify. Celebrity listening activity and influence economics are explicitly illustrative. Real account history is shown only after that account authorizes Spotify.

## What works

- Spotify Authorization Code with PKCE; no client secret is sent to browser code.
- Encrypted server-side Spotify token storage and `httpOnly` app sessions.
- Import from `/me/player/recently-played`, short-term top tracks and top artists.
- Seven-day history grouped by track and ranked by repeat count, then Spotify popularity.
- Stable public profiles at `/taste/<handle>`.
- Database-backed follows, comments, author notes and notifications.
- A shared feed containing real public events from followed users.
- Per-account sharing, 24-hour delay, selected-session mode and hidden Spotify IDs.
- Automatic Russian or English UI from the browser language, plus a manual EN/RU switch.
- Real Spotify embed playback and real album artwork.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Required environment variables are documented in `.env.example`. The database schema is created idempotently on the first server request.

In Spotify Developer Dashboard, add this exact local redirect URI:

```text
http://localhost:3000/api/auth/spotify/callback
```

For production, add:

```text
https://YOUR_DOMAIN/api/auth/spotify/callback
```

Spotify Development Mode can authorize only users added to the app's tester allowlist. Add every friend who will test real history and follows.
The Spotify developer account must also be eligible for Web API access; the Dashboard currently requires Premium for this app.

## Vercel

1. Connect the GitHub repository to a Vercel project.
2. Add a Neon/PostgreSQL integration so `DATABASE_URL` is available.
3. Set `SPOTIFY_CLIENT_ID`, `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET` and `NEXT_PUBLIC_APP_URL` for Production, Preview and Development. Keep every secret server-only.
4. Deploy, then register the final production callback URL in Spotify Developer Dashboard.

`vercel.json` schedules a daily protected sync at `03:00 UTC`. Profile visits and the owner sync action also refresh stale listening history.

The Russian product and presentation walkthrough is in [`docs/PRODUCT_WALKTHROUGH_RU.md`](docs/PRODUCT_WALKTHROUGH_RU.md).

Never add a Spotify client secret to `NEXT_PUBLIC_*`, source code or git. This implementation does not require one.
