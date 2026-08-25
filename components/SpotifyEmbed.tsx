export function SpotifyEmbed({
  src,
  title,
  size = "compact",
}: {
  src: string;
  title: string;
  size?: "compact" | "large" | "artist";
}) {
  const spotifyUrl = src.replace("open.spotify.com/embed/", "open.spotify.com/").split("?")[0];
  return (
    <div className={`spotifyEmbed spotifyEmbed-${size}`}>
      <a className="spotifyEmbedFallback" href={spotifyUrl} target="_blank" rel="noreferrer" aria-label={`Open ${title}`}>
        <span aria-hidden="true">▶</span>
        <span><strong>{title.replace(/^Spotify:\s*/, "")}</strong><small>Spotify player</small></span>
      </a>
      <iframe
        title={title}
        src={src}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="eager"
        allowFullScreen
      />
    </div>
  );
}
