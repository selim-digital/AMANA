import { streamText, stepCountIs, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ficheOutil } from "@/lib/coaching/outils";
import { COACH, blocPosture, PURGE_OUTILS } from "@/lib/ia/noyau";
import { contexteCompact, sujetDepuisParams } from "@/lib/ia/contexte";

export const maxDuration = 120;

type Msg = { role: "user" | "assistant"; content: string };

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
    // Le bloc de posture est figé et mis en cache ; le contexte variable vient
    // après le point de cache, dans un message distinct.
    messages: [
      blocPosture(),
      ...(contexte ? [{ role: "system" as const, content: contexte }] : []),
      ...messages,
    ],
    stopWhen: stepCountIs(6),
    // Purge les résultats de recherche web des pas suivants (poste de coût n°1).
    providerOptions: PURGE_OUTILS,
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
      web_search: anthropic.tools.webSearch_20260209({ maxUses: 2 }),
      web_fetch: anthropic.tools.webFetch_20260209({ maxUses: 2 }),
    },
    onFinish: async ({ text }) => {
      if (userId && convId && text) {
        await prisma.message
          .create({ data: { conversationId: convId, role: "assistant", content: text } })
          .catch(() => {});
        await prisma.conversation
          .update({ where: { id: convId }, data: { updatedAt: new Date() } })
          .catch(() => {});
      }
    },
  });

  const res = result.toTextStreamResponse();
  if (convId) res.headers.set("X-Conversation-Id", convId);
  return res;
}
