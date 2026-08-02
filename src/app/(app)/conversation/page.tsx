import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  cadrageClient,
  nomDuSujet,
  sujetDepuisParams,
  type ReleveDuJour,
} from "@/lib/ia/contexte";
import { Chat } from "./Chat";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  searchParams,
}: {
  searchParams: Promise<{
    projet?: string;
    tache?: string;
    etape?: string;
    mode?: string;
    c?: string;
    /** Ce qui vient d'être dicté depuis le micro central. */
    depot?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const sujet = sujetDepuisParams(params);

  const [nom, conversation, historique] = await Promise.all([
    nomDuSujet(userId, sujet),
    params.c
      ? prisma.conversation.findFirst({
          where: { id: params.c, userId },
          include: {
            messages: { orderBy: { createdAt: "asc" } },
            project: { select: { id: true, name: true } },
          },
        })
      : null,
    prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        project: { select: { name: true } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  // Le bilan du soir ouvre sur ce qui a ete fait, jamais sur une question dont
  // la reponse est deja enregistree.
  let releve: ReleveDuJour | undefined;
  if (sujet.type === "bilan" && sujet.cadence === "soir") {
    const debut = new Date(new Date().setHours(0, 0, 0, 0));
    const [faites, intention] = await Promise.all([
      prisma.task.findMany({
        where: { userId, deletedAt: null, status: "DONE", updatedAt: { gte: debut } },
        orderBy: { updatedAt: "asc" },
        select: { title: true, project: { select: { name: true } } },
      }),
      prisma.task.findFirst({
        where: { userId, deletedAt: null, intentionDu: { gte: debut } },
        select: { title: true, status: true },
      }),
    ]);
    releve = {
      faites: faites.map((t) => `${t.title}${t.project ? ` (${t.project.name})` : ""}`),
      essentiel: intention?.title ?? null,
      essentielFait: intention?.status === "DONE",
    };
  }

  const cadrage = cadrageClient(sujet, nom ?? conversation?.project?.name, releve);

  return (
    <Chat
      // La clé force le remontage quand on change d'échange : sans elle, l'état
      // local garderait les messages de la conversation précédente.
      key={conversation?.id ?? `nouveau-${params.projet ?? params.tache ?? params.etape ?? params.mode ?? ""}`}
      messageInitial={params.depot ?? undefined}
      releve={releve}
      cadrage={cadrage}
      sujet={params}
      projetLie={conversation?.project ?? null}
      conversationId={conversation?.id}
      messagesInitiaux={
        conversation?.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })) ?? []
      }
      historique={historique.map((h) => ({
        id: h.id,
        title: h.title ?? "Échange",
        projet: h.project?.name ?? null,
        nb: h._count.messages,
        date: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(
          h.updatedAt,
        ),
      }))}
    />
  );
}
