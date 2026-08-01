import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { COACH } from "@/lib/ia/noyau";
import { memoireDe } from "@/lib/ia/memoire";

export const maxDuration = 120;

/**
 * DeepDive — la plongée.
 *
 * Protocole : on descend par niveaux, chacun changeant de terrain de fouille.
 * Chaque observation est une HYPOTHÈSE que la personne seule peut trancher.
 * La boucle hypothèse → verdict → nouveau signal est le cœur du procédé :
 * les réponses deviennent la matière du niveau suivant.
 */

const TERRAINS: Record<number, string> = {
  1: "LES FAITS. Ce qu'elle a écrit : sa vision, ses domaines, ses projets, leurs objectifs, ses actions. Cherche les tensions internes entre ce qui est déclaré et ce qui est fait.",
  2: "LES CROISEMENTS. Non plus les faits isolés, mais leurs recoupements : les dates, les absences (ce qui devrait être là et n'y est pas), les disparitions (projets orphelins, actions abandonnées), les mentions uniques, les écarts entre ce qu'elle dit vouloir et ce à quoi elle consacre son temps.",
  3: "SES ARTEFACTS. Ce qu'elle écrit pour elle-même : la formulation de ses projets, les mots choisis pour ses objectifs, ce qu'elle décide de mesurer et ce qu'elle ne mesure pas, les domaines de vie sans aucun projet. On ne se méfie jamais de ce qu'on écrit pour soi.",
  4: "SA MANIÈRE. La forme même de ses réponses : son lexique récurrent, les verdicts qu'elle accepte sans défense contre ceux qu'elle rejette (l'asymétrie dessine la zone gardée), les chaînes causales spontanées (quand elle enchaîne X → Y → Z, la racine est en Z), les contre-exemples entre son récit et ses faits.",
};

const schema = z.object({
  signaux: z
    .array(
      z.object({
        hypothese: z
          .string()
          .describe("L'hypothèse, formulée comme une question ouverte adressée à la personne"),
        fondement: z.string().describe("Ce sur quoi elle s'appuie, factuellement"),
      }),
    )
    .describe("Trois hypothèses, pas plus"),
});

const SYSTEME = `Tu conduis une plongée d'introspection pour AMANA.

Ton rôle : proposer des HYPOTHÈSES sur ce que la personne porte sans le voir — jamais des conclusions.

Règles absolues du protocole :
- Formule chaque hypothèse comme une question ouverte, à laquelle elle répondra par « juste », « en partie » ou « faux ». Elle est le seul juge.
- Appuie chaque hypothèse sur un fondement factuel, tiré de ce qu'elle a écrit. N'invente rien.
- Challenge le comportement, jamais l'intention. Tu ne prêtes JAMAIS de motif caché, jamais de calcul, jamais d'intention divisée.
- Les signaux positifs comptent autant que les points de friction : ce n'est pas un procès.
- Ton sobre. Pas de psychologisation, pas de jargon, pas de flatterie.
- Trois hypothèses maximum. La rareté force la justesse.

FRONTIÈRE ABSOLUE — tu ne franchis jamais ces portes :
- L'intention profonde (niyyah) : elle ne s'audite pas, elle s'examine en prière.
- La décision d'orientation de vie : tu éclaires, tu ne choisis pas.
- Les questions de religion : elles relèvent des savants, pas de toi.
Si un sujet t'y mène, tu nommes la frontière et tu t'arrêtes.

Réponds en français.`;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "IA non configurée" }, { status: 503 });
  }

  const { sessionId } = (await req.json().catch(() => ({}))) as { sessionId?: string };

  // Session en cours, ou nouvelle plongée.
  const plongee = sessionId
    ? await prisma.deepDiveSession.findFirst({
        where: { id: sessionId, userId },
        include: { signaux: true },
      })
    : await prisma.deepDiveSession.create({
        data: { userId },
        include: { signaux: true },
      });

  if (!plongee) return NextResponse.json({ error: "Plongée introuvable" }, { status: 404 });

  // Le matériau vient de la mémoire partagée : la plongée voit exactement ce
  // que le chat voit — valeurs, verdicts passés, souvenirs compris. Elle
  // reconstruisait auparavant son propre contexte, et ignorait la moitié.
  const materiau = await memoireDe(userId, "plongee");

  // Les verdicts déjà rendus nourrissent le niveau suivant.
  const historique = plongee.signaux
    .filter((s) => s.verdict !== "EN_ATTENTE")
    .map(
      (s) =>
        `- « ${s.hypothese} » → ${
          ({ VALIDE: "VALIDÉ", NUANCE: "NUANCÉ", INVALIDE: "REJETÉ", EN_ATTENTE: "" } as const)[
            s.verdict
          ]
        }${s.verbatim ? ` : « ${s.verbatim} »` : ""}`,
    )
    .join("\n");

  try {
    const { object } = await generateObject({
      model: COACH,
      schema,
      system: SYSTEME,
      prompt: [
        `NIVEAU ${plongee.niveau} — terrain de fouille : ${TERRAINS[plongee.niveau] ?? TERRAINS[4]}`,
        "",
        "MATÉRIAU :",
        materiau,
        historique
          ? `\nVERDICTS DÉJÀ RENDUS (ne répète aucune hypothèse ; l'asymétrie entre ce qu'elle accepte et ce qu'elle rejette est elle-même un signal) :\n${historique}`
          : "",
        "\nPropose trois hypothèses pour ce niveau.",
      ].join("\n"),
    });

    const crees = await prisma.$transaction(
      object.signaux.map((s) =>
        prisma.signal.create({
          data: {
            sessionId: plongee.id,
            niveau: plongee.niveau,
            hypothese: s.hypothese,
            fondement: s.fondement,
          },
        }),
      ),
    );

    await prisma.event
      .create({ data: { userId, type: "deepdive_signaux", payload: { niveau: plongee.niveau } } })
      .catch(() => {});

    return NextResponse.json({ sessionId: plongee.id, niveau: plongee.niveau, signaux: crees });
  } catch (e) {
    console.error("[deepdive]", e);
    return NextResponse.json({ error: "La plongée a échoué. Réessaie." }, { status: 502 });
  }
}
