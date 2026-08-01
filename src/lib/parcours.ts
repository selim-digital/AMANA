import "server-only";
import { prisma } from "@/lib/prisma";
import type { CleUnivers } from "@/lib/univers";

/**
 * Les parcours de progression — un par univers.
 *
 * Trois principes tenus par la structure elle-même :
 *
 * 1. Un SOCLE court et fixe (trois paliers), identique pour tout le monde. On
 *    voit d'emblée où l'on va : sans horizon visible, il n'y a pas de sentiment
 *    de progression.
 * 2. Des BRANCHES qui n'apparaissent qu'une fois le socle posé, et seulement si
 *    la situation les rend pertinentes. Ce qui ne sert pas ne s'affiche pas.
 * 3. Aucun palier ne se déclare : chacun porte une PREUVE calculée sur les
 *    données réelles. Un palier qu'on s'attribue soi-même n'est qu'un badge, et
 *    un badge se méprise vite.
 *
 * Les trois parcours avancent en parallèle. La vie n'avance pas par chapitres,
 * et bloquer l'exécution derrière l'introspection ferait fuir avant d'avoir
 * commencé.
 */

export type Palier = {
  id: string;
  titre: string;
  /** Pourquoi ce palier existe — une phrase, jamais un cours. */
  intention: string;
  /** Ce qui l'atteste, dit à la personne pour qu'elle sache ce qui est mesuré. */
  preuve: string;
  /** Le geste qui le fait avancer. */
  action: string;
  href: string;
};

export type PalierVu = Palier & {
  acquis: boolean;
  /** Le palier sur lequel on travaille en ce moment. Un seul par parcours. */
  courant: boolean;
  branche: boolean;
  /** Où en est la preuve, quand elle se compte (« 2 sur 3 »). */
  avancement: string | null;
};

export type Parcours = {
  socle: PalierVu[];
  branches: PalierVu[];
  /** Paliers du socle acquis, sur trois. */
  acquis: number;
};

// ─────────────────────────── Les paliers ───────────────────────────

const SOCLE: Record<CleUnivers, Palier[]> = {
  source: [
    {
      id: "histoire",
      titre: "Te raconter",
      intention: "Rien ne peut t'être proposé de juste tant qu'on ne sait pas d'où tu parles.",
      preuve: "Ta situation est écrite.",
      action: "Raconter d'où tu pars",
      href: "/conversation?etape=" + encodeURIComponent("Ton histoire"),
    },
    {
      id: "valeurs",
      titre: "Nommer ce qui te tient",
      intention:
        "Des valeurs nommées permettent d'arbitrer. Sans elles, chaque décision se rejoue à zéro.",
      preuve: "Trois valeurs enregistrées.",
      action: "Poser tes valeurs",
      href: "/conversation?etape=" + encodeURIComponent("Tes valeurs"),
    },
    {
      id: "vision",
      titre: "Formuler où tu vas",
      intention: "Une direction écrite se relit les jours où l'on ne la voit plus.",
      preuve: "Ta vision est écrite.",
      action: "Écrire ta vision",
      href: "/conversation?etape=" + encodeURIComponent("Ta vision"),
    },
  ],
  build: [
    {
      id: "decharge",
      titre: "Vider ta tête",
      intention: "Ce qu'on porte sans l'écrire occupe de la place et n'avance pas.",
      preuve: "Au moins un projet structuré.",
      action: "Déposer ce que tu as en tête",
      href: "/deposer",
    },
    {
      id: "focus",
      titre: "Choisir tes trois",
      intention:
        "Trois projets actifs au maximum. Au-delà, on ne mène plus : on entretient.",
      preuve: "Entre un et trois projets actifs, pas plus.",
      action: "Arbitrer tes projets",
      href: "/aujourdhui?u=build",
    },
    {
      id: "cap",
      titre: "Poser un cap mesurable",
      intention: "Un objectif qui ne se vérifie pas reste une intention.",
      preuve: "Un cap trimestriel avec au moins deux résultats clés.",
      action: "Poser ton cap",
      href: "/semaine",
    },
  ],
  align: [
    {
      id: "objectifs",
      titre: "Nommer ton année",
      intention: "Trois objectifs annuels donnent un critère pour dire non au reste.",
      preuve: "Trois objectifs de l'année enregistrés.",
      action: "Poser tes trois objectifs",
      href: "/conversation?etape=" + encodeURIComponent("Objectifs de l'année"),
    },
    {
      id: "constance",
      titre: "Terminer ce que tu commences",
      intention: "La régularité produit plus que l'intensité. Trois jours valent mieux qu'un sprint.",
      preuve: "Une action menée à son terme sur trois jours différents cette semaine.",
      action: "Voir ce qui reste aujourd'hui",
      href: "/aujourdhui?u=build",
    },
    {
      id: "recul",
      titre: "Prendre du recul",
      intention:
        "On ne voit pas ses propres angles morts depuis l'intérieur de l'exécution.",
      preuve: "Une plongée terminée et analysée.",
      action: "Plonger",
      href: "/deepdive",
    },
  ],
};

/** Les branches ne s'ouvrent qu'une fois le socle posé, et si elles servent. */
const BRANCHES: Record<CleUnivers, (Palier & { pertinente: (e: Mesures) => boolean })[]> = {
  source: [
    {
      id: "connaissance",
      titre: "Te connaître plus finement",
      intention:
        "Ta manière de fonctionner ajuste le ton, le niveau de challenge et le rythme qu'on te propose.",
      preuve: "Les trois lectures de profil complétées.",
      action: "Répondre aux questions",
      href: "/aujourdhui?u=source",
      pertinente: () => true,
    },
    {
      id: "mission",
      titre: "Écrire ta mission",
      intention:
        "La vision dit où tu vas ; la mission dit ce que tu sers. Elle tient en une phrase.",
      preuve: "Ta mission est écrite.",
      action: "Formuler ta mission",
      href: "/conversation?etape=" + encodeURIComponent("Ta mission"),
      pertinente: (e) => e.valeurs >= 3 && !!e.vision,
    },
  ],
  build: [
    {
      id: "rythme",
      titre: "Tenir le rythme hebdomadaire",
      intention:
        "Un cap qu'on ne pointe pas dérive sans qu'on s'en aperçoive. Trois semaines suffisent à le sentir.",
      preuve: "Tes résultats clés pointés trois semaines de suite.",
      action: "Pointer cette semaine",
      href: "/semaine",
      pertinente: (e) => e.okrs > 0,
    },
    {
      id: "quotidien",
      titre: "Entrer en action chaque jour",
      intention:
        "Une intention posée le matin change ce qui se fait dans la journée. C'est le geste le plus rentable.",
      preuve: "Une intention posée cinq jours sur les quatorze derniers.",
      action: "Poser l'intention du jour",
      href: "/aujourdhui?u=build",
      pertinente: () => true,
    },
    {
      id: "elagage",
      titre: "Trancher ce qui dort",
      intention:
        "Un projet actif sans mouvement depuis trois semaines n'est pas actif : il occupe une place.",
      preuve: "Aucun projet actif sans mouvement depuis plus de trois semaines.",
      action: "Arbitrer ce qui dort",
      href: "/semaine",
      pertinente: (e) => e.dormants > 0,
    },
  ],
  align: [
    {
      id: "pourquoi",
      titre: "Dire pourquoi chacun compte",
      intention:
        "Un objectif sans raison écrite se laisse abandonner sans qu'on sache ce qu'on perd.",
      preuve: "Chacun de tes objectifs d'année porte sa raison.",
      action: "Compléter tes raisons",
      href: "/aujourdhui?u=align",
      pertinente: (e) => e.objectifs > 0,
    },
    {
      id: "profondeur",
      titre: "Replonger",
      intention:
        "L'écart entre ce que tu reconnaissais il y a trois mois et aujourd'hui vaut plus que chaque plongée isolée.",
      preuve: "Deux plongées terminées.",
      action: "Ouvrir une nouvelle plongée",
      href: "/deepdive",
      pertinente: (e) => e.plongees >= 1,
    },
  ],
};

// ─────────────────────────── Les preuves ───────────────────────────

/** Tout ce qu'il faut mesurer, lu en une passe. */
type Mesures = {
  situation: boolean;
  vision: boolean;
  mission: boolean;
  valeurs: number;
  projets: number;
  actifs: number;
  okrs: number;
  krPointes: number;
  semainesPointees: number;
  objectifs: number;
  objectifsAvecPourquoi: number;
  joursActifs: number;
  intentions14j: number;
  dormants: number;
  plongees: number;
  profilComplet: boolean;
};

const JOUR = 86_400_000;

async function mesurer(userId: string, profilComplet: boolean): Promise<Mesures> {
  const il7j = new Date(Date.now() - 7 * JOUR);
  const il14j = new Date(Date.now() - 14 * JOUR);
  const il21j = new Date(Date.now() - 21 * JOUR);
  const d = new Date();
  const periode = `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;

  const [
    profil,
    valeurs,
    projets,
    actifs,
    okrs,
    checks,
    objectifs,
    faites,
    intentions,
    dormants,
    plongees,
  ] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { situation: true, vision: true, mission: true },
    }),
    prisma.value.count({ where: { userId } }),
    prisma.project.count({ where: { userId, deletedAt: null, status: { not: "ARCHIVED" } } }),
    prisma.project.count({ where: { userId, deletedAt: null, status: "ACTIVE" } }),
    prisma.okr.findMany({
      where: { project: { userId, deletedAt: null }, period: periode },
      select: { keyResults: { select: { id: true } } },
    }),
    prisma.weeklyCheck.findMany({
      where: { keyResult: { okr: { project: { userId } } } },
      select: { weekOf: true },
      take: 60,
    }),
    prisma.annualGoal.findMany({
      where: { userId, year: d.getFullYear() },
      select: { why: true },
    }),
    prisma.task.findMany({
      where: { userId, deletedAt: null, status: "DONE", updatedAt: { gte: il7j } },
      select: { updatedAt: true },
    }),
    prisma.task.count({
      where: { userId, deletedAt: null, intentionDu: { gte: il14j } },
    }),
    prisma.project.count({
      where: { userId, deletedAt: null, status: "ACTIVE", updatedAt: { lt: il21j } },
    }),
    prisma.deepDiveSession.count({ where: { userId, status: "close", synthese: { not: null } } }),
  ]);

  // Un cap ne compte que s'il porte au moins deux résultats vérifiables.
  const okrsSolides = okrs.filter((o) => o.keyResults.length >= 2).length;

  // Des jours DIFFÉRENTS, pas un total : cinq actions le même jour ne font
  // pas une régularité.
  const joursActifs = new Set(faites.map((t) => t.updatedAt.toISOString().slice(0, 10))).size;
  const semainesPointees = new Set(checks.map((c) => c.weekOf.toISOString().slice(0, 10))).size;

  return {
    situation: !!profil?.situation,
    vision: !!profil?.vision,
    mission: !!profil?.mission,
    valeurs,
    projets,
    actifs,
    okrs: okrsSolides,
    krPointes: checks.length,
    semainesPointees,
    objectifs: objectifs.length,
    objectifsAvecPourquoi: objectifs.filter((o) => o.why?.trim()).length,
    joursActifs,
    intentions14j: intentions,
    dormants,
    plongees,
    profilComplet,
  };
}

/** Chaque palier avec sa preuve, et son avancement quand il se compte. */
const PREUVES: Record<string, (e: Mesures) => { ok: boolean; avancement: string | null }> = {
  // La Source
  histoire: (e) => ({ ok: e.situation, avancement: null }),
  valeurs: (e) => ({ ok: e.valeurs >= 3, avancement: `${Math.min(e.valeurs, 3)} sur 3` }),
  vision: (e) => ({ ok: e.vision, avancement: null }),
  connaissance: (e) => ({ ok: e.profilComplet, avancement: null }),
  mission: (e) => ({ ok: e.mission, avancement: null }),
  // Build
  decharge: (e) => ({ ok: e.projets >= 1, avancement: null }),
  focus: (e) => ({
    ok: e.actifs >= 1 && e.actifs <= 3,
    avancement: `${e.actifs} actif${e.actifs > 1 ? "s" : ""}`,
  }),
  cap: (e) => ({ ok: e.okrs >= 1, avancement: null }),
  rythme: (e) => ({ ok: e.semainesPointees >= 3, avancement: `${Math.min(e.semainesPointees, 3)} sur 3` }),
  quotidien: (e) => ({
    ok: e.intentions14j >= 5,
    avancement: `${Math.min(e.intentions14j, 5)} sur 5`,
  }),
  elagage: (e) => ({ ok: e.dormants === 0, avancement: `${e.dormants} en sommeil` }),
  // Align
  objectifs: (e) => ({ ok: e.objectifs >= 3, avancement: `${Math.min(e.objectifs, 3)} sur 3` }),
  constance: (e) => ({ ok: e.joursActifs >= 3, avancement: `${Math.min(e.joursActifs, 3)} sur 3` }),
  recul: (e) => ({ ok: e.plongees >= 1, avancement: null }),
  pourquoi: (e) => ({
    ok: e.objectifs > 0 && e.objectifsAvecPourquoi === e.objectifs,
    avancement: `${e.objectifsAvecPourquoi} sur ${e.objectifs || 3}`,
  }),
  profondeur: (e) => ({ ok: e.plongees >= 2, avancement: `${Math.min(e.plongees, 2)} sur 2` }),
};

/**
 * L'état des trois parcours.
 *
 * Le socle d'abord, dans l'ordre : le premier palier non acquis est le palier
 * courant. Les branches ne s'ouvrent qu'ensuite, et seulement celles que la
 * situation rend pertinentes.
 */
export async function etatParcours(
  userId: string,
  profilComplet: boolean,
): Promise<Record<CleUnivers, Parcours>> {
  const m = await mesurer(userId, profilComplet);

  const construire = (cle: CleUnivers): Parcours => {
    let courantPose = false;

    const socle: PalierVu[] = SOCLE[cle].map((p) => {
      const { ok, avancement } = PREUVES[p.id]?.(m) ?? { ok: false, avancement: null };
      const courant = !ok && !courantPose;
      if (courant) courantPose = true;
      return { ...p, acquis: ok, courant, branche: false, avancement };
    });

    const acquis = socle.filter((p) => p.acquis).length;

    // Tant que le socle n'est pas posé, aucune branche : on ne disperse pas
    // quelqu'un qui n'a pas encore ses fondations.
    const branches: PalierVu[] =
      acquis < SOCLE[cle].length
        ? []
        : BRANCHES[cle]
            .filter((b) => b.pertinente(m))
            .map((b) => {
              const { ok, avancement } = PREUVES[b.id]?.(m) ?? { ok: false, avancement: null };
              const courant = !ok && !courantPose;
              if (courant) courantPose = true;
              return { ...b, acquis: ok, courant, branche: true, avancement };
            });

    return { socle, branches, acquis };
  };

  return { source: construire("source"), build: construire("build"), align: construire("align") };
}
