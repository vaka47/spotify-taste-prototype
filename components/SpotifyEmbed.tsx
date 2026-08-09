export function SpotifyEmbed({
  src,
  title,
  size = "compact",
}: {
  src: string;
  title: string;
  size?: "compact" | "large" | "artist";
}) {
  return (
    <div className={`spotifyEmbed spotifyEmbed-${size}`}>
      <iframe
        title={title}
        src={src}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading={size === "compact" ? "lazy" : "eager"}
        allowFullScreen
      />
    </div>
  );
}
