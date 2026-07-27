import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfile } from "@/lib/data";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Portail d'onboarding : pas encore de profil → on passe par le chemin d'accueil.
  const profile = await getProfile(session.user.id);
  if (!profile) redirect("/onboarding");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
