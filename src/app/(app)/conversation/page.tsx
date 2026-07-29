import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Chat } from "./Chat";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  searchParams,
}: {
  searchParams: Promise<{ projet?: string; c?: string }>;
}) {
  const { projet: projectId, c: convId } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const [projet, conversation, historique] = await Promise.all([
    projectId
      ? prisma.project.findFirst({
          where: { id: projectId, userId },
          select: { id: true, name: true },
        })
      : null,
    convId
      ? prisma.conversation.findFirst({
          where: { id: convId, userId },
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

  return (
    <Chat
      projet={conversation?.project ?? projet}
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
