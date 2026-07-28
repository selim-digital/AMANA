import "server-only";
import { prisma } from "@/lib/prisma";

const DAY = 24 * 60 * 60 * 1000;
const since = (days: number) => new Date(Date.now() - days * DAY);

/** Compte les utilisateurs distincts ayant émis au moins un événement d'un type donné. */
async function usersWithEvent(type: string) {
  const rows = await prisma.event.findMany({
    where: { type },
    distinct: ["userId"],
    select: { userId: true },
  });
  return rows.length;
}

export async function getAdminMetrics() {
  const [
    totalUsers,
    new7,
    new30,
    withProfile,
    googleAccounts,
    withPassword,
    activeProjects,
    totalProjects,
    tasksDone,
    tasksOpen,
    active1,
    active7,
    active30,
    profiles,
    recentUsers,
    recentEvents,
    eventCounts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since(7) } } }),
    prisma.user.count({ where: { createdAt: { gte: since(30) } } }),
    prisma.profile.count(),
    prisma.account.findMany({ where: { provider: "google" }, distinct: ["userId"], select: { userId: true } }),
    prisma.user.count({ where: { hashedPassword: { not: null } } }),
    prisma.project.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.task.count({ where: { status: "DONE", deletedAt: null } }),
    prisma.task.count({ where: { status: { not: "DONE" }, deletedAt: null } }),
    prisma.event.findMany({ where: { at: { gte: since(1) } }, distinct: ["userId"], select: { userId: true } }),
    prisma.event.findMany({ where: { at: { gte: since(7) } }, distinct: ["userId"], select: { userId: true } }),
    prisma.event.findMany({ where: { at: { gte: since(30) } }, distinct: ["userId"], select: { userId: true } }),
    prisma.profile.findMany({ select: { domaines: true, style: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
    }),
    prisma.event.findMany({ orderBy: { at: "desc" }, take: 15, select: { type: true, at: true } }),
    prisma.event.groupBy({ by: ["type"], _count: { type: true }, orderBy: { _count: { type: "desc" } } }),
  ]);

  // Entonnoir d'activation : chaque étape est un sous-ensemble de la précédente.
  const [didBraindump, didTask] = await Promise.all([
    usersWithEvent("braindump_completed"),
    usersWithEvent("task_done"),
  ]);

  // Domaines de vie les plus choisis (signal produit).
  const domaines = new Map<string, number>();
  const styles = new Map<string, number>();
  for (const p of profiles) {
    for (const d of p.domaines) domaines.set(d, (domaines.get(d) ?? 0) + 1);
    if (p.style) styles.set(p.style, (styles.get(p.style) ?? 0) + 1);
  }
  const top = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));

  const googleUsers = googleAccounts.length;

  return {
    acquisition: {
      totalUsers,
      new7,
      new30,
      google: googleUsers,
      password: withPassword,
      // Ni compte Google, ni mot de passe → entré par lien de connexion.
      magicLink: Math.max(0, totalUsers - googleUsers - withPassword),
    },
    funnel: [
      { label: "Inscription", value: totalUsers },
      { label: "Onboarding terminé", value: withProfile },
      { label: "1ʳᵉ décharge", value: didBraindump },
      { label: "1ʳᵉ action terminée", value: didTask },
    ],
    engagement: {
      active1: active1.length,
      active7: active7.length,
      active30: active30.length,
      activeProjects,
      totalProjects,
      tasksDone,
      tasksOpen,
      projetsParUtilisateur: totalUsers ? +(activeProjects / totalUsers).toFixed(1) : 0,
    },
    profil: { domaines: top(domaines), styles: top(styles) },
    recentUsers,
    recentEvents,
    eventCounts: eventCounts.map((e) => ({ type: e.type, count: e._count.type })),
  };
}

export type AdminMetrics = Awaited<ReturnType<typeof getAdminMetrics>>;
