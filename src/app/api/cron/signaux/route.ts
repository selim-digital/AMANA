import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/email";

export const maxDuration = 60;

/**
 * Le déclencheur quotidien : AMANA regarde où en est chacun et n'envoie qu'un
 * signal, seulement s'il est utile.
 *
 * Règles de sobriété, non négociables :
 *  · une notification par personne et par jour, maximum ;
 *  · un email seulement si la personne ne s'est pas connectée depuis 3 jours,
 *    et jamais plus de deux par semaine ;
 *  · jamais de reproche : on rappelle, on n'accuse pas.
 */

const JOUR = 86_400_000;
const ilYA = (j: number) => new Date(Date.now() - j * JOUR);

export async function GET(req: Request) {
  // Vercel signe ses appels de cron ; on refuse tout le reste.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Seulement les personnes réellement actives : on ne réveille pas les comptes
  // dormants, et on ne paie pas pour eux.
  const users = await prisma.user.findMany({
    where: { lastLoginAt: { gte: ilYA(30) } },
    select: { id: true, name: true, email: true, notifyEmail: true, lastLoginAt: true },
    take: 500,
  });

  let creees = 0;
  let envoyees = 0;

  for (const u of users) {
    // Plafond : une notification par jour.
    const dejaAujourdhui = await prisma.notification.count({
      where: { userId: u.id, createdAt: { gte: ilYA(1) } },
    });
    if (dejaAujourdhui > 0) continue;

    const [tachesVieilles, projetsActifs, okrsPeriode, faitesSemaine] = await Promise.all([
      prisma.task.findMany({
        where: { userId: u.id, deletedAt: null, status: { notIn: ["DONE"] }, createdAt: { lte: ilYA(7) } },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { title: true },
      }),
      prisma.project.findMany({
        where: { userId: u.id, deletedAt: null, status: "ACTIVE" },
        select: { id: true, name: true },
      }),
      prisma.okr.findMany({
        where: { project: { userId: u.id, deletedAt: null, status: "ACTIVE" } },
        select: { projectId: true },
      }),
      prisma.task.count({
        where: { userId: u.id, deletedAt: null, status: "DONE", updatedAt: { gte: ilYA(7) } },
      }),
    ]);

    const sansCap = projetsActifs.filter((p) => !okrsPeriode.some((o) => o.projectId === p.id));

    // Un seul signal, choisi par ordre d'utilité — jamais une liste de rappels.
    let signal: { kind: string; title: string; body: string; href: string } | null = null;

    if (faitesSemaine >= 3) {
      signal = {
        kind: "encouragement",
        title: "Ta semaine avance",
        body: `${faitesSemaine} actions terminées ces sept derniers jours. C'est le rythme qui compte, pas l'intensité.`,
        href: "/aujourdhui?u=build",
      };
    } else if (sansCap.length > 0) {
      signal = {
        kind: "cap_manquant",
        title: "Un projet sans cap",
        body: `« ${sansCap[0].name} » est actif mais n'a pas d'objectif pour ce trimestre. Poser un cap, ou le décaler : les deux sont des choix valables.`,
        href: "/projets",
      };
    } else if (tachesVieilles.length > 0) {
      signal = {
        kind: "relance",
        title: "Une action t'attend",
        body: `« ${tachesVieilles[0].title} » attend depuis une semaine. Peut-être qu'elle peut être réduite à dix minutes — ou qu'elle n'est plus la priorité.`,
        href: "/aujourdhui?u=build",
      };
    }

    if (!signal) continue;

    const notif = await prisma.notification.create({
      data: { userId: u.id, ...signal },
    });
    creees += 1;

    // L'email ne part que si la personne s'est absentée, et jamais en rafale.
    const absente = !u.lastLoginAt || u.lastLoginAt < ilYA(3);
    const emailsSemaine = await prisma.notification.count({
      where: { userId: u.id, emailedAt: { gte: ilYA(7) } },
    });

    if (u.notifyEmail && u.email && absente && emailsSemaine < 2) {
      const ok = await sendNotification(u.email, signal.title, signal.body, signal.href);
      if (ok) {
        await prisma.notification.update({
          where: { id: notif.id },
          data: { emailedAt: new Date() },
        });
        envoyees += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, examines: users.length, creees, envoyees });
}
