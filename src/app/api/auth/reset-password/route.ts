// Applique un nouveau mot de passe à partir d'un token valide.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "8 caractères minimum"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error?.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });
  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({ where: { email: record.email }, data: { hashedPassword } });
  await prisma.passwordResetToken.deleteMany({ where: { email: record.email } });

  return NextResponse.json({ ok: true });
}
