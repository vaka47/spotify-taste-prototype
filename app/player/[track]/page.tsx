import { PlayerExperience } from "@/components/PlayerExperience";

export default async function TrackPlayerPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  return <PlayerExperience trackSlug={track} />;
}
