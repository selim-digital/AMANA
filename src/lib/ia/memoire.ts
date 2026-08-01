import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { LEGER } from "@/lib/ia/noyau";
import { portraitPourIA } from "@/lib/coaching/profils";

/**
 * La mémoire d'AMANA — une seule source de vérité pour TOUTES les surfaces IA.
 *
 * Le problème qu'elle résout : chat, plongée, décharge et notifications
 * construisaient chacun leur contexte à la main, avec des champs différents.
 * La plongée ignorait les valeurs, le chat ignorait les verdicts de plongée,
 * et la table `Memory` — prévue dès le départ — n'était jamais écrite.
 * Résultat : on confiait quelque chose quelque part, ailleurs on l'ignorait.
 *
 * Ici : `dossier()` lit tout, `rendre()` le met en mots, `memoriser()` retient
 * ce qui mérite de l'être. Une surface qui n'appelle pas ce module est un bug.
 */

// ─────────────────────────── Lecture ───────────────────────────

const JOUR = 86_400_000;
const jours = (d: Date) => Math.floor((Date.now() - d.getTime()) / JOUR);

export async function dossier(userId: string) {
  const annee = new Date().getFullYear();
  const trimestre = `${annee}-Q${Math.floor(new Date().getMonth() / 3) + 1}`;

  const [profile, valeurs, objectifs, projets, taches, echanges, plongees, souvenirs] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.value.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: { label: true },
      }),
      prisma.annualGoal.findMany({
        where: { userId, year: annee },
        orderBy: { order: "asc" },
        select: { label: true, why: true },
      }),
      prisma.project.findMany({
        where: { userId, deletedAt: null },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          status: true,
          vision: true,
          objective: true,
          domain: true,
          progress: true,
          updatedAt: true,
          okrs: {
            where: { period: trimestre },
            select: {
              objective: true,
              keyResults: { select: { label: true, target: true, current: true, target_: true } },
            },
          },
        },
      }),
      prisma.task.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          dueAt: true,
          project: { select: { name: true } },
        },
      }),
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { id: true, title: true, updatedAt: true, project: { select: { name: true } } },
      }),
      // Les verdicts de plongée : ce qu'elle a elle-même reconnu ou rejeté.
      // C'est la matière la plus précieuse — elle vient d'elle, pas de nous.
      prisma.signal.findMany({
        where: { session: { userId }, verdict: { not: "EN_ATTENTE" } },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { hypothese: true, verdict: true, verbatim: true, createdAt: true },
      }),
      prisma.memory.findMany({
        where: { userId, active: true, deletedAt: null },
        orderBy: [{ userEdited: "desc" }, { updatedAt: "desc" }],
        take: 30,
        select: { layer: true, content: true, source: true },
      }),
    ]);

  return { profile, valeurs, objectifs, projets, taches, echanges, plongees, souvenirs, trimestre };
}

export type Dossier = Awaited<ReturnType<typeof dossier>>;

// ─────────────────────────── Mise en mots ───────────────────────────

const VERDICT = {
  VALIDE: "elle a reconnu que c'était juste",
  NUANCE: "elle a nuancé",
  INVALIDE: "elle a rejeté",
  EN_ATTENTE: "",
} as const;

const STATUT = {
  ACTIVE: "actif",
  SECONDARY: "secondaire",
  WAITING: "en attente",
  IDEA: "idée",
  ARCHIVED: "archivé",
} as const;

/**
 * Rend le dossier en texte pour un prompt.
 * `pour` ajuste la profondeur : la plongée a besoin des dates et des absences,
 * le chat a besoin d'aller vite.
 */
export function rendre(d: Dossier, pour: "chat" | "plongee" = "chat"): string {
  const l: string[] = [];

  const portrait = portraitPourIA({
    disc: (d.profile?.disc as Record<string, string>) ?? {},
    wpmot: (d.profile?.wpmot as Record<string, string>) ?? {},
    ego: (d.profile?.ego as Record<string, string>) ?? {},
  });
  if (portrait) {
    l.push(
      `Sa manière de fonctionner (hypothèses déduites de ses réponses — ne la lui récite JAMAIS, ne la nomme pas ; sers-t'en pour ajuster ton ton et ton niveau de challenge) :\n${portrait}`,
    );
  }

  l.push(d.profile?.vision ? `Sa vision : ${d.profile.vision}` : "Aucune vision formulée.");
  if (d.profile?.domaines?.length) l.push(`Ses domaines de vie : ${d.profile.domaines.join(", ")}`);
  if (d.profile?.style) l.push(`Accompagnement souhaité : ${d.profile.style}`);

  l.push(
    d.valeurs.length
      ? `Ses valeurs : ${d.valeurs.map((v) => v.label).join(", ")}.`
      : "Elle n'a pas encore nommé ses valeurs.",
  );

  l.push(
    d.objectifs.length
      ? `Ses objectifs pour l'année :\n${d.objectifs
          .map((o) => `- ${o.label}${o.why ? ` (parce que : ${o.why})` : " (aucun pourquoi donné)"}`)
          .join("\n")}`
      : "Aucun objectif d'année défini.",
  );

  l.push(
    d.projets.length
      ? `Ses projets (${d.projets.length}) :\n${d.projets
          .map((p) => {
            const okr = p.okrs[0];
            const cap = okr
              ? ` · cap du trimestre : ${okr.objective} [${okr.keyResults
                  .map((k) => `${k.label} ${k.current}/${k.target_}`)
                  .join(" ; ")}]`
              : pour === "plongee"
                ? " · SANS cap trimestriel"
                : "";
            const dormance =
              pour === "plongee" && jours(p.updatedAt) > 14
                ? ` · sans mouvement depuis ${jours(p.updatedAt)} jours`
                : "";
            return `- ${p.name} [${STATUT[p.status] ?? p.status}]${
              p.domain ? ` · ${p.domain}` : pour === "plongee" ? " · sans domaine" : ""
            }${p.objective ? ` · objectif : ${p.objective}` : pour === "plongee" ? " · SANS objectif" : ""}${cap}${dormance}`;
          })
          .join("\n")}`
      : "Aucun projet.",
  );

  const attente = d.taches.filter((t) => t.status !== "DONE");
  const faites = d.taches.filter((t) => t.status === "DONE");
  if (attente.length) {
    l.push(
      `Ses actions en attente :\n${attente
        .slice(0, pour === "plongee" ? 15 : 6)
        .map((t) => {
          const j = jours(t.createdAt);
          return `- ${t.title}${t.project ? ` (${t.project.name})` : ""}${
            j >= 5 ? ` — en attente depuis ${j} jours` : ""
          }`;
        })
        .join("\n")}`,
    );
  }
  if (pour === "plongee") {
    l.push(`Bilan des actions : ${faites.length} terminées, ${attente.length} en attente.`);
  }

  // Ce qu'elle a elle-même tranché en plongée : à ne jamais contredire.
  if (d.plongees.length) {
    l.push(
      `Ce qu'elle a déjà tranché lors de ses plongées (ses verdicts font autorité — ne reproposé pas une hypothèse qu'elle a rejetée) :\n${d.plongees
        .map(
          (s) =>
            `- « ${s.hypothese} » → ${VERDICT[s.verdict] || "sans verdict"}${
              s.verbatim ? ` : « ${s.verbatim} »` : ""
            }`,
        )
        .join("\n")}`,
    );
  }

  if (d.souvenirs.length) {
    l.push(
      `Ce que tu as retenu d'elle au fil des échanges :\n${d.souvenirs
        .map((m) => `- ${m.content}`)
        .join("\n")}`,
    );
  }

  if (d.echanges.length > 1) {
    const quand = (dt: Date) => {
      const j = jours(dt);
      return j === 0 ? "aujourd'hui" : j === 1 ? "hier" : `il y a ${j} jours`;
    };
    l.push(
      `Vos échanges précédents :\n${d.echanges
        .slice(1)
        .map(
          (c) => `- « ${c.title} »${c.project ? ` — projet ${c.project.name}` : ""}, ${quand(c.updatedAt)}`,
        )
        .join("\n")}`,
    );
  }

  return l.join("\n\n");
}

/** Le dossier complet, en une passe. */
export async function memoireDe(userId: string, pour: "chat" | "plongee" = "chat") {
  return rendre(await dossier(userId), pour);
}

// ─────────────────────────── Écriture ───────────────────────────

/** Retient un fait durable, sans doublon. */
export async function memoriser(
  userId: string,
  contenu: string,
  layer: "STABLE" | "EVOLUTIVE" | "LEARNING" = "EVOLUTIVE",
  source?: string,
) {
  const propre = contenu.trim();
  if (propre.length < 8 || propre.length > 300) return;
  const deja = await prisma.memory.findFirst({
    where: { userId, active: true, deletedAt: null, content: { equals: propre, mode: "insensitive" } },
  });
  if (deja) return;
  await prisma.memory.create({ data: { userId, layer, content: propre, source } }).catch(() => {});
}

const EXTRAIT = z.object({
  faits: z
    .array(
      z.object({
        contenu: z.string().describe("Le fait, à la troisième personne, en une phrase courte"),
        nature: z
          .enum(["STABLE", "EVOLUTIVE", "LEARNING"])
          .describe(
            "STABLE : ce qui la définit durablement. EVOLUTIVE : une situation en cours. LEARNING : ce que tu as appris sur la bonne façon de l'accompagner.",
          ),
      }),
    )
    .describe("Zéro à trois faits. Zéro est une réponse valable et fréquente."),
});

/**
 * Extrait de l'échange ce qui mérite d'être retenu.
 *
 * Volontairement avare : un souvenir de trop pollue tous les échanges suivants.
 * Tourne sur le modèle léger, après la réponse — la personne n'attend pas.
 */
export async function retenirDeLEchange(userId: string, echange: string) {
  if (!process.env.ANTHROPIC_API_KEY || echange.length < 120) return;
  const connus = await prisma.memory.findMany({
    where: { userId, active: true, deletedAt: null },
    select: { content: true },
    take: 30,
  });

  try {
    const { object } = await generateObject({
      model: LEGER,
      schema: EXTRAIT,
      system: `Tu tiens la mémoire longue d'un accompagnement. Tu extrais UNIQUEMENT ce qui servira dans six mois.

Tu retiens : une contrainte de vie durable, une échéance qui structure son année, une personne ou un lieu qui compte, un blocage récurrent, une préférence claire sur la façon de l'accompagner.

Tu ne retiens JAMAIS : ce qui est déjà dans son espace (projets, tâches, valeurs, objectifs — ils sont lus ailleurs), le contenu de l'échange, une humeur passagère, une reformulation, une hypothèse non confirmée, une intention prêtée.

Dans le doute, ne retiens rien : une liste vide est le résultat normal. N'invente jamais.

Déjà en mémoire (ne les répète pas, même autrement formulés) :
${connus.map((m) => `- ${m.content}`).join("\n") || "(rien)"}`,
      prompt: `Échange :\n\n${echange.slice(0, 6000)}`,
    });

    for (const f of object.faits.slice(0, 3)) {
      await memoriser(userId, f.contenu, f.nature, "conversation");
    }
  } catch {
    // La mémoire est un bonus : son échec ne doit jamais casser une réponse.
  }
}
