import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfile } from "@/lib/data";
import { Entete } from "@/components/Entete";
import { InstallPrompt } from "@/components/InstallPrompt";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Portail d'onboarding : pas encore de profil → on passe par le chemin d'accueil.
  const profile = await getProfile(session.user.id);
  if (!profile) redirect("/onboarding");

  return (
    <div className="min-h-dvh">
      {/* Plus de menu : on entre par les univers, tout se fait a l'interieur
          de celui ou l'on est. Ne reste que la marque et l'initiale. */}
      <Entete />
      {/* pb-28 : le contenu passe au-dessus du micro flottant. */}
      <div className="mx-auto w-full max-w-md pb-28 lg:max-w-3xl">{children}</div>
      <InstallPrompt />
    </div>
  );
}
