export function AmanaMark({
  className = "h-12 w-12",
  eveil = false,
}: {
  className?: string;
  /**
   * L'éveil : le carré arrive légèrement pivoté, se redresse, les points
   * s'allument un à un et l'or diffuse un halo. C'est une entrée, pas une
   * boucle — réservée aux transitions d'écran et à l'arrivée des modales.
   */
  eveil?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`${eveil ? "eveil " : ""}${className}`}
      aria-label="Symbole AMANA"
    >
      <rect x="10" y="10" width="180" height="180" rx="52" className="fill-ink" />
      <circle cx="66" cy="134" r="13" className="fill-paper pt1" />
      <circle cx="100" cy="100" r="13" className="fill-paper pt2" />
      {/* Le halo se diffuse depuis le point d'or, puis s'efface. */}
      <circle cx="136" cy="64" r="14.5" className="fill-gold halo-or" />
      <circle cx="136" cy="64" r="14.5" className="fill-gold pt3" />
    </svg>
  );
}

export function Wordmark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-[0.38em] indent-[0.38em] ${className}`}>AMANA</span>
  );
}
