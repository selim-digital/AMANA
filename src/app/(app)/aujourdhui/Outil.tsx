import Link from "next/link";

/**
 * L'outil principal d'un univers.
 *
 * Chaque monde a UN instrument, et un seul. Ce n'est pas un raccourci parmi
 * d'autres : c'est ce qu'on vient y faire quand on ne sait pas quoi faire.
 * Il occupe donc une carte pleine, sombre, impossible à confondre avec le
 * reste — et il dit ce qui l'attend, sinon ce n'est qu'un bouton de plus.
 */
export function Outil({
  nom,
  quoi,
  attente,
  cta,
  href,
  icone,
}: {
  nom: string;
  /** Ce que l'outil fait, en une phrase. */
  quoi: string;
  /** Ce qui l'attend précisément, ou null s'il n'y a rien à signaler. */
  attente: string | null;
  cta: string;
  href: string;
  icone: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="enter press lift relative block overflow-hidden rounded-[22px] bg-panel p-5 text-panel-text"
      style={{ "--i": 3 } as React.CSSProperties}
    >
      <span className="flex items-start gap-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gold text-[#12100D]">
          {icone}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">
            L&apos;outil de cet univers
          </span>
          <span className="voice-amana mt-0.5 block text-xl leading-tight">{nom}</span>
          <span className="mt-1.5 block text-[13px] leading-relaxed opacity-80">{quoi}</span>
        </span>
      </span>

      {attente && (
        <span className="mt-4 block rounded-[14px] bg-white/10 px-4 py-2.5 text-[13px] leading-snug">
          {attente}
        </span>
      )}

      <span className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gold">
        {cta} <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
