import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * L'abonnement d'un appareil aux notifications poussées.
 *
 * Le navigateur produit l'abonnement ; on ne fait que le ranger. L'endpoint
 * est unique : réabonner le même appareil met à jour au lieu de dupliquer.
 */

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;

  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const cle = body?.keys?.auth;
  if (!endpoint || !p256dh || !cle) {
    return NextResponse.json({ error: "Abonnement incomplet" }, { status: 400 });
  }

  await prisma.abonnement.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth: cle },
    update: { userId, p256dh, auth: cle, echecs: 0 },
  });

  return NextResponse.json({ ok: true });
}

/** Se désabonner : l'appareil ne recevra plus rien. */
export async function DELETE(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { endpoint } = ((await req.json().catch(() => ({}))) ?? {}) as { endpoint?: string };
  if (!endpoint) return NextResponse.json({ error: "Endpoint manquant" }, { status: 400 });

  await prisma.abonnement.deleteMany({ where: { userId, endpoint } });
  return NextResponse.json({ ok: true });
}
