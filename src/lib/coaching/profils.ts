/**
 * Les trois lectures de la personne, jamais présentées comme des « tests ».
 *  · DISC   — comment elle se comporte
 *  · WPMOT  — ce qui la motive (motivateurs de Spranger)
 *  · ÉGO    — depuis quel état du moi elle communique (Analyse Transactionnelle)
 *
 * Principe produit : on ne demande jamais tout d'un coup. Quelques questions à
 * l'accueil, puis une question de temps en temps, au fil de l'eau.
 */

export type Axe = string;
export type Question = { id: string; texte: string; options: { texte: string; axe: Axe }[] };
export type Instrument = {
  cle: "disc" | "wpmot" | "ego";
  nom: string;
  intro: string;
  axes: Record<string, { nom: string; description: string }>;
  questions: Question[];
};

export const DISC: Instrument = {
  cle: "disc",
  nom: "Ta manière d'avancer",
  intro: "Comment tu abordes les situations.",
  axes: {
    D: { nom: "Décideur", description: "va au résultat, tranche vite, supporte mal la lenteur" },
    I: { nom: "Inspirant", description: "entraîne les autres, a besoin d'échanges et de sens partagé" },
    S: { nom: "Stable", description: "construit dans la durée, cherche l'harmonie, n'aime pas être bousculé" },
    C: { nom: "Rigoureux", description: "veut comprendre avant d'agir, soigne la précision" },
  },
  questions: [
    {
      id: "d1",
      texte: "Face à une opportunité importante, ta première réaction :",
      options: [
        { texte: "Je décide vite et j'ajuste en route", axe: "D" },
        { texte: "J'en parle autour de moi pour sentir l'élan", axe: "I" },
        { texte: "Je prends le temps, j'avance par étapes", axe: "S" },
        { texte: "J'analyse avant de m'engager", axe: "C" },
      ],
    },
    {
      id: "d2",
      texte: "Ce qui t'agace le plus dans un projet :",
      options: [
        { texte: "Qu'on tourne en rond sans décider", axe: "D" },
        { texte: "Travailler seul, sans échange", axe: "I" },
        { texte: "Qu'on change tout au dernier moment", axe: "S" },
        { texte: "L'approximation et le flou", axe: "C" },
      ],
    },
    {
      id: "d3",
      texte: "Quand la pression monte, tu as tendance à :",
      options: [
        { texte: "Prendre les commandes", axe: "D" },
        { texte: "Chercher du soutien et parler", axe: "I" },
        { texte: "Te replier et encaisser", axe: "S" },
        { texte: "Te réfugier dans les détails", axe: "C" },
      ],
    },
    {
      id: "d4",
      texte: "Une bonne journée de travail, c'est une journée où :",
      options: [
        { texte: "J'ai obtenu un résultat concret", axe: "D" },
        { texte: "J'ai eu de bons échanges", axe: "I" },
        { texte: "Tout s'est déroulé sans heurt", axe: "S" },
        { texte: "J'ai fait les choses correctement", axe: "C" },
      ],
    },
  ],
};

export const WPMOT: Instrument = {
  cle: "wpmot",
  nom: "Ce qui te met en mouvement",
  intro: "Ce qui te donne de l'énergie, au fond.",
  axes: {
    theorique: { nom: "Connaissance", description: "comprendre, apprendre, chercher le vrai" },
    utilitaire: { nom: "Rendement", description: "le retour concret sur l'effort investi" },
    esthetique: { nom: "Harmonie", description: "la beauté, l'équilibre, la forme juste" },
    social: { nom: "Service", description: "être utile aux autres, contribuer" },
    individualiste: { nom: "Influence", description: "peser sur le cours des choses, conduire" },
    traditionnel: { nom: "Sens", description: "agir selon un cadre, des principes, une foi" },
  },
  questions: [
    {
      id: "w1",
      texte: "Tu es le plus fier quand :",
      options: [
        { texte: "Tu as enfin compris quelque chose de difficile", axe: "theorique" },
        { texte: "Ton effort a produit un résultat tangible", axe: "utilitaire" },
        { texte: "Ce que tu as fait est juste et bien fait", axe: "esthetique" },
        { texte: "Quelqu'un a avancé grâce à toi", axe: "social" },
      ],
    },
    {
      id: "w2",
      texte: "Si tu devais renoncer à une chose, la plus dure à lâcher serait :",
      options: [
        { texte: "Ta liberté de décider", axe: "individualiste" },
        { texte: "La cohérence avec tes principes", axe: "traditionnel" },
        { texte: "Le temps d'apprendre", axe: "theorique" },
        { texte: "Ce que tu apportes aux tiens", axe: "social" },
      ],
    },
    {
      id: "w3",
      texte: "Ce qui t'épuise le plus :",
      options: [
        { texte: "Travailler sans voir de résultat", axe: "utilitaire" },
        { texte: "Faire les choses à moitié", axe: "esthetique" },
        { texte: "Subir des décisions sans pouvoir peser", axe: "individualiste" },
        { texte: "Agir contre ce en quoi tu crois", axe: "traditionnel" },
      ],
    },
  ],
};

export const EGO: Instrument = {
  cle: "ego",
  nom: "Ta façon d'être en relation",
  intro: "Depuis quel endroit tu parles aux autres.",
  axes: {
    PN: { nom: "Parent normatif", description: "pose le cadre, les règles, l'exigence" },
    PB: { nom: "Parent bienveillant", description: "protège, encourage, prend soin" },
    A: { nom: "Adulte", description: "s'en tient aux faits, décide posément" },
    EL: { nom: "Enfant libre", description: "spontané, créatif, enthousiaste" },
    EA: { nom: "Enfant adapté", description: "s'ajuste aux attentes, évite le conflit" },
  },
  questions: [
    {
      id: "e1",
      texte: "Quand quelqu'un ne tient pas un engagement, tu :",
      options: [
        { texte: "Rappelles fermement ce qui était convenu", axe: "PN" },
        { texte: "Cherches d'abord à comprendre ce qui lui arrive", axe: "PB" },
        { texte: "Constates les faits et proposes une suite", axe: "A" },
        { texte: "Laisses passer pour ne pas envenimer", axe: "EA" },
      ],
    },
    {
      id: "e2",
      texte: "Dans une réunion qui s'enlise, tu es plutôt celui qui :",
      options: [
        { texte: "Recadre et rappelle l'objectif", axe: "PN" },
        { texte: "Ramène des faits pour trancher", axe: "A" },
        { texte: "Détend l'atmosphère", axe: "EL" },
        { texte: "Attend que ça passe", axe: "EA" },
      ],
    },
    {
      id: "e3",
      texte: "Face à une contrariété, ta pente naturelle :",
      options: [
        { texte: "Je m'en veux d'avoir mal fait", axe: "PN" },
        { texte: "Je relativise et vais de l'avant", axe: "A" },
        { texte: "Je le prends à la légère", axe: "EL" },
        { texte: "Je m'en veux d'avoir déçu quelqu'un", axe: "EA" },
      ],
    },
  ],
};

export const INSTRUMENTS = [DISC, WPMOT, EGO];

export type Reponses = Record<string, string>; // id de question → axe choisi

/** Dominantes calculées à partir des réponses, du plus fort au plus faible. */
export function dominantes(inst: Instrument, reponses: Reponses): { axe: string; nom: string; n: number }[] {
  const scores = new Map<string, number>();
  for (const q of inst.questions) {
    const axe = reponses[q.id];
    if (axe) scores.set(axe, (scores.get(axe) ?? 0) + 1);
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([axe, n]) => ({ axe, nom: inst.axes[axe]?.nom ?? axe, n }));
}

/** Les questions encore sans réponse, tous instruments confondus. */
export function questionsRestantes(profil: {
  disc?: Reponses;
  wpmot?: Reponses;
  ego?: Reponses;
}): { instrument: Instrument; question: Question }[] {
  const restantes: { instrument: Instrument; question: Question }[] = [];
  for (const inst of INSTRUMENTS) {
    const rep = (profil[inst.cle] ?? {}) as Reponses;
    for (const q of inst.questions) if (!rep[q.id]) restantes.push({ instrument: inst, question: q });
  }
  return restantes;
}

/** Portrait en texte, destiné au prompt de l'IA (jamais montré tel quel). */
export function portraitPourIA(profil: {
  disc?: Reponses;
  wpmot?: Reponses;
  ego?: Reponses;
}): string {
  const lignes: string[] = [];
  for (const inst of INSTRUMENTS) {
    const rep = (profil[inst.cle] ?? {}) as Reponses;
    const d = dominantes(inst, rep);
    if (!d.length) continue;
    const top = d.slice(0, 2);
    lignes.push(
      `${inst.nom} : ${top
        .map((t) => `${t.nom} (${inst.axes[t.axe]?.description ?? ""})`)
        .join(", puis ")}`,
    );
  }
  return lignes.length ? lignes.join("\n") : "";
}
