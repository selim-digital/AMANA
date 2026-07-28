import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfile } from "@/lib/data";
import { AppNav } from "@/components/AppNav";
import { InstallPrompt } from "@/components/InstallPrompt";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Portail d'onboarding : pas encore de profil → on passe par le chemin d'accueil.
  const profile = await getProfile(session.user.id);
  if (!profile) redirect("/onboarding");

  return (
    <div className="min-h-dvh lg:pl-60">
      <AppNav />
      {/* pb-40 : le contenu passe au-dessus de la nav basse et du bouton flottant. */}
      <div className="mx-auto w-full max-w-md pb-40 lg:max-w-3xl lg:pb-10">{children}</div>
      <InstallPrompt />
    </div>
  );
}
