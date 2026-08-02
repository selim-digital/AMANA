import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@prisma/client";

/**
 * Les mains du chat sur l'espace de la personne.
 *
 * Jusqu'ici l'IA lisait le contexte mais ne pouvait presque rien y inscrire :
 * ce qu'on lui confiait se perdait. Ici, elle peut lire l'ensemble et écrire
 * ce qui est structurel et réversible.
 *
 * La frontière : ce qui est **déclaratif** (valeurs, projets, objectifs, cap
 * du trimestre) s'enregistre directement — la personne l'ajuste ensuite d'un
 * geste dans l'interface. Ce qui est un **engagement à agir** (créer une
 * action) reste une proposition qu'elle valide. Cette règle vient du produit,
 * pas d'une prudence technique.
 */

const STATUTS: Record<string, ProjectStatus> = {
  actif: "ACTIVE",
  secondaire: "SECONDARY",
  attente: "WAITING",
  idee: "IDEA",
  idée: "IDEA",
  archive: "ARCHIVED",
  archivé: "ARCHIVED",
};

function trimestre(d = new Date()) {
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

/** Retrouve un projet par son nom, sans exiger l'orthographe exacte. */
async function trouverProjet(userId: string, nom: string) {
  const cible = nom.trim().toLowerCase();
  const projets = await prisma.project.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, name: true },
  });
  return (
    projets.find((p) => p.name.toLowerCase() === cible) ??
    projets.find((p) => p.name.toLowerCase().includes(cible)) ??
    projets.find((p) => cible.includes(p.name.toLowerCase())) ??
    null
  );
}

export function outilsEspace(userId: string) {
  return {
    lire_espace: tool({
      description:
        "Lit l'état complet de l'espace de la personne : ses projets et leur cap trimestriel, ses actions en cours, ses valeurs, ses objectifs de l'année. À appeler dès qu'une réponse dépend de ce qu'elle a déjà posé.",
      inputSchema: z.object({}),
      execute: async () => {
        const annee = new Date().getFullYear();
        const [projets, taches, valeurs, objectifs] = await Promise.all([
          prisma.project.findMany({
            where: { userId, deletedAt: null },
            orderBy: { order: "asc" },
            select: {
              name: true,
              status: true,
              vision: true,
              objective: true,
              progress: true,
              okrs: {
                where: { period: trimestre() },
                select: {
                  objective: true,
                  keyResults: { select: { label: true, current: true, target_: true } },
                },
              },
            },
          }),
          prisma.task.findMany({
            where: { userId, deletedAt: null, status: { in: ["TODO", "IN_PROGRESS"] } },
            orderBy: { createdAt: "asc" },
            take: 20,
            select: { title: true, dueAt: true, project: { select: { name: true } } },
          }),
          prisma.value.findMany({ where: { userId }, select: { label: true } }),
          prisma.annualGoal.findMany({
            where: { userId, year: annee },
            orderBy: { order: "asc" },
            select: { label: true, why: true },
          }),
        ]);

        return {
          valeurs: valeurs.map((v) => v.label),
          objectifsDeLAnnee: objectifs.map((o) => (o.why ? `${o.label} — ${o.why}` : o.label)),
          projets: projets.map((p) => ({
            nom: p.name,
            statut: p.status,
            vision: p.vision,
            objectif: p.objective,
            avancement: `${p.progress} %`,
            capDuTrimestre: p.okrs[0]
              ? {
                  objectif: p.okrs[0].objective,
                  resultats: p.okrs[0].keyResults.map(
                    (k) => `${k.label} (${k.current}/${k.target_})`,
                  ),
                }
              : null,
          })),
          actionsEnCours: taches.map((t) => ({
            titre: t.title,
            projet: t.project?.name ?? null,
            echeance: t.dueAt ? t.dueAt.toISOString().slice(0, 10) : null,
          })),
        };
      },
    }),

    noter_valeurs: tool({
      description:
        "Enregistre dans son profil les valeurs fondamentales que la personne vient d'énoncer. À utiliser dès qu'elle nomme ce qui compte pour elle. Ne rien inventer : uniquement ses mots.",
      inputSchema: z.object({
        valeurs: z.array(z.string()).describe("Ses valeurs, un mot ou une courte expression chacune"),
      }),
      execute: async ({ valeurs }) => {
        const propres = valeurs.map((v) => v.trim()).filter((v) => v.length > 1 && v.length <= 60);
        if (!propres.length) return "Aucune valeur exploitable.";
        const deja = await prisma.value.findMany({ where: { userId }, select: { label: true } });
        const connues = new Set(deja.map((v) => v.label.toLowerCase()));
        const nouvelles = propres.filter((v) => !connues.has(v.toLowerCase()));
        if (nouvelles.length) {
          await prisma.value.createMany({ data: nouvelles.map((label) => ({ userId, label })) });
        }
        return `Enregistré dans son profil : ${propres.join(", ")}. Dis-le-lui simplement ; elle peut les ajuster depuis « Profil ».`;
      },
    }),

    definir_objectifs_annee: tool({
      description:
        "Enregistre les grands objectifs de l'année (trois au maximum). Remplace les précédents. À utiliser quand la personne énonce ce qu'elle veut accomplir cette année.",
      inputSchema: z.object({
        objectifs: z
          .array(z.object({ intitule: z.string(), pourquoi: z.string() }))
          .describe("Jusqu'à trois objectifs, chacun avec la raison pour laquelle il compte"),
      }),
      execute: async ({ objectifs }) => {
        const year = new Date().getFullYear();
        const retenus = objectifs.slice(0, 3).filter((o) => o.intitule.trim());
        if (!retenus.length) return "Aucun objectif exploitable.";
        await prisma.annualGoal.deleteMany({ where: { userId, year } });
        await prisma.annualGoal.createMany({
          data: retenus.map((o, i) => ({
            userId,
            year,
            label: o.intitule.trim(),
            why: o.pourquoi?.trim() || null,
            order: i,
          })),
        });
        return `Les ${retenus.length} objectifs de ${year} sont posés. Ils apparaissent sur « Aujourd'hui ».`;
      },
    }),

    creer_projet: tool({
      description:
        "Crée un projet dans son espace. À utiliser quand elle décrit une intention structurée qui n'existe pas encore chez elle (vérifie avec lire_espace avant).",
      inputSchema: z.object({
        nom: z.string().describe("Nom court et clair du projet"),
        vision: z.string().describe("Ce à quoi ça ressemble une fois réussi, ou chaîne vide"),
        objectif: z.string().describe("Le résultat visé, ou chaîne vide"),
        statut: z
          .string()
          .describe("actif, secondaire, attente ou idée — « actif » seulement si elle y travaille maintenant"),
      }),
      execute: async ({ nom, vision, objectif, statut }) => {
        const titre = nom.trim();
        if (titre.length < 2) return "Nom de projet trop court.";
        if (await trouverProjet(userId, titre)) {
          return `Un projet « ${titre} » existe déjà : propose plutôt de le préciser.`;
        }
        const actifs = await prisma.project.count({
          where: { userId, deletedAt: null, status: "ACTIVE" },
        });
        const voulu = STATUTS[statut.trim().toLowerCase()] ?? "IDEA";
        // La règle des trois projets actifs est structurante : on ne la force pas.
        const retenu: ProjectStatus = voulu === "ACTIVE" && actifs >= 3 ? "SECONDARY" : voulu;
        const dernier = await prisma.project.findFirst({
          where: { userId, deletedAt: null },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        await prisma.project.create({
          data: {
            userId,
            name: titre,
            vision: vision.trim() || null,
            objective: objectif.trim() || null,
            status: retenu,
            order: (dernier?.order ?? 0) + 1,
          },
        });
        return retenu === voulu
          ? `Projet « ${titre} » créé (${retenu}). ENCHAÎNE MAINTENANT sur son cap du trimestre : trois questions, puis « definir_cap ». Un projet sans cap avance sans qu'on sache vers quoi.`
          : `Projet « ${titre} » créé en secondaire : elle a déjà trois projets actifs, c'est le maximum. Dis-le-lui et propose d'arbitrer.`;
      },
    }),

    modifier_projet: tool({
      description:
        "Précise ou fait évoluer un projet existant : vision, objectif, statut. Laisse vide ce qui ne change pas.",
      inputSchema: z.object({
        nom: z.string().describe("Nom du projet à modifier, tel qu'elle l'appelle"),
        vision: z.string().describe("Nouvelle vision, ou chaîne vide"),
        objectif: z.string().describe("Nouvel objectif, ou chaîne vide"),
        statut: z.string().describe("actif, secondaire, attente, idée, archivé — ou chaîne vide"),
      }),
      execute: async ({ nom, vision, objectif, statut }) => {
        const projet = await trouverProjet(userId, nom);
        if (!projet) return `Aucun projet « ${nom} » chez elle. Appelle lire_espace pour vérifier les noms.`;
        const data: { vision?: string; objective?: string; status?: ProjectStatus } = {};
        if (vision.trim()) data.vision = vision.trim();
        if (objectif.trim()) data.objective = objectif.trim();
        const s = STATUTS[statut.trim().toLowerCase()];
        if (s) data.status = s;
        if (!Object.keys(data).length) return "Rien à modifier.";
        await prisma.project.update({ where: { id: projet.id }, data });
        return `« ${projet.name} » mis à jour.`;
      },
    }),



    /**
     * Clore la journée — ou la semaine.
     *
     * C'était le maillon manquant : la conversation de bilan parlait sans rien
     * inscrire. On la refaisait donc indéfiniment, et l'application ne pouvait
     * pas savoir que la journée avait été rendue.
     *
     * À appeler à la FIN du bilan, une fois les quatre temps parcourus. Ce qui
     * est écrit ici nourrit les bilans de semaine et de mois.
     */
    clore_bilan: tool({
      description:
        "Enregistre le bilan une fois les quatre temps parcourus (accompli, appris, à ajuster, lâcher-prise). À appeler À LA FIN du bilan, jamais au début. Reprends ses mots à elle, pas les tiens.",
      inputSchema: z.object({
        cadence: z.string().describe("« soir » ou « semaine »"),
        accompli: z.string().describe("Ce qui a été mené à terme, dans ses mots"),
        appris: z.string().describe("Ce qu'elle en retient, ou chaîne vide"),
        ajuster: z.string().describe("Ce qu'elle veut changer, ou chaîne vide"),
        lacher: z.string().describe("Ce qu'elle accepte de ne pas porter, ou chaîne vide"),
        ressenti: z
          .string()
          .describe("« satisfaite », « mitigee » ou « insatisfaite » — d'après ce qu'elle a dit"),
      }),
      execute: async ({ cadence, accompli, appris, ajuster, lacher, ressenti }) => {
        const jour = new Date();
        jour.setHours(0, 0, 0, 0);
        const quand = cadence.toLowerCase().includes("semaine") ? "semaine" : "soir";

        await prisma.bilan.upsert({
          where: { userId_jour_cadence: { userId, jour, cadence: quand } },
          create: {
            userId,
            jour,
            cadence: quand,
            accompli: accompli.trim() || null,
            appris: appris.trim() || null,
            ajuster: ajuster.trim() || null,
            lacher: lacher.trim() || null,
            ressenti: ressenti.trim() || null,
          },
          update: {
            accompli: accompli.trim() || null,
            appris: appris.trim() || null,
            ajuster: ajuster.trim() || null,
            lacher: lacher.trim() || null,
            ressenti: ressenti.trim() || null,
          },
        });

        // Sans cela, l'écran d'Align resterait sur sa version d'avant : la
        // personne verrait « à faire » ce qu'elle vient de faire.
        revalidatePath("/aujourdhui");

        return quand === "soir"
          ? "Journée close et enregistrée. Elle apparaît maintenant comme faite dans Align. Dis-le-lui en une phrase, sans détailler."
          : "Semaine close et enregistrée. Dis-le-lui en une phrase.";
      },
    }),
    lire_cap: tool({
      description:
        "Lit le cap du trimestre d'un projet et l'avancement de chacun de ses résultats clés. À appeler AVANT de demander où elle en est, pour ne jamais redemander un chiffre déjà connu.",
      inputSchema: z.object({ projet: z.string().describe("Nom du projet") }),
      execute: async ({ projet }) => {
        const p = await trouverProjet(userId, projet);
        if (!p) return `Aucun projet « ${projet} » chez elle.`;
        const okr = await prisma.okr.findUnique({
          where: { projectId_period: { projectId: p.id, period: trimestre() } },
          select: {
            objective: true,
            keyResults: {
              orderBy: { order: "asc" },
              select: { label: true, target: true, current: true },
            },
          },
        });
        if (!okr) return `« ${p.name} » n'a pas encore de cap pour ce trimestre.`;

        // Ce qui a ete fait depuis trois semaines : de quoi deduire une
        // avancee sans avoir a la demander.
        const accomplies = await prisma.task.findMany({
          where: {
            projectId: p.id,
            deletedAt: null,
            status: "DONE",
            updatedAt: { gte: new Date(Date.now() - 21 * 86_400_000) },
          },
          orderBy: { updatedAt: "desc" },
          take: 15,
          select: { title: true, updatedAt: true },
        });
        return {
          projet: p.name,
          objectif: okr.objective,
          resultats: okr.keyResults.map((k) => ({
            intitule: k.label,
            cible: k.target,
            avancement: `${k.current} %`,
          })),
          accompliesDepuisTroisSemaines: accomplies.map(
            (t) => `${t.title} (le ${t.updatedAt.toLocaleDateString("fr-FR")})`,
          ),
        };
      },
    }),

    // Le pointage passe par la parole : « j'en ai fait cinq » vaut mieux qu'un
    // curseur qu'on traîne sans y penser.
    pointer_resultat: tool({
      description:
        "Enregistre l'avancement d'un résultat clé, en pourcentage, après que la personne a dit où elle en est. Convertis toi-même ses mots en pourcentage : « 5 sur 12 » vaut 42. Ne demande jamais un pourcentage — demande un état, et calcule.",
      inputSchema: z.object({
        projet: z.string().describe("Nom du projet"),
        resultat: z.string().describe("Intitulé du résultat clé, tel qu'il est enregistré"),
        pourcentage: z.number().describe("Avancement de 0 à 100"),
        note: z.string().describe("Ce qu'elle en a dit, en une phrase, ou chaîne vide"),
      }),
      execute: async ({ projet, resultat, pourcentage, note }) => {
        const p = await trouverProjet(userId, projet);
        if (!p) return `Aucun projet « ${projet} » chez elle.`;
        const okr = await prisma.okr.findUnique({
          where: { projectId_period: { projectId: p.id, period: trimestre() } },
          select: { keyResults: { select: { id: true, label: true } } },
        });
        if (!okr) return `« ${p.name} » n'a pas de cap ce trimestre.`;

        const cible = resultat.trim().toLowerCase();
        const kr =
          okr.keyResults.find((k) => k.label.toLowerCase() === cible) ??
          okr.keyResults.find((k) => k.label.toLowerCase().includes(cible)) ??
          okr.keyResults.find((k) => cible.includes(k.label.toLowerCase()));
        if (!kr) {
          return `Aucun résultat clé « ${resultat} ». Ceux qui existent : ${okr.keyResults
            .map((k) => k.label)
            .join(", ")}.`;
        }

        const valeur = Math.max(0, Math.min(100, Math.round(pourcentage)));

        // Lundi de la semaine courante : un pointage par semaine, pas par clic.
        const d = new Date();
        const jour = (d.getDay() + 6) % 7;
        const lundi = new Date(d.getFullYear(), d.getMonth(), d.getDate() - jour);

        await prisma.weeklyCheck.upsert({
          where: { keyResultId_weekOf: { keyResultId: kr.id, weekOf: lundi } },
          create: { keyResultId: kr.id, weekOf: lundi, value: valeur, note: note?.trim() || null },
          update: { value: valeur, note: note?.trim() || null },
        });
        await prisma.keyResult.update({ where: { id: kr.id }, data: { current: valeur } });

        // L'avancement du projet suit la moyenne de ses résultats clés.
        const tous = await prisma.keyResult.findMany({
          where: { okr: { projectId: p.id, period: trimestre() } },
          select: { current: true },
        });
        const moyenne = Math.round(tous.reduce((s, k) => s + k.current, 0) / (tous.length || 1));
        await prisma.project.update({ where: { id: p.id }, data: { progress: moyenne } });

        return `« ${kr.label} » est à ${valeur} %. Le projet « ${p.name} » passe à ${moyenne} %.`;
      },
    }),
    definir_cap: tool({
      description:
        "Pose le cap du trimestre pour un projet : un objectif et ses résultats clés mesurables. À utiliser quand un projet actif n'a pas de cap, ou quand elle veut le revoir.",
      inputSchema: z.object({
        projet: z.string().describe("Nom du projet"),
        objectif: z.string().describe("L'objectif du trimestre, en une phrase"),
        resultats: z
          .array(z.object({ intitule: z.string(), cible: z.string() }))
          .describe("Deux à quatre résultats clés mesurables, avec leur cible (ex. « 12 entretiens »)"),
      }),
      execute: async ({ projet, objectif, resultats }) => {
        const p = await trouverProjet(userId, projet);
        if (!p) return `Aucun projet « ${projet} » chez elle.`;
        const retenus = resultats.slice(0, 4).filter((r) => r.intitule.trim());
        if (!objectif.trim() || !retenus.length) return "Il faut un objectif et au moins un résultat clé.";
        const period = trimestre();
        const okr = await prisma.okr.upsert({
          where: { projectId_period: { projectId: p.id, period } },
          create: { projectId: p.id, period, objective: objectif.trim() },
          update: { objective: objectif.trim() },
        });
        await prisma.keyResult.deleteMany({ where: { okrId: okr.id } });
        await prisma.keyResult.createMany({
          data: retenus.map((r, i) => ({
            okrId: okr.id,
            label: r.intitule.trim(),
            target: r.cible?.trim() || null,
            order: i,
          })),
        });
        return `Cap du ${period} posé pour « ${p.name} » : ${retenus.length} résultats clés. Elle les pointe chaque semaine depuis « Projets ».`;
      },
    }),
  };
}
