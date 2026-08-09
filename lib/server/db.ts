import "server-only";
import postgres, { type Sql } from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var spotifyTasteSql: Sql | undefined;
  // eslint-disable-next-line no-var
  var spotifyTasteSchemaReady: Promise<void> | undefined;
}

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export function db() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  if (!global.spotifyTasteSql) {
    global.spotifyTasteSql = postgres(connectionString, {
      max: 3,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
      ssl: connectionString.includes("localhost") ? false : "require",
    });
  }
  return global.spotifyTasteSql;
}

async function createSchema() {
  const sql = db();
  await sql`
    create table if not exists taste_users (
      id text primary key,
      handle text not null unique,
      display_name text not null,
      avatar_url text,
      country text,
      spotify_url text,
      product text,
      bio text not null default '',
      role text not null default 'Spotify listener',
      verified boolean not null default false,
      share_enabled boolean not null default true,
      share_delay_hours integer not null default 0,
      selected_sessions_only boolean not null default false,
      hidden_track_ids jsonb not null default '[]'::jsonb,
      hidden_artist_ids jsonb not null default '[]'::jsonb,
      access_token_encrypted text not null,
      refresh_token_encrypted text,
      token_expires_at timestamptz not null,
      spotify_scope text not null default '',
      top_tracks jsonb not null default '[]'::jsonb,
      top_artists jsonb not null default '[]'::jsonb,
      last_synced_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists taste_sessions (
      token_hash text primary key,
      user_id text not null references taste_users(id) on delete cascade,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists taste_events (
      id text primary key,
      user_id text not null references taste_users(id) on delete cascade,
      track_id text not null,
      title text not null,
      artist text not null,
      artist_ids jsonb not null default '[]'::jsonb,
      album_name text,
      cover_url text,
      spotify_url text,
      duration_ms integer not null default 0,
      played_at timestamptz not null,
      author_note text,
      is_public boolean not null default true,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists taste_events_user_played_idx on taste_events(user_id, played_at desc)`;
  await sql`
    create table if not exists taste_follows (
      follower_id text not null references taste_users(id) on delete cascade,
      followed_id text not null references taste_users(id) on delete cascade,
      created_at timestamptz not null default now(),
      primary key (follower_id, followed_id),
      check (follower_id <> followed_id)
    )
  `;
  await sql`
    create table if not exists taste_comments (
      id text primary key,
      event_id text not null references taste_events(id) on delete cascade,
      author_id text not null references taste_users(id) on delete cascade,
      body text not null,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists taste_comments_event_idx on taste_comments(event_id, created_at asc)`;
  await sql`
    create table if not exists taste_notifications (
      id text primary key,
      user_id text not null references taste_users(id) on delete cascade,
      actor_id text references taste_users(id) on delete set null,
      kind text not null,
      event_id text references taste_events(id) on delete cascade,
      body text not null,
      read_at timestamptz,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists taste_notifications_user_idx on taste_notifications(user_id, created_at desc)`;
}

export async function ensureSchema() {
  if (!global.spotifyTasteSchemaReady) global.spotifyTasteSchemaReady = createSchema();
  return global.spotifyTasteSchemaReady;
}
