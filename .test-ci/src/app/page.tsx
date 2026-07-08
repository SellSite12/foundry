import { getCurrentUser } from "@/lib/auth/session";
import FoundryLanding from "@/components/landing/FoundryLanding";

export default async function HomePage() {
  const user = await getCurrentUser();
  return <FoundryLanding isAuthed={Boolean(user)} />;
}
