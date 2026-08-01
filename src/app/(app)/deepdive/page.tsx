import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Plongee, type SignalVue } from "./Plongee";
import { Archives, type PlongeePassee } from "./Archives";

export const dynamic = "force-dynamic";

export default async function DeepDivePage() {
  const session = await auth();
  const userId = session!.user.id;

  // La plongée en cours, ou la dernière close.
  const plongee = await prisma.deepDiveSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { signaux: { orderBy: { createdAt: "asc" } } },
  });

  // Les précédentes ne disparaissent pas : l'écart entre ce qu'on reconnaissait
  // il y a trois mois et ce qu'on reconnaît aujourd'hui a de la valeur.
  const passees = plongee
    ? await prisma.deepDiveSession.findMany({
        where: { userId, id: { not: plongee.id } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          createdAt: true,
          closedAt: true,
          niveau: true,
          synthese: true,
          _count: { select: { signaux: true } },
        },
      })
    : [];

  const archives: PlongeePassee[] = passees.map((p) => ({
    id: p.id,
    date: (p.closedAt ?? p.createdAt).toISOString(),
    niveau: p.niveau,
    nbSignaux: p._count.signaux,
    constat: p.synthese ? (JSON.parse(p.synthese).constat as string) : null,
  }));

  const signaux: SignalVue[] =
    plongee?.signaux.map((s) => ({
      id: s.id,
      niveau: s.niveau,
      hypothese: s.hypothese,
      fondement: s.fondement,
      verdict: s.verdict,
      verbatim: s.verbatim,
    })) ?? [];

  return (
    <>
      <Plongee
        sessionId={plongee?.id ?? null}
        niveau={plongee?.niveau ?? 1}
        signaux={signaux}
        close={plongee?.status === "close"}
        synthese={plongee?.synthese ? JSON.parse(plongee.synthese) : null}
        tranchees={signaux.filter((x) => x.verdict !== "EN_ATTENTE").length}
      />
      <Archives plongees={archives} peutRelancer={!plongee || plongee.status === "close"} />
    </>
  );
}
