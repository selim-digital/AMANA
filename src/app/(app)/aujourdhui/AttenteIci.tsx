import Link from "next/link";

/**
 * Ce qui t'attend dans cet univers.
 *
 * On entrait dans un monde sans savoir ce qu'on venait y faire : les pastilles
 * annonçaient un nombre, l'écran ne disait pas quoi. Ce bandeau nomme la
 * chose attendue, et une seule — la première. Les autres sont comptées, pas
 * listées : trois attentes affichées ensemble ne se hiérarchisent plus.
 *
 * Quand rien n'attend, on le dit aussi. Un univers calme est une information.
 */
export function AttenteIci({
  motifs,
  href,
  calme,
}: {
  motifs: string[];
  /** Où mène le premier motif. */
  href: string | null;
  /** Ce qu'on affiche quand rien n'attend — propre à chaque univers. */
  calme: string;
}) {
  if (!motifs.length) {
    return (
      <p className="enter rounded-[16px] bg-surface-2/60 px-4 py-3 text-[13px] leading-snug text-ink-faint">
        {calme}
      </p>
    );
  }

  const [premier, ...reste] = motifs;

  return (
    <section
      className="enter appelle rounded-[18px] border-l-[3px] border-gold bg-surface px-4 py-3.5"
      style={{ "--i": 1 } as React.CSSProperties}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
        Ce qui t&apos;attend ici
      </span>
      <p className="voice-amana mt-1 text-[15px] leading-snug">{premier}</p>

      <div className="mt-2.5 flex items-center gap-3">
        {href && (
          <Link
            href={href}
            className="press rounded-full bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-paper"
          >
            S&apos;en occuper
          </Link>
        )}
        {reste.length > 0 && (
          <span className="text-[11px] text-ink-faint">
            et {reste.length} autre{reste.length > 1 ? "s" : ""} ensuite
          </span>
        )}
      </div>
    </section>
  );
}
