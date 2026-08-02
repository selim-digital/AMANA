import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { COACH } from "@/lib/ia/noyau";
import { memoireDe } from "@/lib/ia/memoire";
import { evenements, pastilles, UNIVERS, type CleUnivers } from "@/lib/univers";
import { creneauCourant, TEMPS, type Methode } from "@/lib/priere";
import { pousser } from "@/lib/push";

export const maxDuration = 300;

/**
 * Les rendez-vous poussés.
 *
 * Jusqu'ici les cinq rendez-vous n'existaient qu'à l'ouverture de
 * l'application : ils n'atteignaient donc jamais quelqu'un qui ne pensait pas
 * à l'ouvrir — c'est-à-dire précisément la personne qu'il fallait rappeler.
 *
 * Ce cron tourne toutes les heures et regarde, pour chacun, si un créneau
 * vient de s'ouvrir chez lui. Les horaires sont calculés depuis sa position :
 * le rythme suit sa journée, pas celle du serveur.
 *
 * Un créneau déjà servi ne l'est jamais deux fois — c'est la clé unique
 * (userId, creneau) qui le garantit, et non un compteur qu'il faudrait tenir.
 */

const schema = z.object({
  titre: z.string().describe("Trois à cinq mots. Ce dont il s'agit, pas une exclamation."),
  texte: z
    .string()
    .describe(
      "Deux phrases au maximum. La première nomme un fait précis tiré de son espace, la seconde propose le geste.",
    ),
  motifRetenu: z.string().describe("L'élément en attente choisi, recopié tel quel."),
});

const SYSTEME = `Tu écris une notification qu'AMANA envoie sur le téléphone d'une personne.

Elle la lira sur son écran verrouillé, entre deux choses. Elle doit comprendre en une seconde de quoi il s'agit et avoir envie d'ouvrir.

Règles absolues :
- UNE SEULE chose. La plus utile à cet instant.
- Tu la NOMMES avec ses mots à elle : le titre de son projet, de son action. Une notification qui pourrait s'adresser à n'importe qui est un échec.
- Deux phrases maximum, courtes. Sur un écran verrouillé, la troisième est coupée.
- Jamais de reproche. « En attente depuis douze jours » est un fait ; « tu n'as toujours pas fait » ne l'est pas.
- Tu ne mentionnes JAMAIS l'heure, le moment de la journée, ni la prière. Le rythme ne s'annonce pas : il se constate.
- Pas d'exclamation, pas d'emphase, pas de vocabulaire de coach.

Réponds en français.`;

export async function GET(req: Request) {
  const attendu = process.env.CRON_SECRET;
  if (attendu && req.headers.get("authorization") !== `Bearer ${attendu}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: true, raison: "IA non configurée" });
  }

  const maintenant = new Date();
  const jour = maintenant.toISOString().slice(0, 10);

  // Seuls ceux qui ont accepté les notifications et donné leur position :
  // sans position, on ne saurait pas quand est leur journée.
  const profils = await prisma.profile.findMany({
    where: { lat: { not: null }, lng: { not: null }, user: { abonnements: { some: {} } } },
    select: { userId: true, lat: true, lng: true, methode: true, ombre: true },
  });

  let ecrits = 0;
  let poussees = 0;

  for (const p of profils) {
    const priere = creneauCourant(
      maintenant,
      p.lat!,
      p.lng!,
      (p.methode as Methode) ?? "mwl",
      (p.ombre === 2 ? 2 : 1) as 1 | 2,
    );
    if (!priere) continue;

    const creneau = `${jour}-${priere}`;

    // Déjà servi : on passe. La contrainte d'unicité fait foi.
    const deja = await prisma.notification.findUnique({
      where: { userId_creneau: { userId: p.userId, creneau } },
    });
    if (deja) continue;

    const evts = await evenements(p.userId);
    const bilan = priere === "maghrib" || priere === "isha";
    // Aux créneaux d'exécution, rien à dire veut dire : on se tait.
    if (!evts.length && !bilan) continue;

    const compte = pastilles(evts);
    const cible = (Object.keys(compte) as CleUnivers[]).sort((a, b) => compte[b] - compte[a])[0];
    const temps = TEMPS[priere];

    try {
      const { object } = await generateObject({
        model: COACH,
        schema,
        system: SYSTEME,
        prompt: `Ce que tu sais d'elle :

${await memoireDe(p.userId, "chat")}

──────────

Ce qui l'attend :

${evts.length ? evts.map((x) => `- [${UNIVERS[x.univers].nom}] ${x.motif}`).join("\n") : "Rien de particulier."}

──────────

Le moment (contexte pour TOI seul — n'en dis jamais rien) : ${temps.moment}.
${temps.posture}`,
      });

      const choisi =
        evts.find((x) => object.motifRetenu.includes(x.motif.slice(0, 24))) ??
        evts.find((x) => x.univers === cible);
      const href = choisi?.href ?? "/aujourdhui";

      // La notification est écrite d'abord : si la poussée échoue, la personne
      // la retrouvera en ouvrant l'application, et le créneau reste consommé.
      await prisma.notification.create({
        data: {
          userId: p.userId,
          kind: "rendez_vous",
          title: object.titre,
          body: object.texte,
          href,
          creneau,
          univers: choisi?.univers ?? cible,
        },
      });
      ecrits += 1;

      poussees += await pousser(p.userId, {
        titre: object.titre,
        corps: object.texte,
        href,
        // Un seul fil : le rendez-vous du moment remplace celui d'avant plutôt
        // que d'empiler cinq bulles non lues sur l'écran verrouillé.
        fil: "rendez-vous",
      });
    } catch (e) {
      console.error(`[cron/rendezvous] échec pour ${p.userId} :`, e);
    }
  }

  return NextResponse.json({ ok: true, examines: profils.length, ecrits, poussees });
}
