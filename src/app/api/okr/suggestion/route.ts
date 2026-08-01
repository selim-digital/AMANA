import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { COACH } from "@/lib/ia/noyau";
import { memoireDe } from "@/lib/ia/memoire";

export const maxDuration = 120;

/**
 * Les caps proposés — pour que « Cette semaine » ne soit jamais un écran vide.
 *
 * Un projet actif sans cap trimestriel laissait un trou. Plutôt qu'un vide qui
 * fait paraître l'app inachevée, AMANA propose un cap plausible, construit
 * depuis les objectifs d'année et la vision du projet.
 *
 * Ces caps ne sont PAS enregistrés et s'affichent marqués comme propositions :
 * une donnée inventée qui se ferait passer pour la sienne serait un mensonge,
 * et rendrait tout le tableau de bord suspect. Elle adopte d'un geste.
 */

const schema = z.object({
  caps: z.array(
    z.object({
      projet: z.string().describe("Le nom exact du projet, tel qu'il est fourni"),
      objectif: z
        .string()
        .describe("L'objectif du trimestre en une phrase, orientée résultat et non activité"),
      resultats: z
        .array(z.object({ intitule: z.string(), cible: z.string() }))
        .describe("Deux à trois résultats clés mesurables, chacun avec une cible chiffrée ou datée"),
      pourquoi: z
        .string()
        .describe("En une phrase : ce qui, dans ce qu'elle a écrit, rend ce cap plausible"),
    }),
  ),
});

const SYSTEME = `Tu proposes des caps trimestriels pour les projets d'une personne accompagnée par AMANA.

Ces propositions lui seront montrées comme des PROPOSITIONS, jamais comme ses propres données. Elle les adoptera, les ajustera ou les écartera.

Règles :
- Pars de ce qu'elle a réellement écrit : la vision du projet, son objectif, ses objectifs d'année, ses actions en cours. Ne plaque jamais un modèle générique.
- Un objectif de trimestre se formule en RÉSULTAT (« avoir X »), jamais en activité (« travailler sur X »).
- Chaque résultat clé se vérifie : un nombre, une date, un état binaire. « Progresser » n'est pas un résultat clé.
- Trois mois, pas trois ans : la cible doit être atteignable d'ici la fin du trimestre.
- Reprends son vocabulaire à elle. Si elle appelle son projet « Amana webapp », ne l'appelle pas « la plateforme ».
- Le « pourquoi » cite ce sur quoi tu t'appuies. Si tu n'as presque rien, dis-le honnêtement plutôt que d'inventer une justification.
- Sobriété : pas d'emphase, pas de vocabulaire de coach d'entreprise.

Réponds en français.`;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "IA non configurée" }, { status: 503 });
  }

  const { projetIds } = (await req.json().catch(() => ({}))) as { projetIds?: string[] };

  const projets = await prisma.project.findMany({
    where: {
      userId,
      deletedAt: null,
      status: { in: ["ACTIVE", "SECONDARY"] },
      ...(projetIds?.length ? { id: { in: projetIds } } : {}),
    },
    orderBy: { order: "asc" },
    take: 4,
    select: { id: true, name: true, vision: true, objective: true, domain: true },
  });

  const sansCap = projets.filter((p) => !!p);
  if (!sansCap.length) return NextResponse.json({ caps: [] });

  try {
    const { object } = await generateObject({
      model: COACH,
      schema,
      system: SYSTEME,
      prompt: `Ce que tu sais d'elle :\n\n${await memoireDe(userId, "chat")}\n\n──────────\n\nLes projets qui n'ont pas encore de cap pour ce trimestre :\n\n${sansCap
        .map(
          (p) =>
            `- « ${p.name} »${p.domain ? ` (${p.domain})` : ""}${
              p.vision ? `\n  Vision : ${p.vision}` : "\n  Aucune vision écrite."
            }${p.objective ? `\n  Objectif : ${p.objective}` : "\n  Aucun objectif écrit."}`,
        )
        .join("\n\n")}\n\nPropose un cap par projet, dans le même ordre.`,
    });

    // On rattache chaque cap à son projet par le nom : le modèle ne manipule
    // jamais d'identifiant, et un nom qui ne correspond à rien est écarté.
    const parNom = new Map(sansCap.map((p) => [p.name.toLowerCase(), p.id]));
    const caps = object.caps
      .map((c) => ({ ...c, projetId: parNom.get(c.projet.trim().toLowerCase()) }))
      .filter((c) => c.projetId);

    return NextResponse.json({ caps });
  } catch (e) {
    console.error("[okr/suggestion] échec :", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "La proposition n'a pas abouti." },
      { status: 500 },
    );
  }
}
