import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { LEGER } from "@/lib/ia/noyau";
import { evenements, universDArrivee, UNIVERS } from "@/lib/univers";

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

  if (!process.env.ANTHROPIC_API_KEY || !miens.length) {
    return NextResponse.json({ texte: repli, univers: cible });
  }

  try {
    const { object } = await generateObject({
      model: LEGER,
      schema,
      system: `Tu expliques à quelqu'un pourquoi commencer sa session par un univers plutôt qu'un autre, dans l'application AMANA.

Règles :
- Deux phrases maximum. La première est un fait tiré de ce qui l'attend, recopié fidèlement. La seconde dit ce qu'il ou elle y gagne.
- Tu NOMMES les choses : le titre du projet, de l'action, avec ses mots. Un texte qui pourrait s'adresser à n'importe qui est un échec.
- Jamais de reproche. « Ça attend depuis douze jours » est un fait ; « tu n'as toujours pas fait » ne l'est pas.
- Pas d'exclamation, pas d'emphase, pas de vocabulaire de coach.
- Tu ne mentionnes ni l'heure, ni le moment de la journée.
- Tu t'adresses à la personne en la tutoyant.

Réponds en français.`,
      prompt: `L'univers mis en avant est « ${UNIVERS[cible].nom} » — ${UNIVERS[cible].sujet}.

Ce qui l'y attend :
${miens.map((x) => `- ${x.motif}`).join("\n")}

Ce qui attend ailleurs :
${
  evts
    .filter((x) => x.univers !== cible)
    .map((x) => `- [${UNIVERS[x.univers].nom}] ${x.motif}`)
    .join("\n") || "Rien."
}`,
    });

    return NextResponse.json({ texte: object.texte, univers: cible });
  } catch (e) {
    console.error("[orientation] échec :", e);
    return NextResponse.json({ texte: repli, univers: cible });
  }
}
