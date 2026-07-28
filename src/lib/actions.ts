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

export type ProjetPropose = {
  nom: string;
  vision?: string;
  objectif?: string;
  domaine?: string;
  prochaineAction?: string;
  echeance?: string;
};

export type TachePropose = {
  titre: string;
  kind: "tache" | "rappel" | "decision";
  projet?: string;
  echeance?: string;
};

const KIND = { tache: "TASK", rappel: "REMINDER", decision: "DECISION" } as const;

export async function commitDecharge(projets: ProjetPropose[], taches: TachePropose[]) {
  const userId = await requireUserId();

  const existants = await prisma.project.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, name: true, status: true },
  });
  let actifs = existants.filter((p) => p.status === "ACTIVE").length;

  // Nom de projet → identifiant, pour rattacher les tâches.
  const parNom = new Map(existants.map((p) => [p.name.toLowerCase(), p.id]));

  for (const p of projets) {
    if (parNom.has(p.nom.toLowerCase())) continue; // déjà présent : on ne duplique pas

    // Règle produit : au-delà de 3 projets actifs, le suivant part en boîte à idées.
    const status = actifs < 3 ? "ACTIVE" : "IDEA";
    if (status === "ACTIVE") actifs += 1;

    const cree = await prisma.project.create({
      data: {
        userId,
        name: p.nom,
        status,
        vision: p.vision || null,
        objective: p.objectif || null,
        domain: p.domaine || null,
      },
    });
    parNom.set(p.nom.toLowerCase(), cree.id);
    await logEvent(userId, "project_created", { status, domaine: p.domaine });

    // La prochaine action devient une vraie tâche rattachée au projet.
    if (p.prochaineAction) {
      await prisma.task.create({
        data: {
          userId,
          projectId: cree.id,
          title: p.prochaineAction,
          kind: "TASK",
          priority: "ESSENTIAL",
        },
      });
      await logEvent(userId, "task_created", { kind: "TASK", source: "prochaine_action" });
    }
  }

  for (const t of taches) {
    const projectId = t.projet ? (parNom.get(t.projet.toLowerCase()) ?? null) : null;
    await prisma.task.create({
      data: { userId, projectId, title: t.titre, kind: KIND[t.kind] ?? "TASK" },
    });
    await logEvent(userId, "task_created", { kind: KIND[t.kind] ?? "TASK" });
  }

  await logEvent(userId, "braindump_completed", {
    projets: projets.length,
    taches: taches.length,
  });
  revalidatePath("/aujourdhui");
  revalidatePath("/projets");
  revalidatePath("/chemin");
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
