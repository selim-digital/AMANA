import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Amorçage de l'administration : promeut le compte connecté en ADMIN,
 * mais UNIQUEMENT s'il n'existe encore aucun administrateur.
 * Une fois le premier admin désigné, cette page ne peut plus rien promouvoir.
 */
export default async function DevenirAdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (session.user.role === "ADMIN") redirect("/admin");

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });

  if (adminCount === 0) {
    await prisma.user.update({ where: { id: session.user.id }, data: { role: "ADMIN" } });
  }

  const promu = adminCount === 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="voice-amana text-2xl">
        {promu ? "Tu es administrateur." : "Un administrateur existe déjà."}
      </h1>
      <p className="text-sm text-ink-soft">
        {promu ? (
          <>
            Ton compte vient d&apos;être promu. <b>Déconnecte-toi puis reconnecte-toi</b> pour que le
            changement prenne effet, puis ouvre le tableau de bord.
          </>
        ) : (
          <>
            Cette page ne sert qu&apos;à désigner le tout premier administrateur. La promotion des
            comptes suivants se fait directement en base.
          </>
        )}
      </p>
      <div className="flex gap-3">
        <Link
          href="/admin"
          className="press rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#12100D]"
        >
          Ouvrir l&apos;administration
        </Link>
        <Link href="/aujourdhui" className="press rounded-full border border-ink/20 px-6 py-3 text-xs font-semibold">
          Retour
        </Link>
      </div>
    </main>
  );
}
