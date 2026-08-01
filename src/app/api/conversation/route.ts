import { streamText, stepCountIs, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ficheOutil } from "@/lib/coaching/outils";
import { COACH, SYSTEME_COACH } from "@/lib/ia/noyau";
import { contexteCompact, sujetDepuisParams } from "@/lib/ia/contexte";
import { outilsEspace } from "@/lib/ia/outils-espace";
import { retenirDeLEchange } from "@/lib/ia/memoire";

export const maxDuration = 120;

type Msg = { role: "user" | "assistant"; content: string };
type Fichier = { nom: string; type: string; donnees: string };

/** Types acceptés tels quels par le modèle. Le reste est lu comme du texte
 *  côté client, ou refusé avec un message clair. */
const NATIF = (t: string) => t.startsWith("image/") || t === "application/pdf";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  const body = (await req.json()) as {
    messages: Msg[];
    conversationId?: string;
    projet?: string;
    tache?: string;
    etape?: string;
    mode?: string;
  };
  const { messages } = body;
  const fichiers = (body as { fichiers?: Fichier[] }).fichiers ?? [];

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "Je suis en mode démonstration : la clé API n'est pas encore configurée (ANTHROPIC_API_KEY).",
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const sujet = sujetDepuisParams(body);
  const projectId = sujet.type === "projet" ? sujet.id : undefined;

  // Conversation persistée : créée au premier message, retrouvée ensuite.
  let convId = body.conversationId;
  const dernier = messages[messages.length - 1];

  if (userId) {
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: {
          userId,
          projectId: projectId ?? null,
          title: dernier?.content.slice(0, 70) ?? "Échange",
        },
      });
      convId = conv.id;
    }
    if (dernier?.role === "user") {
      await prisma.message
        .create({ data: { conversationId: convId, role: "user", content: dernier.content } })
        .catch(() => {});
    }
  }

  const contexte = userId ? await contexteCompact(userId, sujet) : "";

  const result = streamText({
    model: COACH,
    // Posture et contexte passent par le paramètre `system` : forme simple et
    // éprouvée. (La mise en cache par messages système était une optimisation
    // prématurée — elle cassait le flux.)
    system: contexte ? `${SYSTEME_COACH}\n\n${contexte}` : SYSTEME_COACH,
    messages: [
      // Les pièces jointes accompagnent le dernier message de la personne.
      ...(fichiers.length
        ? [
            ...messages.slice(0, -1),
            {
              role: "user" as const,
              content: [
                { type: "text" as const, text: dernier?.content ?? "" },
                ...fichiers
                  .filter((f) => NATIF(f.type))
                  .map((f) => ({
                    type: "file" as const,
                    data: f.donnees,
                    mediaType: f.type,
                    filename: f.nom,
                  })),
              ],
            },
          ]
        : messages),
    ],
    // Assez de pas pour lire son espace, y inscrire ce qu'elle confie, puis
    // répondre — sans jamais la laisser attendre devant un écran muet.
    stopWhen: stepCountIs(6),
    tools: {
      consulter_outil: tool({
        description:
          "Charge la fiche complète d'une méthode d'accompagnement (démarche et garde-fous) à partir de son identifiant.",
        inputSchema: z.object({
          id: z.string().describe("Identifiant de l'outil, ex. « cnv » ou « maxwell-leadership »"),
        }),
        execute: async ({ id }) => ficheOutil(id),
      }),
      // Proposition seulement : la personne valide d'un geste dans l'interface.
      creer_action: tool({
        description:
          "Propose une action concrète à ajouter aux priorités. Elle n'est PAS enregistrée : la personne devra la valider d'un geste. Ne dis jamais qu'elle est créée.",
        inputSchema: z.object({
          titre: z.string().describe("Action concrète, commençant par un verbe à l'infinitif"),
          projet: z.string().describe("Nom exact d'un projet existant, ou chaîne vide"),
          echeance: z.string().describe("Échéance en langage naturel, ou chaîne vide"),
        }),
        execute: async ({ titre, projet, echeance }) =>
          `Proposition transmise à l'interface : « ${titre} »${projet ? ` (projet ${projet})` : ""}${
            echeance ? ` — ${echeance}` : ""
          }. Dis-lui qu'elle peut la valider juste en dessous.`,
      }),
      // Les mains du chat sur son espace : lire, noter ses valeurs, créer et
      // préciser ses projets, poser ses objectifs et le cap du trimestre.
      ...(userId ? outilsEspace(userId) : {}),
      // La recherche web n'est branchée que si elle est explicitement activée
      // (RECHERCHE_WEB=1). Si le compte Anthropic ne la prend pas en charge,
      // la déclarer suffit à casser tout le flux : le chat doit marcher sans.
      ...(process.env.RECHERCHE_WEB === "1"
        ? { web_search: anthropic.tools.webSearch_20260209({ maxUses: 1 }) }
        : {}),
    },
    // Sans cela, une erreur du modèle casse le flux sans laisser de trace.
    onError: ({ error }) => {
      console.error("[conversation] échec du flux :", error);
    },
    onFinish: async ({ text }) => {
      if (userId && convId && text) {
        await prisma.message
          .create({ data: { conversationId: convId, role: "assistant", content: text } })
          .catch(() => {});
        await prisma.conversation
          .update({ where: { id: convId }, data: { updatedAt: new Date() } })
          .catch(() => {});

        // Ce qui mérite d'être retenu l'est ici, une fois la réponse partie :
        // la personne n'attend pas, et la plongée le retrouvera.
        await retenirDeLEchange(
          userId,
          `${dernier?.content ?? ""}\n\nRéponse d'AMANA :\n${text}`,
        ).catch(() => {});
      }
    },
  });

  // On tient le flux nous-mêmes : `toTextStreamResponse` avale les erreurs du
  // modèle et laisse la personne devant une bulle vide. Ici, ce qui casse est
  // écrit dans la réponse — visible, donc corrigeable.
  const flux = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encodeur = new TextEncoder();
      try {
        for await (const morceau of result.textStream) {
          controller.enqueue(encodeur.encode(morceau));
        }
      } catch (e) {
        const detail = e instanceof Error ? `${e.name} : ${e.message}` : String(e);
        console.error("[conversation] échec du flux :", e);
        controller.enqueue(
          encodeur.encode(`\n\n⚠️ L'appel au modèle a échoué.\n${detail}`),
        );
      } finally {
        controller.close();
      }
    },
  });

  const res = new Response(flux, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
  if (convId) res.headers.set("X-Conversation-Id", convId);
  return res;
}
