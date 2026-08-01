import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Plongee, type SignalVue } from "./Plongee";

export const dynamic = "force-dynamic";

export default async function DeepDivePage() {
  const session = await auth();
  const userId = session!.user.id;

  // La plongée en cours, ou la dernière close.
  const plongee = await prisma.deepDiveSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { signaux: { orderBy: { createdAt: "asc" } } },
  });

  const signaux: SignalVue[] =
    plongee?.signaux.map((s) => ({
      id: s.id,
      niveau: s.niveau,
      hypothese: s.hypothese,
      fondement: s.fondement,
      verdict: s.verdict,
      verbatim: s.verbatim,
    })) ?? [];

  return (
    <Plongee
      sessionId={plongee?.id ?? null}
      niveau={plongee?.niveau ?? 1}
      signaux={signaux}
      close={plongee?.status === "close"}
      synthese={plongee?.synthese ? JSON.parse(plongee.synthese) : null}
      tranchees={signaux.filter((x) => x.verdict !== "EN_ATTENTE").length}
    />
  );
}
