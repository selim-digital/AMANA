import "server-only";
import { prisma } from "@/lib/prisma";
import { portraitPourIA } from "@/lib/coaching/profils";

/**
 * Le contexte compact : ce que l'IA doit savoir, et rien de plus.
 * Il vit APRÈS le point de cache (donc dans un message séparé), sinon il
 * invaliderait le cache du bloc de posture à chaque changement de projet.
 */

/** Le sujet d'où l'on entre dans la conversation — c'est la « porte ». */
export type Sujet =
  | { type: "libre" }
  | { type: "projet"; id: string }
  | { type: "tache"; id: string }
  | { type: "etape"; cle: string }
  | { type: "bilan"; cadence: "soir" | "semaine" };

export function sujetDepuisParams(p: {
  projet?: string;
  tache?: string;
  etape?: string;
  mode?: string;
}): Sujet {
  if (p.projet) return { type: "projet", id: p.projet };
  if (p.tache) return { type: "tache", id: p.tache };
  if (p.etape) return { type: "etape", cle: p.etape };
  if (p.mode === "bilan") return { type: "bilan", cadence: "soir" };
  if (p.mode === "bilan-semaine") return { type: "bilan", cadence: "semaine" };
  return { type: "libre" };
}

/** Titre et amorces affichés par le chat selon la porte empruntée. */
export function cadrageClient(sujet: Sujet, nom?: string) {
  switch (sujet.type) {
    case "projet":
      return {
        titre: "À propos de ce projet",
        sousTitre: nom ?? "",
        ouverture: nom ? `Où en es-tu sur « ${nom} » ?` : "Où en es-tu sur ce projet ?",
        amorces: [
          "Je ne sais pas par quoi commencer",
          "Ça n'avance pas, aide-moi à comprendre pourquoi",
          "Aide-moi à préciser l'objectif",
        ],
      };
    case "tache":
      return {
        titre: "À propos de cette action",
        sousTitre: nom ?? "",
        ouverture: nom ? `« ${nom} » — qu'est-ce qui se passe ?` : "Qu'est-ce qui se passe ?",
        amorces: [
          "Je bloque dessus",
          "Réduis-la à dix minutes avec moi",
          "Ce n'est plus la priorité, aide-moi à trancher",
        ],
      };
    case "etape":
      return {
        titre: "Ton chemin",
        sousTitre: nom ?? "",
        ouverture: nom ? `Travaillons « ${nom} ». Par où on commence ?` : "Par où on commence ?",
        amorces: ["Je ne sais pas quoi répondre", "Donne-moi un exemple", "Pose-moi des questions"],
      };
    case "bilan":
      return {
        titre: sujet.cadence === "soir" ? "Clore la journée" : "Bilan de la semaine",
        sousTitre: "Deux minutes",
        ouverture:
          sujet.cadence === "soir"
            ? "Qu'est-ce que tu as accompli aujourd'hui, même petit ?"
            : "Regardons ta semaine. Qu'est-ce qui a avancé ?",
        amorces: ["Peu de choses, honnêtement", "Beaucoup, mais je suis fatigué", "Guide-moi"],
      };
    default:
      return {
        titre: "En parler",
        sousTitre: "AMANA connaît tes projets",
        ouverture: "De quoi as-tu besoin de parler ?",
        amorces: [
          "Je suis perdu, aide-moi à y voir clair",
          "J'ai trop de choses en tête",
          "Je bloque sur quelque chose",
        ],
      };
  }
}

/** Le nom de l'objet visé, pour l'afficher côté client. */
export async function nomDuSujet(userId: string, sujet: Sujet): Promise<string | undefined> {
  if (sujet.type === "projet") {
    const p = await prisma.project.findFirst({
      where: { id: sujet.id, userId },
      select: { name: true },
    });
    return p?.name;
  }
  if (sujet.type === "tache") {
    const t = await prisma.task.findFirst({
      where: { id: sujet.id, userId },
      select: { title: true },
    });
    return t?.title;
  }
  if (sujet.type === "etape") return sujet.cle;
  return undefined;
}

/** Le bloc de contexte injecté dans la conversation, borné et compact. */
export async function contexteCompact(userId: string, sujet: Sujet): Promise<string> {
  const [profile, projets, taches, valeurs, objectifs, echanges] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.project.findMany({
      where: { userId, deletedAt: null, status: { in: ["ACTIVE", "SECONDARY"] } },
      orderBy: { order: "asc" },
      take: 6,
      select: { id: true, name: true, objective: true, vision: true, updatedAt: true },
    }),
    prisma.task.findMany({
      where: { userId, deletedAt: null, status: { notIn: ["DONE"] } },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.value.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { label: true },
    }),
    prisma.annualGoal.findMany({
      where: { userId, year: new Date().getFullYear() },
      orderBy: { order: "asc" },
      select: { label: true, why: true },
    }),
    // La mémoire des échanges : sans elle, chaque conversation repart de zéro
    // et redemande ce qui a déjà été dit ailleurs.
    prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { title: true, updatedAt: true, project: { select: { name: true } } },
    }),
  ]);

  const l: string[] = ["── Ce que tu sais de la personne ──"];

  const portrait = portraitPourIA({
    disc: (profile?.disc as Record<string, string>) ?? {},
    wpmot: (profile?.wpmot as Record<string, string>) ?? {},
    ego: (profile?.ego as Record<string, string>) ?? {},
  });
  if (portrait) {
    l.push(
      `Sa manière de fonctionner (hypothèses déduites de ses réponses — ne la lui récite JAMAIS, ne la nomme pas ; sers-t'en pour ajuster ton ton et ton niveau de challenge) :\n${portrait}`,
    );
  }
  if (profile?.vision) l.push(`Sa vision : ${profile.vision}`);
  if (valeurs.length) {
    l.push(
      `Ses valeurs, déjà enregistrées : ${valeurs.map((v) => v.label).join(", ")}. Elles sont posées — ne les redemande pas, appuie-toi dessus.`,
    );
  }
  if (objectifs.length) {
    l.push(
      `Ses objectifs pour ${new Date().getFullYear()} :\n${objectifs
        .map((o) => `- ${o.label}${o.why ? ` (parce que : ${o.why})` : ""}`)
        .join("\n")}`,
    );
  }
  if (profile?.domaines?.length) l.push(`Ses domaines : ${profile.domaines.join(", ")}`);
  if (profile?.style) l.push(`Accompagnement souhaité : ${profile.style}`);

  l.push(
    projets.length
      ? `Ses projets :\n${projets
          .map((p) => `- ${p.name}${p.objective ? ` (objectif : ${p.objective})` : ""}`)
          .join("\n")}`
      : "Elle n'a pas encore de projet actif.",
  );

  const jours = (d: Date) => Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (taches.length) {
    l.push(
      `Ses actions en attente :\n${taches
        .map((t) => {
          const j = jours(t.createdAt);
          return `- ${t.title}${j >= 5 ? ` (en attente depuis ${j} jours)` : ""}`;
        })
        .join("\n")}`,
    );
  }

  // Les échanges précédents : une conversation n'est pas une île.
  if (echanges.length > 1) {
    const quand = (d: Date) => {
      const j = jours(d);
      return j === 0 ? "aujourd'hui" : j === 1 ? "hier" : `il y a ${j} jours`;
    };
    l.push(
      `Vos échanges précédents (n'y reviens pas si ce n'est pas utile, mais sache qu'ils ont eu lieu) :\n${echanges
        .slice(1)
        .map((c) => `- « ${c.title} »${c.project ? ` — projet ${c.project.name}` : ""}, ${quand(c.updatedAt)}`)
        .join("\n")}`,
    );
  }

  // Le cadrage propre à la porte empruntée.
  if (sujet.type === "projet") {
    const p = projets.find((x) => x.id === sujet.id);
    l.push(
      `\n⚠ Cet échange porte précisément sur le projet « ${p?.name ?? "sélectionné"} »${
        p?.vision ? ` — vision : ${p.vision}` : ""
      }. Reste sur ce sujet sauf si la personne change d'elle-même. Vise une sortie concrète en peu de messages.`,
    );
  } else if (sujet.type === "tache") {
    const t = taches.find((x) => x.id === sujet.id);
    const j = t ? jours(t.createdAt) : 0;
    l.push(
      `\n⚠ Cet échange porte sur UNE action : « ${t?.title ?? "sélectionnée"} »${
        j >= 3 ? ` — en attente depuis ${j} jours` : ""
      }. Trois issues possibles : la réduire à dix minutes, la dater, ou reconnaître qu'elle n'est plus prioritaire. Propose ces trois portes, laisse-la choisir. Cinq messages maximum.`,
    );
  } else if (sujet.type === "etape") {
    // Une étape déjà travaillée ne se reprend pas de zéro : on l'affine.
    const cle = sujet.cle.toLowerCase();
    const dejaFait = cle.includes("valeur")
      ? valeurs.length
        ? `Elle a déjà posé ${valeurs.length} valeur(s) : ${valeurs.map((v) => v.label).join(", ")}. Pars de là — complète ou affine, ne recommence pas.`
        : ""
      : cle.includes("objectif")
        ? objectifs.length
          ? `Ses objectifs de l'année sont déjà posés : ${objectifs.map((o) => o.label).join(", ")}. Pars de là.`
          : ""
        : "";
    l.push(
      `\n⚠ Cet échange porte sur l'étape « ${sujet.cle} » de son chemin. Aide-la à la formuler avec ses mots — tu peux proposer des exemples, jamais choisir à sa place.${
        dejaFait ? ` ${dejaFait}` : ""
      }`,
    );
  } else if (sujet.type === "bilan") {
    l.push(
      sujet.cadence === "soir"
        ? `\n⚠ C'est le bilan du soir. Quatre temps, courts, dans cet ordre : ce qui a été accompli (même minuscule) · ce qui a été appris · ce qui est à ajuster · le lâcher-prise (« est-ce que tu portes uniquement ce qui dépend de toi ? »). Ne culpabilise jamais une journée creuse. Termine par une intention pour demain, pas par une liste de tâches.`
        : `\n⚠ C'est le bilan de la semaine : accomplissements, apprentissages, blocages, puis les priorités de la semaine à venir. Tu peux proposer UNE hypothèse sur un schéma que tu observes (« à toi de me dire si je lis juste »).`,
    );
  }

  l.push(
    "\nNomme ses projets, relie ce qu'elle dit à ce qu'elle porte déjà. N'invente jamais un projet absent de cette liste.",
  );
  return l.join("\n");
}
