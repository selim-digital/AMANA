import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { LEGER } from "@/lib/ia/noyau";
import { evenements, universDArrivee, UNIVERS } from "@/lib/univers";
import { COACH } from "@/lib/ia/noyau";
import { memoireDe } from "@/lib/ia/memoire";

export const maxDuration = 30;

/**
 * Pourquoi commencer par cet univers.
 *
 * Une carte mise en avant sans raison serait arbitraire. Ce texte dit ce qui
 * la justifie, en citant ce qui attend réellement. Modèle léger : c'est deux
 * phrases, pas un accompagnement — et il s'affiche à l'arrivée, donc il doit
 * être rapide.
 */

const schema = z.object({
  texte: z
    .string()
    .describe(
      "Deux phrases au maximum. La première nomme un fait précis qui attend dans cet univers, la seconde dit ce qu'on y gagne à commencer par là.",
    ),
});

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const evts = await evenements(userId);
  const cible = universDArrivee(evts);
  const miens = evts.filter((x) => x.univers === cible);

  // Sans clé ni matière, on répond quelque chose de vrai plutôt que rien.
  const repli = miens.length
    ? `${miens[0].motif}. C'est le fil le plus court pour avancer aujourd'hui.`
    : `${UNIVERS[cible].nom} — ${UNIVERS[cible].sujet.toLowerCase()}. Rien ne presse ailleurs.`;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ texte: repli, univers: cible });
  }

  try {
    const { object } = await generateObject({
      model: miens.length ? COACH : LEGER,
      schema,
      system: `Tu dis à quelqu'un pourquoi commencer sa session par cet univers plutôt qu'un autre, dans l'application AMANA.

Ce n'est PAS un texte d'ambiance. C'est un renseignement opérationnel : la personne doit savoir en le lisant ce qui l'attend et ce qu'elle a intérêt à faire dans les minutes qui viennent.

Règles :
- Deux phrases. La première nomme un fait précis — un titre de projet, une action, un nombre de jours, un chiffre de cap — recopié fidèlement depuis ce qu'on te donne. La seconde dit quoi faire maintenant, concrètement.
- INTERDIT : toute phrase qui pourrait s'adresser à quelqu'un d'autre. « Ce que tu construis », « rien ne presse ailleurs », « prends le temps de », « c'est le moment de te recentrer » — tout cela est un échec. Si tu n'as aucun fait à citer, dis-le franchement : « Rien n'attend ici aujourd'hui. »
- Pas de métaphore, pas de paysage, pas de vocabulaire de coach, pas d'exclamation. Ton d'un collègue compétent qui te met au courant en passant.
- Tiens compte de l'heure qu'on te donne : ce qu'on propose en fin de matinée n'est pas ce qu'on propose après 21 h. Mais ne commente jamais l'heure elle-même.
- Jamais de reproche. « En attente depuis douze jours » est un fait ; « tu n'as toujours pas fait » est un jugement.
- Tutoie.

Réponds en français.`,
      prompt: `Il est ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.

L'univers mis en avant est « ${UNIVERS[cible].nom} » — ${UNIVERS[cible].sujet}.

Ce qui l'y attend précisément :
${miens.map((x) => `- ${x.motif}`).join("\n") || "Rien de signalé."}

Ce qui attend dans les autres univers :
${
  evts
    .filter((x) => x.univers !== cible)
    .map((x) => `- [${UNIVERS[x.univers].nom}] ${x.motif}`)
    .join("\n") || "Rien."
}

Son dossier complet, pour que tu puisses nommer les choses avec ses mots :

${await memoireDe(userId, "chat")}`,
    });

    return NextResponse.json({ texte: object.texte, univers: cible });
  } catch (e) {
    console.error("[orientation] échec :", e);
    return NextResponse.json({ texte: repli, univers: cible });
  }
}
