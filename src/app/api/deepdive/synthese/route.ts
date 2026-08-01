import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { COACH } from "@/lib/ia/noyau";
import { memoireDe, memoriser } from "@/lib/ia/memoire";

export const maxDuration = 120;

/**
 * L'analyse finale d'une plongée.
 *
 * Une plongée sans restitution laisse la personne avec une pile d'hypothèses
 * tranchées et rien qui les relie. Ici on ne produit RIEN de neuf : on relit
 * ses propres verdicts et on en tire ce qui se tient. Une plongée déjà close
 * peut donc être analysée après coup — la matière n'a pas bougé.
 */

const schema = z.object({
  constat: z
    .string()
    .describe("Le fil qui relie ses verdicts, en deux ou trois phrases. Descriptif, jamais un jugement."),
  appuis: z
    .array(z.string())
    .describe("Une à trois forces qui ressortent de ce qu'elle a reconnu. Factuelles."),
  frictions: z
    .array(z.string())
    .describe("Une à trois tensions qu'elle a validées ou nuancées. Jamais celles qu'elle a rejetées."),
  angleMort: z
    .string()
    .describe(
      "Ce que l'asymétrie de ses verdicts laisse entrevoir, formulé comme une question ouverte. Chaîne vide si rien de solide.",
    ),
  orientation: z
    .string()
    .describe("UNE seule orientation concrète pour les semaines qui viennent. Petite, datable."),
});

const SYSTEME = `Tu rédiges la restitution d'une plongée d'introspection pour AMANA.

Tu ne disposes que de ses verdicts : les hypothèses qu'elle a reconnues (VALIDÉ), celles qu'elle a nuancées (NUANCÉ), celles qu'elle a rejetées (REJETÉ), et ses mots quand elle en a laissé.

Règles :
- Tu ne produis AUCUNE hypothèse nouvelle. Tu relies ce qu'elle a déjà tranché.
- Ce qu'elle a REJETÉ est mort : tu ne le réintroduis sous aucune forme, même adoucie.
- Ce qu'elle a NUANCÉ se cite avec sa nuance, jamais comme un acquis.
- Ses mots à elle priment sur toute reformulation. Reprends-les quand ils sont là.
- L'angle mort se déduit de la FORME de ses réponses (ce qu'elle accepte vite contre ce qu'elle discute), jamais d'un motif que tu lui prêterais. En cas de doute, laisse-le vide.
- Ton sobre et adulte. Pas de psychologisation, pas de compliment, pas de dramatisation. Elle doit se reconnaître, pas être impressionnée.
- Tu ne conclus jamais sur sa valeur, ses intentions ou sa sincérité.

FRONTIÈRE — tu ne franchis jamais ces portes : l'intention profonde (niyyah), la décision d'orientation de vie, les questions de religion. Si le matériau t'y mène, tu t'arrêtes et tu le dis.

Réponds en français.`;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "IA non configurée" }, { status: 503 });
  }

  const { sessionId, refaire } = (await req.json().catch(() => ({}))) as {
    sessionId?: string;
    refaire?: boolean;
  };
  if (!sessionId) return NextResponse.json({ error: "Plongée non précisée" }, { status: 400 });

  const plongee = await prisma.deepDiveSession.findFirst({
    where: { id: sessionId, userId },
    include: { signaux: { orderBy: { createdAt: "asc" } } },
  });
  if (!plongee) return NextResponse.json({ error: "Plongée introuvable" }, { status: 404 });

  // Déjà analysée : on la rend telle quelle. Une analyse ne se réécrit pas
  // à chaque affichage — ce serait une autre restitution à chaque lecture.
  if (plongee.synthese && !refaire) {
    return NextResponse.json({ synthese: JSON.parse(plongee.synthese) });
  }

  const tranches = plongee.signaux.filter((s) => s.verdict !== "EN_ATTENTE");
  if (tranches.length < 2) {
    return NextResponse.json(
      { error: "Il faut avoir tranché au moins deux hypothèses pour qu'une analyse ait du sens." },
      { status: 400 },
    );
  }

  const LABEL = { VALIDE: "RECONNU", NUANCE: "NUANCÉ", INVALIDE: "REJETÉ", EN_ATTENTE: "" } as const;
  const materiau = tranches
    .map(
      (s) =>
        `[Niveau ${s.niveau} · ${LABEL[s.verdict]}] « ${s.hypothese} »${
          s.fondement ? `\n  Fondement : ${s.fondement}` : ""
        }${s.verbatim ? `\n  Ses mots : « ${s.verbatim} »` : ""}`,
    )
    .join("\n\n");

  try {
    const { object } = await generateObject({
      model: COACH,
      schema,
      system: SYSTEME,
      prompt: `Ce que tu sais d'elle :\n\n${await memoireDe(userId, "plongee")}\n\n──────────\n\nSes verdicts, dans l'ordre où ils ont été rendus :\n\n${materiau}`,
    });

    await prisma.deepDiveSession.update({
      where: { id: plongee.id },
      data: { synthese: JSON.stringify(object) },
    });

    // Le constat rejoint la mémoire longue : c'est le socle des mois suivants.
    await memoriser(userId, `Restitution de plongée : ${object.constat}`, "STABLE", "plongee");
    if (object.orientation) {
      await memoriser(
        userId,
        `Orientation retenue après plongée : ${object.orientation}`,
        "EVOLUTIVE",
        "plongee",
      );
    }

    return NextResponse.json({ synthese: object });
  } catch (e) {
    console.error("[deepdive/synthese] échec :", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "L'analyse n'a pas abouti." },
      { status: 500 },
    );
  }
}
