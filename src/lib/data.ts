import "server-only";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/** Session courante ou null. */
export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function getProfile(userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}

/** Données du tableau de bord : priorités du jour + projets actifs + indices. */
export async function getDashboard(userId: string) {
  const [user, profile, tasks, projects, activeCount, openCount, doneCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.task.findMany({
      where: { userId, deletedAt: null, status: { notIn: ["DONE"] } },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      take: 3,
    }),
    prisma.project.findMany({
      where: { userId, deletedAt: null, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.count({ where: { userId, deletedAt: null, status: "ACTIVE" } }),
    prisma.task.count({ where: { userId, deletedAt: null, status: { notIn: ["DONE"] } } }),
    prisma.task.count({ where: { userId, deletedAt: null, status: "DONE" } }),
  ]);

  // Indices v1 (proxies honnêtes calculés depuis les données réelles).
  const total = openCount + doneCount;
  const action = total ? Math.round((doneCount / total) * 100) : 0;
  const clarte = Math.min(100, activeCount * 25 + (profile?.vision ? 25 : 0));
  const alignement = Math.min(100, (profile?.domaines?.length ?? 0) * 20);

  return { user, profile, tasks, projects, activeCount, indices: { clarte, action, alignement } };
}

/** Projets groupés par statut (pour /projets et /chemin). */
export async function getProjectsByStatus(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
  return projects;
}

export async function getTasks(userId: string) {
  return prisma.task.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}
