import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { COACH } from "@/lib/ia/noyau";
import { memoireDe } from "@/lib/ia/memoire";

export const maxDuration = 60;

/**
 * Le coup de pouce — une invitation à agir, maintenant.
 *
 * Volontairement distinct de l'orientation : celle-ci dit où entrer, celui-ci
 * dit quoi faire dans les cinq minutes. Il s'appuie sur les FAITS de la
 * personne, jamais sur des statistiques inventées : « les gens qui font X
 * réussissent mieux » serait une donnée fabriquée. En revanche « les jours où
 * tu poses une intention, tu coches deux fois plus » se calcule pour de vrai —
 * et vaut infiniment plus.
 */

const schema = z.object({
  accroche: z
    .string()
    .describe("Une phrase courte qui nomme un fait observé chez elle, ou un principe honnête. Jamais une statistique inventée."),
  texte: z.string().describe("Une ou deux phrases : ce qu'il y a à faire maintenant, et pourquoi ça vaut le coup."),
  cta: z.string().describe("Le libellé du bouton, deux à quatre mots, commençant par un verbe"),
  href: z
    .string()
    .describe(
      "Le lien exact vers l'écran où le geste se fait. Choisis parmi ceux qu'on te donne, sans en inventer.",
    ),
});

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ nudge: null });

  const debutJour = new Date(new Date().setHours(0, 0, 0, 0));
  const il14j = new Date(Date.now() - 14 * 86_400_000);

  // Ses propres régularités : la seule « preuve sociale » qui ne soit pas une invention.
  const [joursAvecIntention, faitesAujourdhui, enAttente, dormants, sansCap] = await Promise.all([
    prisma.task.count({
      where: { userId, deletedAt: null, intentionDu: { gte: il14j } },
    }),
    prisma.task.count({
      where: { userId, deletedAt: null, status: "DONE", updatedAt: { gte: debutJour } },
    }),
    prisma.task.findMany({
      where: { userId, deletedAt: null, status: { notIn: ["DONE"] } },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.project.count({
      where: { userId, deletedAt: null, status: "ACTIVE", updatedAt: { lt: il14j } },
    }),
    prisma.project.count({
      where: { userId, deletedAt: null, status: "ACTIVE", okrs: { none: {} } },
    }),
  ]);

  const jours = (d: Date) => Math.floor((Date.now() - d.getTime()) / 86_400_000);

  try {
    const { object } = await generateObject({
      model: COACH,
      schema,
      system: `Tu écris un coup de pouce dans AMANA : une invitation brève qui déclenche un geste dans les cinq minutes.

Structure : une accroche, une ou deux phrases, un bouton.

L'ACCROCHE peut prendre deux formes, jamais une autre :
1. Un fait observé chez ELLE, tiré des chiffres qu'on te donne. Exemple de forme : « Sur tes quatorze derniers jours, tu as posé une intention six fois. »
2. Un principe d'action énoncé comme un principe, sans chiffre. Exemple de forme : « Une tâche qu'on n'a pas datée se reporte d'elle-même. »

INTERDIT ABSOLU : inventer une statistique sur d'autres personnes. « Les gens qui planifient réussissent 40 % mieux », « la plupart des utilisateurs d'AMANA… » — ce sont des chiffres fabriqués, donc des mensonges. Tu n'as aucune donnée sur d'autres utilisateurs. Si tu n'as pas de fait solide sur elle, prends la forme 2.

Le TEXTE nomme la chose précise à faire, avec ses mots à elle : le titre de l'action, du projet.

Le CTA commence par un verbe. Le lien doit venir de la liste fournie.

Ton : sobre, direct, jamais culpabilisant, jamais enthousiaste. Pas d'exclamation. Tutoie.

Réponds en français.`,
      prompt: `Il est ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.

Ses chiffres réels :
- intentions du jour posées sur les 14 derniers jours : ${joursAvecIntention}
- actions cochées aujourd'hui : ${faitesAujourdhui}
- actions en attente : ${enAttente.length}${
        enAttente.length
          ? `\n${enAttente.map((t) => `  · « ${t.title} » — ${jours(t.createdAt)} jours`).join("\n")}`
          : ""
      }
- projets actifs sans mouvement depuis plus de 14 jours : ${dormants}
- projets actifs sans cap trimestriel : ${sansCap}

Liens possibles (n'en invente aucun autre) :
- /aujourdhui?u=build — l'exécution : intention du jour, projets, actions
- /aujourdhui?u=source — les fondations : vision, valeurs, plongée
- /aujourdhui?u=align — les bilans et les objectifs de l'année
- /projet/<id> — la fiche d un projet : son cap et l avancee de ses resultats cles
- /deepdive — la plongée
- /conversation?mode=bilan — clore la journée
${enAttente.map((t) => `- /conversation?mode=sonde&tache=${t.id} — débloquer « ${t.title} »`).join("\n")}

Son dossier :

${await memoireDe(userId, "chat")}`,
    });

    return NextResponse.json({ nudge: object });
  } catch (e) {
    console.error("[nudge] échec :", e);
    return NextResponse.json({ nudge: null });
  }
}
