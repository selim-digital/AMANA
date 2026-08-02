import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { COACH } from "@/lib/ia/noyau";
import { memoireDe } from "@/lib/ia/memoire";
import { evenements, pastilles, UNIVERS, type CleUnivers } from "@/lib/univers";
import { TEMPS, type NomPriere } from "@/lib/priere";

export const maxDuration = 60;

/**
 * Le rendez-vous du moment.
 *
 * Les invitations affichées jusqu'ici sortaient d'un `if/else` à cinq branches
 * écrit à la main : cinq phrases génériques qui ne nommaient jamais un projet,
 * une action bloquée, un objectif. C'est pour ça qu'elles ne ressemblaient pas
 * à un push intelligent — elles n'en étaient pas un.
 *
 * Ici, le message est écrit à partir de sa mémoire complète et de ce qui
 * l'attend réellement. Un seul par créneau, jamais deux fois le même.
 */

const schema = z.object({
  titre: z.string().describe("Trois à cinq mots. Ce dont il s'agit, pas une exclamation."),
  texte: z
    .string()
    .describe(
      "Deux phrases au maximum. La première nomme un fait précis tiré de son espace, la seconde propose le geste. Jamais de généralité.",
    ),
  cta: z.string().describe("Deux à quatre mots, à l'infinitif ou à l'impératif doux."),
  motifRetenu: z
    .string()
    .describe("Lequel des éléments en attente tu as choisi, recopié tel quel."),
  pourquoiMaintenant: z
    .string()
    .describe(
      "Une phrase disant pourquoi cet univers et ce geste maintenant. Sans jamais mentionner l'heure ni la prière.",
    ),
});

const SYSTEME = `Tu écris le message qu'AMANA adresse à une personne quand elle ouvre l'application.

Tu reçois : ce que tu sais d'elle, ce qui l'attend réellement, et le moment de la journée.

Règles absolues :
- Tu choisis UNE SEULE chose parmi ce qui l'attend. Une seule. La plus utile à cet instant.
- Tu la NOMMES : le titre de son projet, de son action, de son objectif, avec ses mots à elle. Un message qui pourrait s'adresser à n'importe qui est un échec.
- Deux phrases maximum. La première est un fait, la seconde un geste.
- Tu ne culpabilises JAMAIS. « Ça attend depuis douze jours » est un fait ; « tu n'as toujours pas fait » est un reproche. Ne franchis pas cette ligne.
- Tu ne félicites pas non plus sans raison, et tu ne fais pas de remplissage encourageant.
- Tu ne mentionnes JAMAIS l'heure, le moment de la journée en tant que tel, ni la prière. Le rythme ne s'annonce pas : il se constate. Écrire « en ce début d'après-midi » ou toute allusion au calage horaire est une faute.
- Pas d'emphase, pas d'exclamation, pas de vocabulaire de coach.
- Si ce qui l'attend est vide ou mince, dis-le sobrement et propose le plus petit geste utile — n'invente rien.

Réponds en français.`;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { creneau } = (await req.json().catch(() => ({}))) as { creneau?: string };
  if (!creneau) return NextResponse.json({ error: "Créneau non précisé" }, { status: 400 });

  // Un rendez-vous par créneau : si celui-ci a déjà été écrit, on le rejoue.
  const deja = await prisma.notification.findUnique({
    where: { userId_creneau: { userId, creneau } },
  });
  if (deja) {
    return NextResponse.json({
      push: {
        id: deja.id,
        titre: deja.title,
        texte: deja.body,
        cta: "Y aller",
        href: deja.href ?? "/aujourdhui",
        univers: (deja.univers as CleUnivers) ?? "build",
      },
      dejaEcrit: true,
    });
  }

  const evts = await evenements(userId);
  const compte = pastilles(evts);

  // ── Le budget du jour ──
  //
  // Cinq créneaux ne veulent pas dire cinq messages. AMANA n'en prend que
  // DEUX au maximum : les trois autres passent en silence, et c'est ce
  // silence qui donne du poids aux deux qui restent. Une application qui
  // parle dix fois par jour se fait couper le son.
  const debutJour = new Date(new Date().setHours(0, 0, 0, 0));
  const dejaParle = await prisma.notification.count({
    where: { userId, kind: "rendez_vous", createdAt: { gte: debutJour } },
  });
  if (dejaParle >= 2) return NextResponse.json({ push: null, raison: "budget" });

  // On ne parle pas pour parler : sans rien en attente, le créneau passe.
  const enAttente = evts.length;
  if (!enAttente) return NextResponse.json({ push: null, raison: "rien" });

  // Le second message de la journée exige davantage : on ne redit pas la
  // même chose à deux heures d'intervalle pour une broutille.
  if (dejaParle === 1 && enAttente < 2) {
    return NextResponse.json({ push: null, raison: "trop mince" });
  }

  // L'univers qui porte le plus d'attente donne le ton du message.
  const cible = (Object.keys(compte) as CleUnivers[]).sort((a, b) => compte[b] - compte[a])[0];
  const nomPriere = creneau.split("-").pop() as NomPriere;
  const temps = TEMPS[nomPriere] ?? TEMPS.dhuhr;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "IA non configurée" }, { status: 503 });
  }

  try {
    const { object } = await generateObject({
      model: COACH,
      schema,
      system: SYSTEME,
      prompt: `Ce que tu sais d'elle :

${await memoireDe(userId, "chat")}

──────────

Ce qui l'attend, en ce moment même :

${evts.length ? evts.map((x) => `- [${UNIVERS[x.univers].nom}] ${x.motif}`).join("\n") : "Rien de particulier."}

──────────

Le moment de la journée (contexte pour TOI seul — n'en dis jamais rien) : ${temps.moment}.
${temps.posture}

L'univers qui porte le plus d'attente est « ${UNIVERS[cible].nom} » — ${UNIVERS[cible].sujet}.`,
    });

    // On retrouve le lien de l'événement choisi ; à défaut, l'univers.
    const choisi =
      evts.find((x) => object.motifRetenu.includes(x.motif.slice(0, 24))) ??
      evts.find((x) => x.univers === cible);

    const notif = await prisma.notification.create({
      data: {
        userId,
        kind: "rendez_vous",
        title: object.titre,
        body: object.texte,
        href: choisi?.href ?? "/aujourdhui",
        creneau,
        univers: choisi?.univers ?? cible,
      },
    });

    return NextResponse.json({
      push: {
        id: notif.id,
        titre: object.titre,
        texte: object.texte,
        cta: object.cta,
        href: choisi?.href ?? "/aujourdhui",
        univers: choisi?.univers ?? cible,
        pourquoiMaintenant: object.pourquoiMaintenant,
      },
    });
  } catch (e) {
    console.error("[push] échec :", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Le message n'a pas abouti." },
      { status: 500 },
    );
  }
}
