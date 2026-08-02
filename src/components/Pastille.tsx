/**
 * La pastille de notification d'un univers.
 *
 * Un rond noir posé sur un paysage se lit comme un défaut d'impression : il
 * ne dit pas qu'il attend quelque chose. Le liseré doré le rattache à la
 * marque, et l'onde qui s'en échappe le fait exister sans clignoter — on doit
 * le remarquer du coin de l'œil, pas le subir.
 */
export function Pastille({
  nombre,
  taille = "grande",
}: {
  nombre: number;
  /** « grande » sur la carte du paquet, « petite » sur les miniatures. */
  taille?: "grande" | "petite";
}) {
  if (nombre <= 0) return null;
  const grand = taille === "grande";

  return (
    <span className={`relative inline-flex ${grand ? "h-7 min-w-7" : "h-5 min-w-5"}`}>
      {/* Deux ondes décalées : une seule paraît mécanique, trois font sapin. */}
      <span className="onde absolute inset-0 rounded-full bg-gold" aria-hidden />
      <span className="onde onde-2 absolute inset-0 rounded-full bg-gold" aria-hidden />
      <span
        className={`relative inline-flex items-center justify-center rounded-full bg-ink font-bold text-paper ring-1 ring-gold ${
          grand ? "h-7 min-w-7 px-2 text-xs" : "h-5 min-w-5 px-1.5 text-[10px]"
        }`}
      >
        {nombre > 9 ? "9+" : nombre}
      </span>
    </span>
  );
}
