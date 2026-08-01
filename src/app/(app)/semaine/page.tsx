import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Semaine, type ProjetSemaine } from "./Semaine";

export const dynamic = "force-dynamic";

function trimestreCourant(d = new Date()) {
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

/** SCR-SEMAINE — l'horizon intermédiaire : les caps, leur avancée, ce qui dort. */
export default async function SemainePage() {
  const session = await auth();
  const userId = session!.user.id;
  const periode = trimestreCourant();

  const [projets, objectifs] = await Promise.all([
    prisma.project.findMany({
      where: { userId, deletedAt: null, status: { in: ["ACTIVE", "SECONDARY"] } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        status: true,
        vision: true,
        objective: true,
        updatedAt: true,
        okrs: {
          where: { period: periode },
          select: {
            id: true,
            objective: true,
            keyResults: {
              orderBy: { order: "asc" },
              select: { id: true, label: true, target: true, current: true },
            },
          },
        },
      },
    }),
    prisma.annualGoal.findMany({
      where: { userId, year: new Date().getFullYear() },
      orderBy: { order: "asc" },
      select: { id: true, label: true },
    }),
  ]);

  const jours = (d: Date) => Math.floor((Date.now() - d.getTime()) / 86_400_000);

  const vues: ProjetSemaine[] = projets.map((p) => ({
    id: p.id,
    nom: p.name,
    statut: p.status,
    dormanceJours: jours(p.updatedAt),
    cap: p.okrs[0]
      ? {
          objectif: p.okrs[0].objective,
          resultats: p.okrs[0].keyResults.map((k) => ({
            id: k.id,
            label: k.label,
            cible: k.target,
            valeur: k.current,
          })),
        }
      : null,
  }));

  return (
    <Semaine
      projets={vues}
      objectifsAnnee={objectifs.map((o) => o.label)}
      periode={periode}
    />
  );
}
