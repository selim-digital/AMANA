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
  const [user, profile, notifications, objectifsAnnee, tasks, projects, activeCount, openCount, doneCount] =
    await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.notification.findMany({ where: { userId, readAt: null }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.annualGoal.findMany({
      where: { userId, year: new Date().getFullYear() },
      orderBy: { order: "asc" },
    }),
    // Les actions faites AUJOURD'HUI restent affichées : on doit pouvoir
    // revenir sur un clic accidentel, et voir ce qu'on a accompli.
    prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { status: { notIn: ["DONE"] } },
          { status: "DONE", updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        ],
      },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
      take: 6,
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

  // Un nudge : une seule invitation, choisie selon l'état réel. Jamais culpabilisante.
  const heure = new Date().getHours();
  const restantes = tasks.filter((t) => t.status !== "DONE");
  let nudge: { texte: string; cta: string; href: string };

  if (openCount === 0 && doneCount === 0) {
    nudge = {
      texte: "Ta journée est encore vide. Dépose ce que tu as en tête — AMANA rangera.",
      cta: "Vider ma tête",
      href: "/deposer",
    };
  } else if (restantes.length === 0) {
    nudge = {
      texte: "Tout ce qui comptait est fait. C'est le moment de clore la journée.",
      cta: "Faire mon bilan",
      href: "/conversation?mode=bilan",
    };
  } else if (heure >= 18) {
    nudge = {
      texte: "La journée se termine. Deux minutes pour la clore, et demain sera plus clair.",
      cta: "Clore ma journée",
      href: "/conversation?mode=bilan",
    };
  } else if (activeCount >= 3) {
    nudge = {
      texte: "Trois projets actifs, c'est le maximum. Avance sur l'essentiel avant d'en ouvrir un autre.",
      cta: "Voir mes projets",
      href: "/projets",
    };
  } else {
    nudge = {
      texte: "Commence par la première. Le reste suivra plus facilement.",
      cta: "En parler à AMANA",
      href: "/conversation",
    };
  }

  return {
    user,
    profile,
    tasks,
    projects,
    activeCount,
    objectifsAnnee,
    notifications,
    indices: { clarte, action, alignement },
    nudge,
  };
}

/** Projets groupés par statut (pour /projets et /chemin). */
export async function getProjectsByStatus(userId: string) {
  // L'ordre choisi par l'utilisateur (glisser-déposer) prime sur la date.
  return prisma.project.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    include: {
      // Les échanges passés doivent être retrouvables depuis le projet lui-même.
      conversations: { orderBy: { updatedAt: "desc" }, take: 1, select: { id: true } },
      _count: { select: { conversations: true } },
    },
  });
}

export async function getTasks(userId: string) {
  return prisma.task.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}
