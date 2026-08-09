# Next.js starter

This is intentionally a starter, not the finished UI. It contains:

- routes;
- design tokens;
- mock product types/data;
- prototype attribution storage;
- Spotify PKCE/token helpers;
- generated demo art.

Give Codex the root `docs/07_CODEX_MASTER_PROMPT.md` and instruct it to implement the P0 backlog.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Before first Spotify login, register `http://127.0.0.1:3000/callback` exactly in the Spotify Developer Dashboard.
