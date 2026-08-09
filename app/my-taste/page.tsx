import { Suspense } from "react";
import { MyTasteClient } from "@/components/MyTasteClient";

export default function MyTastePage() {
  return (
    <Suspense fallback={<main className="page"><div className="panel">Loading My Taste...</div></main>}>
      <MyTasteClient />
    </Suspense>
  );
}
