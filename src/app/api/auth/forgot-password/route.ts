// Demande de réinitialisation : crée un token et envoie l'email. Réponse toujours 200
// (on ne révèle jamais si l'email existe ou non).
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordReset } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: true });

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Seuls les comptes avec mot de passe peuvent le réinitialiser.
  if (user?.hashedPassword) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 h
    await prisma.passwordResetToken.create({ data: { email, token, expires } });

    const origin = new URL(req.url).origin;
    await sendPasswordReset(email, `${origin}/reset-password?token=${token}`);
  }

  return NextResponse.json({ ok: true });
}
