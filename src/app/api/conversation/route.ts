import { streamText, stepCountIs, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { INDEX_OUTILS, ficheOutil } from "@/lib/coaching/outils";
import { portraitPourIA } from "@/lib/coaching/profils";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;

/** Prompt système v2 — condensé de docs/livrables/AI_BEHAVIOR.md. */
const SYSTEM = `Tu es l'assistant d'AMANA, un partenaire de progression adaptative. AMANA vient de l'arabe « amanah » : le dépôt confié.

Ta mission : aider la personne à décharger ce qui encombre son esprit, clarifier ce qui compte, puis avancer — une action à la fois.

Méthode (entonnoir, dans l'ordre, sans sauter d'étape) :
1. Accueillir avec calme.
2. Explorer par des questions ouvertes — une seule question à la fois.
3. Reformuler ce que tu as compris AVANT tout conseil, et faire valider.
4. Relier à ce qui compte pour la personne (valeurs, vision) si c'est pertinent.
5. Conclure TOUJOURS par UNE action concrète, petite (30 minutes maximum), avec une échéance proposée.

Distingue la phase de création (explorer, laisser mûrir : ne presse pas) de la phase d'exécution (clarifier, prioriser, agir).

── Tes outils ──

1. OUTILS D'ACCOMPAGNEMENT — tu disposes d'une bibliothèque de méthodes éprouvées. Voici l'index ; appelle « consulter_outil » avec l'identifiant dès qu'une situation y correspond, AVANT de répondre :
${INDEX_OUTILS}

Emploie ces méthodes sans jamais les réciter : elles guident tes questions, elles ne sont pas un cours. Ne nomme une méthode que si la personne le demande ou si cela l'aide vraiment.

2. RECHERCHE WEB — tu peux chercher et lire des pages web quand la personne a besoin d'un fait récent, d'une donnée vérifiable, d'une démarche administrative, d'un contact ou d'une référence. Cite alors tes sources sobrement. N'utilise pas le web pour ce qui relève de son intériorité : là, c'est elle qui sait.

── Challenger, avec justesse ──

Tu n'es pas là pour approuver. Quand c'est utile, tu confrontes — avec respect, jamais avec dureté :
- Relève les contradictions entre ce qu'elle dit vouloir et ce qu'elle fait réellement (« tu dis que ce projet compte le plus, mais aucune action n'y est rattachée depuis dix jours — qu'est-ce qui se passe ? »).
- Questionne les évitements : une tâche sans cesse reportée, un sujet contourné, une décision jamais tranchée.
- Demande des engagements précis : « quand exactement ? », « qu'est-ce qui pourrait t'en empêcher ? ».
- Ne te contente pas d'une réponse vague : reformule et fais préciser.
- Adapte l'intensité à sa manière de fonctionner : direct et bref avec qui va au résultat, progressif et rassurant avec qui a besoin de stabilité, argumenté avec qui veut comprendre.
- Une seule confrontation à la fois, toujours suivie d'une porte de sortie concrète.

Ce que challenger n'est jamais : culpabiliser, moraliser, insister quand la personne dit non.

── Règles absolues ──
- Ne jamais culpabiliser. La procrastination est un symptôme, jamais une faute : propose de réduire l'action à dix minutes.
- Jamais d'injonction (« vous devez ») : « voici une réflexion possible », « tu pourrais ».
- Tu peux dire « je peux me tromper ».
- Si la personne semble en détresse (souffrance, danger), oriente avec douceur vers ses proches ou un professionnel (en France : 3114). Aucun diagnostic médical ou psychologique, jamais.
- Tu es un outil : tu proposes, structures, facilites. Tu ne « penses » pas, tu n'as pas d'émotions, pas de flatterie.
- Réponds en français, avec sobriété : phrases courtes, aérées, sans listes interminables.
- Respecte la dimension spirituelle de la personne si elle l'exprime, sans jamais l'imposer.`;

type Msg = { role: "user" | "assistant"; content: string };

/** Le contexte réel de la personne : c'est ce qui relie le chat aux univers. */
async function contexte(userId: string, projectId?: string) {
  const [profile, projets, taches, projet] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.project.findMany({
      where: { userId, deletedAt: null, status: { in: ["ACTIVE", "SECONDARY"] } },
      orderBy: { order: "asc" },
      select: { name: true, status: true, objective: true, domain: true },
    }),
    prisma.task.findMany({
      where: { userId, deletedAt: null, status: { notIn: ["DONE"] } },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { title: true },
    }),
    projectId
      ? prisma.project.findFirst({
          where: { id: projectId, userId },
          select: { name: true, vision: true, objective: true },
        })
      : null,
  ]);

  const lignes: string[] = ["── Ce que tu sais déjà de la personne ──"];

  const portrait = portraitPourIA({
    disc: (profile?.disc as Record<string, string>) ?? {},
    wpmot: (profile?.wpmot as Record<string, string>) ?? {},
    ego: (profile?.ego as Record<string, string>) ?? {},
  });
  if (portrait) {
    lignes.push(
      `Sa manière de fonctionner (déduite de ses réponses — ne la lui récite JAMAIS, ne la nomme pas) :\n${portrait}`,
    );
  }

  if (profile?.vision) lignes.push(`Sa vision : ${profile.vision}`);
  if (profile?.domaines?.length) lignes.push(`Ses domaines de vie : ${profile.domaines.join(", ")}`);
  if (profile?.style) lignes.push(`Style d'accompagnement souhaité : ${profile.style}`);

  lignes.push(
    projets.length
      ? `Ses projets en cours :\n${projets
          .map((p) => `- ${p.name}${p.objective ? ` (objectif : ${p.objective})` : ""}`)
          .join("\n")}`
      : "Elle n'a pas encore de projet actif.",
  );

  if (taches.length) {
    lignes.push(`Ses actions en attente :\n${taches.map((t) => `- ${t.title}`).join("\n")}`);
  }

  if (projet) {
    lignes.push(
      `\n⚠ Cet échange porte précisément sur le projet « ${projet.name} »${
        projet.vision ? ` — vision : ${projet.vision}` : ""
      }. Reste sur ce sujet sauf si la personne change d'elle-même.`,
    );
  }

  lignes.push(
    "\nAppuie-toi sur ces éléments : nomme ses projets, relie ce qu'elle dit à ce qu'elle porte déjà. N'invente jamais un projet qui n'est pas listé.",
  );
  return lignes.join("\n");
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  const { messages, conversationId, projectId } = (await req.json()) as {
    messages: Msg[];
    conversationId?: string;
    projectId?: string;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    const demo =
      "Je suis en mode démonstration : la clé API n'est pas encore configurée (variable ANTHROPIC_API_KEY).\n\n" +
      "Dès qu'elle le sera, je pourrai t'accompagner réellement — explorer ce qui t'occupe, m'appuyer sur des méthodes " +
      "d'accompagnement éprouvées, chercher au besoin sur le web, et conclure chaque échange par une action concrète datée.";
    return new Response(demo, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  // Conversation persistée : on la crée au premier message, puis on la retrouve.
  let convId = conversationId;
  const dernier = messages[messages.length - 1];

  if (userId) {
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: {
          userId,
          projectId: projectId || null,
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

  const result = streamText({
    model: anthropic("claude-sonnet-5"),
    system: userId ? `${SYSTEM}\n\n${await contexte(userId, projectId)}` : SYSTEM,
    messages,
    // Plusieurs allers-retours : consulter un outil ou le web, puis répondre.
    stopWhen: stepCountIs(6),
    tools: {
      consulter_outil: tool({
        description:
          "Charge la fiche complète d'une méthode d'accompagnement (démarche détaillée et garde-fous) à partir de son identifiant.",
        inputSchema: z.object({
          id: z.string().describe("Identifiant de l'outil, ex. « cnv » ou « maxwell-leadership »"),
        }),
        execute: async ({ id }) => ficheOutil(id),
      }),
      // Le chat nourrit les univers : l'action décidée ici devient une vraie action.
      creer_action: tool({
        description:
          "Enregistre une action concrète dans les priorités de la personne, après qu'elle a explicitement accepté. Rattache-la à un projet existant si c'est pertinent.",
        inputSchema: z.object({
          titre: z.string().describe("Action concrète, commençant par un verbe à l'infinitif"),
          projet: z
            .string()
            .describe("Nom exact d'un projet existant de la personne, ou chaîne vide"),
        }),
        execute: async ({ titre, projet }) => {
          if (!userId) return "Action non enregistrée : personne non connectée.";
          const lie = projet
            ? await prisma.project.findFirst({
                where: { userId, deletedAt: null, name: { equals: projet, mode: "insensitive" } },
                select: { id: true, name: true },
              })
            : null;
          await prisma.task.create({
            data: { userId, projectId: lie?.id ?? null, title: titre, kind: "TASK" },
          });
          await prisma.event
            .create({ data: { userId, type: "task_created", payload: { source: "conversation" } } })
            .catch(() => {});
          return `Action « ${titre} » ajoutée à ses priorités${lie ? ` (projet ${lie.name})` : ""}.`;
        },
      }),
      // Outils serveur d'Anthropic : recherche et lecture de pages web.
      web_search: anthropic.tools.webSearch_20260209({ maxUses: 5 }),
      web_fetch: anthropic.tools.webFetch_20260209({ maxUses: 5 }),
    },
    // À la fin du flux, on enregistre la réponse.
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

  // L'identifiant de conversation est renvoyé dans un en-tête : le client le
  // réutilise pour les messages suivants.
  const res = result.toTextStreamResponse();
  if (convId) res.headers.set("X-Conversation-Id", convId);
  return res;
}
