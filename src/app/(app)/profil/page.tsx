"use client";

import { useEffect, useState } from "react";

type Onb = { prenom?: string; vision?: string; domaines?: string[]; motivation?: string; style?: string };

export default function ProfilPage() {
  const [onb, setOnb] = useState<Onb>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("amana.onboarding");
      if (raw) setOnb(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      <h1 className="voice-amana text-2xl">Ton histoire</h1>

      <section className="rounded-[22px] bg-surface p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          Synthèse
        </span>
        <p className="voice-amana mt-2 text-[15px] leading-relaxed">
          {onb.prenom
            ? `${onb.prenom} — ${onb.vision || "vision à préciser, à ton rythme"}.`
            : "Complète ton chemin d'accueil pour voir ta synthèse ici."}
        </p>
      </section>

      <section className="rounded-[22px] bg-surface p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Domaines qui comptent
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {(onb.domaines?.length ? onb.domaines : ["À définir"]).map((d) => (
            <span key={d} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm text-ink-soft">
              {d}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] bg-surface p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Comment AMANA s'adapte à toi
        </span>
        <p className="mt-2 text-sm text-ink-soft">
          {onb.style || "Ton style d'accompagnement se précisera au fil des échanges."}
        </p>
      </section>

      <section className="rounded-[22px] border border-ink/10 p-5">
        <span className="font-semibold">Ma mémoire</span>
        <p className="mt-1 text-sm text-ink-soft">
          Tout ce qu'AMANA retient t'appartient : tu pourras consulter, modifier ou supprimer chaque
          élément. Cet écran s'active avec la mémoire au Sprint 2.
        </p>
      </section>
    </main>
  );
}
