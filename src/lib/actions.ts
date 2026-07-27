"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

async function logEvent(userId: string, type: string, payload?: Record<string, unknown>) {
  await prisma.event
    .create({
      data: { userId, type, payload: (payload ?? Prisma.JsonNull) as Prisma.InputJsonValue },
    })
    .catch(() => {});
}

// ─────────────────────────── Onboarding ───────────────────────────

export type OnboardingInput = {
  prenom: string;
  situation?: string;
  vision?: string;
  domaines?: string[];
  projets?: string;
  charge?: string;
  style?: string;
  disc?: string[];
  motivation?: string;
  porte?: string;
};

export async function saveOnboarding(input: OnboardingInput) {
  const userId = await requireUserId();

  // Le prénom devient le nom affiché s'il n'est pas déjà défini.
  if (input.prenom?.trim()) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: input.prenom.trim() },
    });
  }

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      situation: input.situation,
      vision: input.vision,
      domaines: input.domaines ?? [],
      style: input.style,
      motivation: input.motivation,
      disc: { reponses: input.disc ?? [], charge: input.charge ?? null },
    },
    update: {
      situation: input.situation,
      vision: input.vision,
      domaines: input.domaines ?? [],
      style: input.style,
      motivation: input.motivation,
      disc: { reponses: input.disc ?? [], charge: input.charge ?? null },
    },
  });

  await logEvent(userId, "onboarding_completed", {
    domaines: input.domaines,
    porte: input.porte,
  });

  revalidatePath("/aujourdhui");
}

// ─────────────────────────── Décharge mentale ───────────────────────────

type DechargeItem = { type: string; titre: string };

export async function commitDecharge(items: DechargeItem[]) {
  const userId = await requireUserId();

  const activeCount = await prisma.project.count({
    where: { userId, deletedAt: null, status: "ACTIVE" },
  });
  let created = activeCount;

  for (const it of items) {
    if (it.type === "Projet") {
      // Règle produit : max 3 projets actifs, au-delà → boîte à idées (futurs).
      const statut = created < 3 ? "ACTIVE" : "IDEA";
      if (statut === "ACTIVE") created += 1;
      await prisma.project.create({ data: { userId, name: it.titre, status: statut } });
      await logEvent(userId, "project_created", { statut });
    } else {
      const kind = it.type === "Rappel" ? "REMINDER" : it.type === "Décision" ? "DECISION" : "TASK";
      await prisma.task.create({ data: { userId, title: it.titre, kind } });
      await logEvent(userId, "task_created", { kind });
    }
  }

  await logEvent(userId, "braindump_completed", { count: items.length });
  revalidatePath("/aujourdhui");
  revalidatePath("/projets");
}

// ─────────────────────────── Tâches ───────────────────────────

export async function toggleTask(taskId: string) {
  const userId = await requireUserId();
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) return;
  const done = task.status !== "DONE";
  await prisma.task.update({
    where: { id: taskId },
    data: { status: done ? "DONE" : "TODO" },
  });
  if (done) await logEvent(userId, "task_done", {});
  revalidatePath("/aujourdhui");
}

// ─────────────────────────── Compte ───────────────────────────

export async function deleteAccount() {
  const userId = await requireUserId();
  await prisma.user.delete({ where: { id: userId } }); // cascade Prisma
  redirect("/login");
}

// ─────────────────────────── Lecture pour /chemin ───────────────────────────

export type CheminData = {
  vision: string | null;
  taskCount: number;
  projects: {
    name: string;
    status: string;
    progress: number;
    objective: string | null;
    vision: string | null;
  }[];
};

export async function getCheminData(): Promise<CheminData> {
  const userId = await requireUserId();
  const [profile, projects, taskCount] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.project.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.count({ where: { userId, deletedAt: null } }),
  ]);
  return {
    vision: profile?.vision ?? null,
    taskCount,
    projects: projects.map((p) => ({
      name: p.name,
      status: p.status,
      progress: p.progress,
      objective: p.objective,
      vision: p.vision,
    })),
  };
}
