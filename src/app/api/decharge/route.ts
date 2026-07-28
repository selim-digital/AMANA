import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const DOMAINES = [
  "Spiritualité & sens",
  "Famille",
  "Santé",
  "Profession / entrepreneuriat",
  "Apprentissage",
  "Contribution",
  "Relations",
] as const;

/** Sortie structurée attendue du modèle. */
const schema = z.object({
  projets: z
    .array(
      z.object({
        nom: z.string().describe("Nom court et clair du projet (5 mots max)"),
        vision: z.string().describe("Une phrase : à quoi ressemble ce projet réussi"),
        objectif: z.string().describe("L'objectif concret et mesurable le plus proche"),
        domaine: z.enum(DOMAINES),
        prochaineAction: z.string().describe("Une action concrète de 30 minutes maximum"),
        echeance: z.string().describe("Échéance suggérée en langage naturel, ex : 'vendredi'"),
        extrait: z.string().describe("Le morceau exact du texte d'origine qui a mené à ce projet"),
      }),
    )
    .describe("Les projets : engagements à plusieurs étapes, qui demandent du temps"),
  taches: z
    .array(
      z.object({
        titre: z.string().describe("Action concrète, commence par un verbe"),
        kind: z.enum(["tache", "rappel", "decision"]),
        projet: z.string().describe("Nom du projet rattaché, ou chaîne vide si autonome"),
        echeance: z.string().describe("Échéance en langage naturel, ou chaîne vide"),
        extrait: z.string().describe("Le morceau exact du texte d'origine"),
      }),
    )
    .describe("Tâches (à faire), rappels (à ne pas oublier), décisions (à trancher)"),
  resume: z.string().describe("Une phrase sobre résumant ce qui a été déposé, sans flatterie"),
});

const SYSTEM = `Tu structures une décharge mentale pour AMANA, un partenaire de progression.

La personne a vidé sa tête en vrac. Ton travail : ranger, sans rien inventer.

Règles :
- N'invente RIEN. Chaque élément doit venir du texte ; le champ "extrait" cite le passage exact.
- Distingue : PROJET (plusieurs étapes, s'étale dans le temps) · TÂCHE (une action) · RAPPEL (à ne pas oublier, souvent daté) · DÉCISION (un choix à trancher).
- Rattache une tâche à un projet quand le lien est évident, sinon laisse le champ vide.
- Pour chaque projet, propose une vision (une phrase), un objectif concret, et une prochaine action réalisable en 30 minutes.
- Formule les actions en commençant par un verbe à l'infinitif.
- Ton sobre et factuel. Jamais de flatterie, jamais de culpabilisation, aucun jugement.
- Si une échéance est mentionnée ou déductible, reprends-la en langage naturel ; sinon laisse vide.
- Réponds en français.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { texte } = (await req.json().catch(() => ({}))) as { texte?: string };
  if (!texte || texte.trim().length < 4) {
    return NextResponse.json({ error: "Texte trop court" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "IA non configurée (ANTHROPIC_API_KEY)" }, { status: 503 });
  }

  // Les projets existants évitent les doublons et permettent le rattachement.
  const existants = await prisma.project.findMany({
    where: { userId: session.user.id, deletedAt: null },
    select: { name: true, status: true },
  });

  try {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-5"),
      schema,
      system: SYSTEM,
      prompt: [
        existants.length
          ? `Projets déjà existants (ne les recrée pas, rattache-leur les tâches si pertinent) :\n${existants
              .map((p) => `- ${p.name}`)
              .join("\n")}`
          : "Aucun projet existant.",
        "",
        "Voici ce que la personne a déposé :",
        texte.slice(0, 10000),
      ].join("\n"),
    });

    return NextResponse.json(object);
  } catch (e) {
    console.error("[decharge]", e);
    return NextResponse.json({ error: "La structuration a échoué. Réessaie." }, { status: 502 });
  }
}
