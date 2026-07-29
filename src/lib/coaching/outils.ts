/**
 * Bibliothèque d'outils d'accompagnement.
 *
 * Principe (repris de l'architecture FIQUP) : l'IA reçoit en permanence un
 * INDEX compact (nom + quand l'employer). Elle ne charge la fiche complète
 * qu'au moment où elle en a besoin, via l'outil `consulter_outil`.
 * Le contexte reste léger et le coût maîtrisé.
 *
 * Cette bibliothèque a vocation à s'étoffer — il suffit d'ajouter une entrée.
 */

export type Outil = {
  id: string;
  nom: string;
  famille: string;
  /** Signal qui doit déclencher la consultation de cette fiche. */
  quand: string;
  principe: string;
  demarche: string[];
  /** Limite ou précaution d'usage — AMANA n'est pas thérapeute. */
  gardeFou?: string;
};

export const OUTILS: Outil[] = [
  {
    id: "cnv",
    nom: "Communication NonViolente (CNV)",
    famille: "Relation & communication",
    quand: "Tension, conflit, reproche, difficulté à dire les choses à quelqu'un.",
    principe:
      "Séparer l'observation du jugement, et relier ce qu'on ressent à un besoin plutôt qu'à la faute de l'autre.",
    demarche: [
      "Observation : décrire les faits sans évaluation (« quand je vois que… »), jamais « tu es… ».",
      "Sentiment : nommer ce que l'on ressent (« je me sens… »), sans attribuer la cause à l'autre.",
      "Besoin : identifier le besoin derrière le sentiment (respect, clarté, reconnaissance, repos…).",
      "Demande : formuler une demande concrète, réalisable et négociable — pas une exigence.",
    ],
    gardeFou:
      "Ne jamais formuler la demande à la place de la personne : l'aider à trouver la sienne.",
  },
  {
    id: "objectif-bien-forme",
    nom: "Objectif bien formé (PNL)",
    famille: "Clarification d'objectif",
    quand: "Objectif flou, formulé en négatif, ou qui ne dépend pas de la personne.",
    principe:
      "Un objectif n'est exploitable que s'il est positif, sensoriel, écologique et sous le contrôle de la personne.",
    demarche: [
      "Formuler en positif : ce que l'on veut, pas ce que l'on ne veut plus.",
      "Sous son contrôle : l'atteinte dépend-elle d'elle, ou d'autrui ?",
      "Sensoriel : à quoi saura-t-elle que c'est atteint (ce qu'elle verra, entendra, constatera) ?",
      "Contextualisé : où, quand, avec qui — et où surtout pas ?",
      "Écologique : quelles conséquences sur ses relations, sa santé, ses autres engagements ?",
      "Premier pas : quelle action concrète peut être faite dans les 48 heures ?",
    ],
  },
  {
    id: "recadrage",
    nom: "Recadrage (PNL)",
    famille: "Déblocage",
    quand: "Croyance limitante, « je n'y arriverai jamais », lecture figée d'une situation.",
    principe:
      "Un même fait change de sens selon le cadre choisi. Élargir le cadre ouvre des options.",
    demarche: [
      "Faire préciser la croyance et la situation exacte qui la nourrit.",
      "Chercher un contre-exemple vécu, même minuscule.",
      "Changer de cadre : et si c'était une compétence à acquérir plutôt qu'un défaut ?",
      "Changer d'échelle : quelle importance dans un an ?",
      "Faire choisir à la personne le cadre le plus utile pour elle — ne pas l'imposer.",
    ],
    gardeFou:
      "Le recadrage n'est pas un déni : ne jamais minimiser une douleur réelle ni une injustice.",
  },
  {
    id: "analyse-transactionnelle",
    nom: "Analyse Transactionnelle",
    famille: "Relation & posture",
    quand:
      "Relation qui se répète mal, sentiment d'être infantilisé ou de materner, réunions qui dérapent toujours pareil.",
    principe:
      "Nous parlons depuis trois états du moi : Parent (normes), Adulte (faits), Enfant (émotions). Les échanges se grippent quand les états ne se répondent pas.",
    demarche: [
      "Repérer depuis quel état la personne parle, et depuis lequel l'autre répond.",
      "Nommer la transaction croisée (ex. elle parle Adulte, on lui répond Parent).",
      "Identifier le jeu répétitif éventuel (Triangle : Sauveur, Victime, Persécuteur).",
      "Chercher la sortie par l'Adulte : faits, demandes claires, responsabilité assumée.",
      "Viser la position de vie « je suis OK, tu es OK ».",
    ],
    gardeFou:
      "Outil de lecture des échanges, pas un diagnostic de personnalité. Ne jamais étiqueter quelqu'un.",
  },
  {
    id: "maxwell-leadership",
    nom: "Les 5 niveaux de leadership (John Maxwell)",
    famille: "Leadership",
    quand:
      "Difficulté à faire adhérer une équipe, autorité qui ne repose que sur le titre, envie de progresser comme dirigeant.",
    principe:
      "Le leadership se gravit par niveaux : chacun se gagne, et se gagne auprès de chaque personne séparément.",
    demarche: [
      "Niveau 1 — Position : on suit parce qu'il le faut. Base minimale, jamais suffisante.",
      "Niveau 2 — Permission : on suit parce qu'on le veut bien. Se gagne par la relation et l'écoute.",
      "Niveau 3 — Production : on suit à cause des résultats obtenus ensemble.",
      "Niveau 4 — Développement des personnes : on suit pour ce que le leader a fait grandir en soi.",
      "Niveau 5 — Sommet : on suit pour ce que le leader représente. Se mérite dans la durée.",
      "Situer le niveau atteint avec CHAQUE personne clé, puis viser le palier suivant.",
    ],
  },
  {
    id: "grow",
    nom: "Modèle GROW",
    famille: "Conduite d'entretien",
    quand: "Structurer une séance de clarification du début à la fin.",
    principe: "Quatre temps : but, réalité, options, engagement.",
    demarche: [
      "Goal — que veux-tu obtenir à la fin de cet échange ?",
      "Reality — où en es-tu concrètement, avec quels faits ?",
      "Options — quelles voies possibles, y compris celles écartées d'emblée ?",
      "Will — que fais-tu, quand, et qu'est-ce qui pourrait t'en empêcher ?",
    ],
  },
  {
    id: "smart",
    nom: "Objectif SMART",
    famille: "Clarification d'objectif",
    quand: "Objectif à rendre mesurable et daté.",
    principe: "Un objectif se vérifie : sinon, il reste une intention.",
    demarche: [
      "Spécifique : un seul résultat, formulé simplement.",
      "Mesurable : à quel chiffre ou fait constatable saura-t-on ?",
      "Atteignable : compatible avec les ressources réelles.",
      "Pertinent : relié à ce qui compte vraiment pour la personne.",
      "Temporel : une échéance datée.",
    ],
  },
  {
    id: "ivy-lee",
    nom: "Méthode Ivy Lee",
    famille: "Priorisation",
    quand: "Trop de choses à faire, dispersion, journée sans cap.",
    principe: "Six tâches maximum, ordonnées, traitées dans l'ordre — une seule à la fois.",
    demarche: [
      "En fin de journée, écrire les six choses les plus importantes pour demain.",
      "Les classer par ordre d'importance réelle.",
      "Le lendemain, commencer par la première et n'en changer qu'une fois terminée.",
      "Reporter ce qui reste au lendemain, sans culpabilité.",
    ],
  },
];

/** Index compact injecté en permanence dans le prompt système. */
export const INDEX_OUTILS = OUTILS.map(
  (o) => `- ${o.id} · ${o.nom} (${o.famille}) — à consulter si : ${o.quand}`,
).join("\n");

/** Fiche complète, chargée à la demande par l'outil `consulter_outil`. */
export function ficheOutil(id: string): string {
  const o = OUTILS.find((x) => x.id === id);
  if (!o) return `Aucun outil ne porte l'identifiant « ${id} ».`;
  return [
    `${o.nom} — ${o.famille}`,
    `Quand l'employer : ${o.quand}`,
    `Principe : ${o.principe}`,
    "Démarche :",
    ...o.demarche.map((d, i) => `${i + 1}. ${d}`),
    o.gardeFou ? `Garde-fou : ${o.gardeFou}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
