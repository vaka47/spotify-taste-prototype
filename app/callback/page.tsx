import { Suspense } from "react";
import { CallbackClient } from "@/components/CallbackClient";

export default function CallbackPage() {
  return (
    <Suspense fallback={<main className="page"><div className="panel">Completing Spotify authorization...</div></main>}>
      <CallbackClient />
    </Suspense>
  );
}
