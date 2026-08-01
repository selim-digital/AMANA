import "server-only";
import { prisma } from "@/lib/prisma";
import { etatParcours, type PalierVu } from "@/lib/parcours";

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
      href: "/aujourdhui?u=build",
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

// ─────────────────────── Le contenu d'un univers ───────────────────────

/** Un objet de l'univers : ce qu'on y manipule. */
export type Objet = {
  id: string;
  titre: string;
  detail: string | null;
  /** « fait » : renseigné · « encours » : commencé · « vide » : à faire. */
  etat: "fait" | "encours" | "vide";
  href: string;
};

/** Une étape de la frise : le chemin propre à l'univers. */
export type EtapeFrise = {
  titre: string;
  etat: "fait" | "actuel" | "avenir";
  detail: string | null;
  href: string | null;
  preuve?: string | null;
  avancement?: string | null;
  branche?: boolean;
  action?: string | null;
};

/** Une action à mener, rattachée à l'univers. */
export type ActionVue = {
  id: string;
  titre: string;
  projet: string | null;
  age: number;
  faite: boolean;
};

export type ContenuUnivers = {
  objets: Objet[];
  etapes: EtapeFrise[];
  actions: ActionVue[];
  /** Ce qu'on manipule ici, pour intituler la rangée du haut. */
  libelleObjets: string;
};


/**
 * La frise d'un univers EST son parcours : socle puis branches.
 *
 * On ne fabrique plus une frise decorative a cote d'une progression invisible.
 * Ce qu'on voit est ce qui est mesure.
 */
function friseDepuisParcours(paliers: PalierVu[]): EtapeFrise[] {
  return paliers.map((p) => ({
    titre: p.titre,
    etat: p.acquis ? "fait" : p.courant ? "actuel" : "avenir",
    detail: p.intention,
    href: p.href,
    preuve: p.preuve,
    avancement: p.avancement,
    branche: p.branche,
    action: p.action,
  }));
}

/**
 * Ce que contient un univers : ses objets en tête, sa frise, ses actions.
 *
 * C'est le même modèle pour les trois, mais la matière change à chaque fois.
 * On ne mélange plus : ce qui relève de la fondation ne s'affiche plus au
 * milieu de ce qui relève de l'exécution.
 */
export async function contenuUnivers(
  userId: string,
  cle: CleUnivers,
  profilComplet = false,
): Promise<ContenuUnivers> {
  // La frise est le parcours : socle puis branches, avec leurs preuves.
  const parcours = (await etatParcours(userId, profilComplet))[cle];
  const frise = friseDepuisParcours([...parcours.socle, ...parcours.branches]);
  const debutJour = new Date(new Date().setHours(0, 0, 0, 0));

  // ─────────────── La Source : ce qui fonde ───────────────
  if (cle === "source") {
    const [profil, valeurs, plongee, signaux] = await Promise.all([
      prisma.profile.findUnique({ where: { userId }, select: { vision: true, situation: true } }),
      prisma.value.findMany({
        where: { userId },
        select: { label: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.deepDiveSession.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, synthese: true, updatedAt: true },
      }),
      prisma.signal.findMany({
        where: { session: { userId }, verdict: "EN_ATTENTE" },
        select: { id: true, hypothese: true, createdAt: true },
        take: 5,
      }),
    ]);

    const nb = valeurs.length;
    const constat = plongee?.synthese ? (JSON.parse(plongee.synthese).constat as string) : null;
    const etape = (cond: boolean, prec: boolean) =>
      (cond ? "fait" : prec ? "actuel" : "avenir") as EtapeFrise["etat"];

    return {
      libelleObjets: "Tes fondations",
      objets: [
        {
          id: "histoire",
          titre: "Ton histoire",
          detail: profil?.situation ?? null,
          etat: profil?.situation ? "fait" : "vide",
          href: "/conversation?etape=" + encodeURIComponent("Ton histoire"),
        },
        {
          id: "vision",
          titre: "Ta vision",
          detail: profil?.vision ?? null,
          etat: profil?.vision ? "fait" : "vide",
          href: "/conversation?etape=" + encodeURIComponent("Ta vision"),
        },
        {
          id: "valeurs",
          titre: "Tes valeurs",
          detail: nb ? valeurs.map((v) => v.label).join(" · ") : null,
          etat: nb >= 3 ? "fait" : nb ? "encours" : "vide",
          href: "/profil",
        },
        {
          id: "plongee",
          titre: "Ta plongée",
          detail: constat,
          etat: constat ? "fait" : plongee ? "encours" : "vide",
          href: "/deepdive",
        },
      ],
      etapes: frise,
      // Une hypothèse en attente est une action : elle demande un verdict.
      actions: signaux.map((s) => ({
        id: s.id,
        titre: s.hypothese,
        projet: "Plongée",
        age: jours(s.createdAt),
        faite: false,
      })),
    };
  }

  // ─────────────── Align : ce qui se transmet ───────────────
  if (cle === "align") {
    const [faites, objectifs, closes] = await Promise.all([
      prisma.task.count({
        where: { userId, deletedAt: null, status: "DONE", updatedAt: { gte: debutJour } },
      }),
      prisma.annualGoal.findMany({
        where: { userId, year: new Date().getFullYear() },
        orderBy: { order: "asc" },
        select: { label: true },
      }),
      prisma.deepDiveSession.count({ where: { userId, status: "close" } }),
    ]);

    const dimanche = new Date().getDay() === 0;
    const soir = new Date().getHours() >= 18;

    return {
      libelleObjets: "Tes bilans",
      objets: [
        {
          id: "soir",
          titre: "Bilan du soir",
          detail: faites
            ? faites + " action" + (faites > 1 ? "s" : "") + " accomplie" + (faites > 1 ? "s" : "") + " aujourd'hui"
            : "Rien de coché aujourd'hui",
          etat: soir && faites ? "encours" : "vide",
          href: "/conversation?mode=bilan",
        },
        {
          id: "semaine",
          titre: "Bilan de la semaine",
          detail: dimanche ? "C'est aujourd'hui" : "Le dimanche",
          etat: dimanche ? "encours" : "vide",
          href: "/conversation?mode=bilan-semaine",
        },
        {
          id: "annee",
          titre: "Objectifs de l'année",
          detail: objectifs.length ? objectifs.map((o) => o.label).join(" · ") : null,
          etat: objectifs.length ? "fait" : "vide",
          href: "/conversation?etape=" + encodeURIComponent("Objectifs de l'année"),
        },
        {
          id: "plongees",
          titre: "Tes plongées",
          detail: closes ? closes + " terminée" + (closes > 1 ? "s" : "") : null,
          etat: closes ? "fait" : "vide",
          href: "/deepdive",
        },
      ],
      etapes: frise,
      actions: [],
    };
  }

  // ─────────────── Build : l'exécution, le lieu le plus vivant ───────────────
  const rang = { ACTIVE: 0, SECONDARY: 1, WAITING: 2, IDEA: 3, ARCHIVED: 4 } as const;
  const libelle = {
    ACTIVE: "Actif",
    SECONDARY: "Secondaire",
    WAITING: "En attente",
    IDEA: "Idée",
    ARCHIVED: "Archivé",
  } as const;

  const [projets, taches] = await Promise.all([
    prisma.project.findMany({
      where: { userId, deletedAt: null, status: { not: "ARCHIVED" } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        status: true,
        objective: true,
        updatedAt: true,
        okrs: { where: { period: trimestre() }, select: { objective: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { status: { notIn: ["DONE"] } },
          { status: "DONE", updatedAt: { gte: debutJour } },
        ],
      },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        intentionDu: true,
        project: { select: { name: true } },
      },
    }),
  ]);

  const ordonnes = [...projets].sort((a, b) => (rang[a.status] ?? 9) - (rang[b.status] ?? 9));

  return {
    libelleObjets: "Tes projets",
    objets: ordonnes.map((p) => ({
      id: p.id,
      titre: p.name,
      detail: p.okrs[0]?.objective ?? p.objective ?? null,
      etat: p.okrs[0] ? "fait" : p.status === "ACTIVE" ? "encours" : "vide",
      href: "/conversation?projet=" + p.id,
    })),
    etapes: frise,
    // L'intention du jour est affichée à part, en tête : elle ne réapparaît pas.
    actions: taches
      .filter((t) => !(t.intentionDu && t.intentionDu >= debutJour))
      .map((t) => ({
        id: t.id,
        titre: t.title,
        projet: t.project?.name ?? null,
        age: jours(t.createdAt),
        faite: t.status === "DONE",
      })),
  };
}
