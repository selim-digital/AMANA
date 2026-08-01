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
  | { type: "cap"; id: string }
  | { type: "sonde"; id?: string }
  | { type: "blocage" }
  | { type: "bilan"; cadence: "soir" | "semaine" };

export function sujetDepuisParams(p: {
  projet?: string;
  tache?: string;
  etape?: string;
  mode?: string;
}): Sujet {
  // Le mode se teste AVANT le projet : « poser un cap » est plus précis que
  // « parler du projet », et les deux portent le même paramètre `projet`.
  if (p.mode === "cap" && p.projet) return { type: "cap", id: p.projet };
  if (p.mode === "sonde") return { type: "sonde", id: p.tache };
  if (p.mode === "blocage") return { type: "blocage" };
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
    case "cap":
      return {
        titre: "Poser ton cap",
        sousTitre: nom ?? "Ce trimestre",
        ouverture: nom
          ? `Dans trois mois, qu'est-ce qui aura changé sur « ${nom} » ?`
          : "Dans trois mois, qu'est-ce qui aura changé ?",
        amorces: [
          "Je ne sais pas quoi viser",
          "Reprends ta proposition, je l'ajuste",
          "Pose-moi des questions",
        ],
      };
    case "blocage":
      return {
        titre: "Mon blocage actuel",
        sousTitre: "Ce qui revient",
        ouverture:
          "Regardons ce qui te freine en ce moment — pas une tâche, le schéma en dessous.",
        amorces: [
          "Je repousse toujours les mêmes choses",
          "J'avance partout sauf là où ça compte",
          "Je ne sais pas ce qui me bloque",
        ],
      };
    case "sonde":
      return {
        titre: "Coup de sonde",
        sousTitre: nom ?? "Ce qui bloque",
        ouverture: nom
          ? `« ${nom} » ne bouge pas. Regardons pourquoi — sans te juger.`
          : "Qu'est-ce qui ne bouge pas ?",
        amorces: [
          "Je ne sais pas pourquoi je n'y arrive pas",
          "J'y pense tout le temps mais je ne fais rien",
          "Ça m'ennuie profondément",
        ],
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
  if (sujet.type === "cap") {
    const p = await prisma.project.findFirst({
      where: { id: sujet.id, userId },
      select: { name: true },
    });
    return p?.name;
  }
  if (sujet.type === "sonde" && sujet.id) {
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
  } else if (sujet.type === "cap") {
    const p = projets.find((x) => x.id === sujet.id);
    l.push(
      `
⚠ Elle vient poser le CAP DU TRIMESTRE de « ${p?.name ?? "son projet"} »${
        p?.vision ? ` — vision : ${p.vision}` : ""
      }. Objectif : sortir avec un objectif de trimestre et deux à trois résultats clés mesurables, puis les enregistrer avec « definir_cap ».

Un objectif se formule en RÉSULTAT (« avoir X »), jamais en activité (« travailler sur X »). Un résultat clé se vérifie : un nombre, une date, un état binaire.

Trois questions maximum avant de proposer une formulation complète qu'elle n'aura qu'à corriger — remplir un cap au clavier décourage, c'est pour ça qu'on en arrive là. Dis-lui qu'elle peut te répondre à l'oral en touchant le micro : c'est plus rapide.`,
    );
  } else if (sujet.type === "sonde") {
    const t = sujet.id ? taches.find((x) => x.id === sujet.id) : undefined;
    const j = t ? jours(t.createdAt) : 0;
    l.push(
      `\n⚠ C'est un COUP DE SONDE : une plongée courte, ciblée sur un blocage${
        t ? ` — « ${t.title} »${j >= 3 ? `, en attente depuis ${j} jours` : ""}` : ""
      }. Ce n'est pas la grande plongée : on ne descend pas quatre niveaux, on lève un seul caillou.

Déroulé, cinq messages maximum :
1. Nomme le fait, sans commentaire : depuis quand, combien de fois reportée.
2. Pose UNE hypothèse sur la nature du blocage — et une seule à la fois. Les nature possibles : la tâche est floue (on ne sait pas ce que « fini » veut dire), elle est trop grosse, elle dépend de quelqu'un d'autre, elle porte un enjeu qui dépasse la tâche, ou elle n'a en réalité plus d'importance. Termine par « à toi de me dire si je lis juste ».
3. Accepte son verdict sans re-plaider. Si elle invalide, propose la nature suivante — jamais plus de deux hypothèses au total.
4. Une fois la nature reconnue, sors par le remède qui lui correspond : préciser le « fini », réduire à dix minutes, identifier de qui ça dépend, nommer l'enjeu, ou reconnaître que ça n'a plus lieu d'être.
5. Conclus par « creer_action » ou par l'abandon assumé de la tâche. Les deux sorties sont bonnes.

Ne culpabilise à aucun moment. La procrastination est un signal, pas un défaut : quelque chose dans la tâche ne va pas, et c'est ça qu'on cherche.`,
    );
  } else if (sujet.type === "blocage") {
    l.push(
      `\n⚠ C'est l'outil « Mon blocage actuel ». On ne cherche PAS une tâche coincée — le coup de sonde s'en occupe. On cherche le SCHÉMA qui se répète au-dessus des tâches.

Déroulé, six messages maximum :
1. Ouvre par ce que tu observes dans ses données, factuellement : quels domaines avancent, lesquels stagnent, depuis quand. Pas de commentaire, juste le relevé.
2. Demande-lui ce qu'elle en pense avant de proposer quoi que ce soit. Son interprétation passe avant la tienne.
3. Propose UNE hypothèse de schéma, et une seule. Les formes courantes : elle avance là où elle est compétente et évite là où elle risque d'échouer ; elle confond activité et progression ; elle protège un domaine en le laissant vague ; elle attend une condition extérieure qui ne viendra pas ; ce qu'elle a posé ne correspond plus à ce qu'elle veut vraiment. Termine par « à toi de me dire si je lis juste ».
4. Accepte son verdict sans re-plaider. Si elle invalide, une seconde hypothèse au maximum, puis tu t'arrêtes et tu le dis.
5. Une fois le schéma reconnu, cherche avec elle le PLUS PETIT levier qui le déplace — pas une résolution, un déplacement.
6. Conclus par « creer_action » sur ce levier.

Un schéma n'est jamais un défaut de caractère : c'est une stratégie qui a servi et qui ne sert plus. Dis-le si c'est utile. Ne prête jamais d'intention, ne psychologise pas, ne diagnostique rien.`,
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
