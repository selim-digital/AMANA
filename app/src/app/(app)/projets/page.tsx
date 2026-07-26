const groupes: { statut: string; note?: string; projets: { nom: string; action: string; pct: number }[] }[] = [
  {
    statut: "Actifs",
    note: "3 max — pour rester concentré",
    projets: [
      { nom: "Développement AMANA", action: "Valider le périmètre MVP", pct: 72 },
    ],
  },
  { statut: "Secondaires", projets: [] },
  { statut: "En attente", projets: [] },
  {
    statut: "Futurs — boîte à idées",
    projets: [{ nom: "Programme ambassadeurs", action: "À mûrir, sans pression", pct: 0 }],
  },
];

export default function ProjetsPage() {
  return (
    <main className="flex flex-col gap-6 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="voice-amana text-2xl">Projets</h1>
        <button className="rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#12100D]">
          Nouveau
        </button>
      </header>

      {groupes.map((g) => (
        <section key={g.statut} className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {g.statut}
            </h2>
            {g.note && <span className="text-[11px] text-ink-faint">· {g.note}</span>}
          </div>
          {g.projets.length === 0 ? (
            <p className="rounded-[16px] bg-surface-2 px-4 py-3 text-sm text-ink-faint">
              Rien ici pour l'instant — et c'est très bien.
            </p>
          ) : (
            g.projets.map((p) => (
              <div key={p.nom} className="rounded-[18px] border border-ink/10 bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{p.nom}</span>
                  <span className="text-xs tabular-nums text-ink-faint">{p.pct} %</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${p.pct}%` }} />
                </div>
                <p className="mt-2 text-sm text-ink-soft">Prochaine action : {p.action}</p>
              </div>
            ))
          )}
        </section>
      ))}
    </main>
  );
}
