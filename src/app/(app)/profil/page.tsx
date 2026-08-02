import { auth } from "@/auth";
import { getProfile } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AccountActions } from "./AccountActions";
import { Valeurs } from "./Valeurs";
import { ActiverPush } from "@/components/ActiverPush";

export default async function ProfilPage() {
  const session = await auth();
  const user = session!.user;
  const profile = await getProfile(user.id);
  const valeurs = await prisma.value.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, label: true },
  });
  const prenom = user.name?.trim().split(" ")[0] || "toi";

  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      <h1 className="voice-amana text-2xl">Ton histoire</h1>

      <section className="flex items-center gap-3 rounded-[22px] bg-surface p-5">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-12 w-12 rounded-full" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/30 font-bold">
            {(user.name?.trim()[0] || "A").toUpperCase()}
          </span>
        )}
        <div>
          <p className="font-semibold">{user.name || "Compte AMANA"}</p>
          <p className="text-sm text-ink-faint">{user.email}</p>
        </div>
      </section>

      <section className="rounded-[22px] bg-surface p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          Synthèse
        </span>
        <p className="voice-amana mt-2 text-[15px] leading-relaxed">
          {profile?.vision
            ? `${prenom} — ${profile.vision}.`
            : "Ta vision se précisera à ton rythme, au fil des échanges."}
        </p>
      </section>

      <Valeurs valeurs={valeurs} />

      {/* On ne demande jamais la permission a l'arrivee : un refus est
          definitif, le navigateur ne redemande plus. */}
      <ActiverPush clePublique={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />

      <section className="rounded-[22px] bg-surface p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Domaines qui comptent
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {(profile?.domaines?.length ? profile.domaines : ["À définir"]).map((d) => (
            <span key={d} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm text-ink-soft">
              {d}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] bg-surface p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Comment AMANA s&apos;adapte à toi
        </span>
        <p className="mt-2 text-sm text-ink-soft">
          {profile?.style || "Ton style d'accompagnement se précisera au fil des échanges."}
        </p>
      </section>

      <section className="rounded-[22px] border border-ink/10 p-5">
        <span className="font-semibold">Ma mémoire</span>
        <p className="mt-1 text-sm text-ink-soft">
          Tout ce qu&apos;AMANA retient t&apos;appartient : tu pourras consulter, modifier ou
          supprimer chaque élément. Cet écran s&apos;enrichira avec la mémoire IA.
        </p>
      </section>

      <AccountActions />
    </main>
  );
}
