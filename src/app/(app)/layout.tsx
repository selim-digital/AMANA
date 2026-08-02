import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfile } from "@/lib/data";
import { Entete } from "@/components/Entete";
import { Ouverture } from "@/components/Ouverture";
import { InstallPrompt } from "@/components/InstallPrompt";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Portail d'onboarding : pas encore de profil → on passe par le chemin d'accueil.
  const profile = await getProfile(session.user.id);
  if (!profile) redirect("/onboarding");

  return (
    <div className="min-h-dvh overflow-x-hidden">
      {/* La marque s'eveille au lancement, une fois par session. */}
      <Ouverture />
      {/* Plus de menu : on entre par les univers, tout se fait a l'interieur
          de celui ou l'on est. Ne reste que la marque et l'initiale. */}
      <Entete />
      {/* pb-28 : le contenu passe au-dessus du micro flottant. Sur grand
          ecran on s'elargit pour que tout tienne dans la hauteur — un
          univers ne doit pas se parcourir en faisant defiler. */}
      <div className="mx-auto w-full max-w-md pb-28 lg:max-w-5xl lg:pb-24">{children}</div>
      <InstallPrompt />
    </div>
  );
}
