import Link from "next/link";

export type ProjetLigne = {
  id: string;
  nom: string;
  objectif: string | null;
  cap: string | null;
  avancement: number;
};

/**
 * Les projets de Build : les trois actifs, et rien de plus.
 *
 * La règle des trois n'est pas un réglage, c'est le cœur du produit — au-delà,
 * on n'avance plus, on entretient. Les autres existent bien, mais ils sont
 * comptés, pas listés : les afficher reviendrait à les rendre actifs par la
 * vue alors qu'ils ne le sont pas.
 *
 * Tout ce qui touche à l'ordre, au statut ou à la suppression se fait dans
 * « Gérer mes projets ». Un écran qui montre ET qui édite finit par faire mal
 * les deux.
 */
export function ProjetsBuild({
  actifs,
  autres,
}: {
  actifs: ProjetLigne[];
  autres: number;
}) {
  return (
    <section className="enter flex flex-col gap-2.5" style={{ "--i": 2 } as React.CSSProperties}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Tes projets actifs · {actifs.length} / 3
        </span>
        <Link
          href="/projets"
          className="press flex-none text-[11px] font-semibold text-gold-deep"
        >
          Gérer →
        </Link>
      </div>

      {actifs.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-ink/20 bg-surface-2/50 px-5 py-6 text-center">
          <p className="voice-amana text-[15px]">Aucun projet actif.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Touche le micro et dis ce que tu portes : AMANA en fera des projets clairs.
          </p>
        </div>
      ) : (
        actifs.map((p, i) => (
          <Link
            key={p.id}
            href={`/conversation?projet=${p.id}`}
            className="press lift block rounded-[18px] bg-surface p-4"
          >
            <span className="flex items-baseline gap-2.5">
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gold-soft text-[10px] font-bold text-gold-deep">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{p.nom}</span>
            </span>

            <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-ink/8">
              <span
                className="bar-fill block h-full rounded-full bg-gold"
                style={{ width: `${Math.max(p.avancement, 3)}%` }}
              />
            </span>

            <span className="mt-2 block text-[13px] leading-snug text-ink-soft">
              {p.cap ? (
                <>
                  Cap du trimestre : <b className="font-semibold text-ink">{p.cap}</b>
                </>
              ) : p.objectif ? (
                <>
                  Objectif : <b className="font-semibold text-ink">{p.objectif}</b>
                </>
              ) : (
                <span className="text-gold-deep">Sans cap ni objectif — à préciser.</span>
              )}
            </span>
          </Link>
        ))
      )}

      {autres > 0 && (
        <Link
          href="/projets"
          className="press self-start px-1 text-xs text-ink-faint underline underline-offset-4"
        >
          {autres} autre{autres > 1 ? "s" : ""} en réserve
        </Link>
      )}
    </section>
  );
}
