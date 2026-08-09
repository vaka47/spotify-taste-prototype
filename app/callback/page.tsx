import { redirect } from "next/navigation";

export default function LegacyCallbackPage() {
  redirect("/my-taste?error=legacy_callback");
}
