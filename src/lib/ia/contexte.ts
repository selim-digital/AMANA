import "server-only";
import { prisma } from "@/lib/prisma";
import { memoireDe } from "@/lib/ia/memoire";

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
  const [socle, projets, taches] = await Promise.all([
    // Le socle vient de la mémoire partagée : toutes les surfaces IA voient
    // exactement la même chose. Ici on n'ajoute que le cadrage de la porte.
    memoireDe(userId, "chat"),
    prisma.project.findMany({
      where: { userId, deletedAt: null, status: { in: ["ACTIVE", "SECONDARY"] } },
      orderBy: { order: "asc" },
      take: 6,
      select: { id: true, name: true, vision: true, updatedAt: true },
    }),
    prisma.task.findMany({
      where: { userId, deletedAt: null, status: { notIn: ["DONE"] } },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  const jours = (d: Date) => Math.floor((Date.now() - d.getTime()) / 86_400_000);
  const l: string[] = ["── Ce que tu sais de la personne ──", socle];


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
    l.push(
      `\n⚠ Cet échange porte sur l'étape « ${sujet.cle} » de son chemin. Aide-la à la formuler avec ses mots — tu peux proposer des exemples, jamais choisir à sa place. Regarde le socle ci-dessus : si cette étape est déjà renseignée, pars de l'existant pour compléter ou affiner. Ne redemande jamais ce qui y figure déjà.`,
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
