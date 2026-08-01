import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Les trois univers — l'organisation réelle du produit.
 *
 * Ils étaient jusqu'ici cachés dans un écran secondaire pendant que la
 * navigation exposait des temporalités inventées par-dessus. Ici, ils
 * redeviennent la structure : on entre dans un univers, on y agit.
 *
 * Les pastilles comptent des ÉVÉNEMENTS, pas des objets ouverts. Un compteur
 * d'objets ne redescend jamais à zéro : il cesse d'informer en une semaine et
 * installe une culpabilité de fond. Un événement, lui, apparaît quand quelque
 * chose attend vraiment, et disparaît quand on l'a vu.
 */

export type CleUnivers = "source" | "build" | "align";

export const UNIVERS = {
  source: {
    cle: "source" as const,
    nom: "La Source",
    sujet: "Ce qui fonde tes choix",
    matiere: "Conscience · Vision · Intention",
    decor: "desert" as const,
    ciel: "linear-gradient(#FBF1DE,#F0D9AE)",
  },
  build: {
    cle: "build" as const,
    nom: "Build",
    sujet: "Ce que tu construis",
    matiere: "Projets · Famille · Entreprise",
    decor: "forest" as const,
    ciel: "linear-gradient(#F4F5E6,#DCE5CB)",
  },
  align: {
    cle: "align" as const,
    nom: "Align",
    sujet: "Ce que tu transmets",
    matiere: "Impact · Transmission · Élévation",
    decor: "ocean" as const,
    ciel: "linear-gradient(#E2EEF1,#F4DFB2)",
  },
};

export const ORDRE: CleUnivers[] = ["source", "build", "align"];

/** Un événement en attente : ce qui fait monter une pastille. */
export type Evenement = {
  univers: CleUnivers;
  /** Ce qui l'a déclenché — sert aussi à expliquer l'arrivée. */
  motif: string;
  href: string;
};

const JOUR = 86_400_000;
const jours = (d: Date) => Math.floor((Date.now() - d.getTime()) / JOUR);

function trimestre(d = new Date()) {
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

/**
 * Ce qui attend la personne, univers par univers.
 * Tout est déduit de faits datés — jamais d'un simple décompte.
 */
export async function evenements(userId: string): Promise<Evenement[]> {
  const debutJour = new Date(new Date().setHours(0, 0, 0, 0));

  const [profil, valeurs, objectifs, projets, taches, signaux, plongee, notifs] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId }, select: { vision: true, domaines: true } }),
      prisma.value.count({ where: { userId } }),
      prisma.annualGoal.count({ where: { userId, year: new Date().getFullYear() } }),
      prisma.project.findMany({
        where: { userId, deletedAt: null, status: { in: ["ACTIVE", "SECONDARY"] } },
        select: {
          id: true,
          name: true,
          updatedAt: true,
          okrs: { where: { period: trimestre() }, select: { id: true } },
        },
      }),
      prisma.task.findMany({
        where: { userId, deletedAt: null, status: { notIn: ["DONE"] } },
        select: { id: true, title: true, createdAt: true, intentionDu: true },
      }),
      prisma.signal.count({
        where: { session: { userId }, verdict: "EN_ATTENTE" },
      }),
      prisma.deepDiveSession.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, synthese: true, updatedAt: true, signaux: { select: { id: true } } },
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

  const e: Evenement[] = [];

  // ─────────────── La Source : ce qui fonde ───────────────
  if (!profil?.vision) {
    e.push({
      univers: "source",
      motif: "Ta vision n'est pas encore formulée",
      href: `/conversation?etape=${encodeURIComponent("Ta vision")}`,
    });
  }
  if (valeurs < 3) {
    e.push({
      univers: "source",
      motif: `Il te manque ${3 - valeurs} valeur${3 - valeurs > 1 ? "s" : ""} cardinale${3 - valeurs > 1 ? "s" : ""}`,
      href: `/conversation?etape=${encodeURIComponent("Tes valeurs")}`,
    });
  }
  if (signaux > 0) {
    e.push({
      univers: "source",
      motif: `${signaux} hypothèse${signaux > 1 ? "s" : ""} de plongée attend${signaux > 1 ? "ent" : ""} ton verdict`,
      href: "/deepdive",
    });
  }
  // Une plongée tranchée mais jamais analysée : la restitution attend.
  if (plongee && !plongee.synthese && plongee.signaux.length >= 2 && signaux === 0) {
    e.push({
      univers: "source",
      motif: "Ta plongée attend son analyse finale",
      href: "/deepdive",
    });
  }
  // Trois mois sans plonger : le moment de reprendre du fond.
  if (!plongee || jours(plongee.updatedAt) > 90) {
    e.push({
      univers: "source",
      motif: plongee ? "Ta dernière plongée date de plus de trois mois" : "Tu n'as jamais plongé",
      href: "/deepdive",
    });
  }

  // ─────────────── Build : ce qui se construit ───────────────
  if (!taches.some((t) => t.intentionDu && t.intentionDu >= debutJour)) {
    e.push({
      univers: "build",
      motif: "Ton intention du jour n'est pas posée",
      href: "/aujourdhui",
    });
  }
  for (const p of projets.filter((x) => !x.okrs.length)) {
    e.push({
      univers: "build",
      motif: `« ${p.name} » avance sans cap trimestriel`,
      href: "/semaine",
    });
  }
  for (const t of taches.filter((x) => jours(x.createdAt) >= 5)) {
    e.push({
      univers: "build",
      motif: `« ${t.title} » attend depuis ${jours(t.createdAt)} jours`,
      href: `/conversation?mode=sonde&tache=${t.id}`,
    });
  }
  for (const p of projets.filter((x) => jours(x.updatedAt) > 21)) {
    e.push({
      univers: "build",
      motif: `« ${p.name} » n'a pas bougé depuis ${jours(p.updatedAt)} jours`,
      href: `/conversation?projet=${p.id}`,
    });
  }
  if (!objectifs) {
    e.push({
      univers: "build",
      motif: "Tes objectifs de l'année ne sont pas posés",
      href: `/conversation?etape=${encodeURIComponent("Objectifs de l'année")}`,
    });
  }

  // ─────────────── Align : ce qui se transmet ───────────────
  const faitesAujourdhui = await prisma.task.count({
    where: { userId, deletedAt: null, status: "DONE", updatedAt: { gte: debutJour } },
  });
  if (faitesAujourdhui > 0 && new Date().getHours() >= 18) {
    e.push({
      univers: "align",
      motif: `${faitesAujourdhui} action${faitesAujourdhui > 1 ? "s" : ""} accomplie${faitesAujourdhui > 1 ? "s" : ""} aujourd'hui — à clore`,
      href: "/conversation?mode=bilan",
    });
  }
  if (new Date().getDay() === 0) {
    e.push({
      univers: "align",
      motif: "C'est dimanche : le bilan de la semaine t'attend",
      href: "/conversation?mode=bilan-semaine",
    });
  }
  if (notifs > 0) {
    e.push({
      univers: "align",
      motif: `${notifs} message${notifs > 1 ? "s" : ""} d'AMANA non lu${notifs > 1 ? "s" : ""}`,
      href: "/aujourdhui",
    });
  }

  return e;
}

/** Les compteurs par univers, pour les pastilles. */
export function pastilles(evts: Evenement[]): Record<CleUnivers, number> {
  const c: Record<CleUnivers, number> = { source: 0, build: 0, align: 0 };
  for (const x of evts) c[x.univers] += 1;
  return c;
}

/**
 * Où atterrir.
 *
 * Build d'abord — c'est l'exécution, et c'est là que la vie quotidienne se
 * joue. On ne dévie vers un autre univers que s'il porte nettement plus de
 * choses en attente : sinon on ballotterait la personne d'un monde à l'autre
 * d'une ouverture à la suivante.
 */
export function universDArrivee(evts: Evenement[]): CleUnivers {
  const c = pastilles(evts);
  if (c.source >= c.build + 2) return "source";
  if (c.align >= c.build + 2) return "align";
  return "build";
}
