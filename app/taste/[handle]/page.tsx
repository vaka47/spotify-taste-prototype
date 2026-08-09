import { Suspense } from "react";
import { PublicTasteProfileClient } from "@/components/PublicTasteProfileClient";

export default async function TasteProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return (
    <Suspense fallback={<main className="page"><div className="panel">Loading public Taste profile...</div></main>}>
      <PublicTasteProfileClient handle={handle} />
    </Suspense>
  );
}
