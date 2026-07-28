/** Squelettes ivoire pendant le chargement — jamais d'écran vide. */
export default function Loading() {
  return (
    <main className="flex animate-pulse flex-col gap-5 px-5 py-6" aria-busy="true" aria-label="Chargement">
      <div className="h-9 w-40 rounded-lg bg-surface-2" />
      <div className="h-20 rounded-[16px] bg-surface-2" />
      <div className="flex flex-col gap-2">
        <div className="h-14 rounded-[16px] bg-gold-soft/60" />
        <div className="h-14 rounded-[16px] bg-surface-2" />
        <div className="h-14 rounded-[16px] bg-surface-2" />
      </div>
      <div className="h-32 rounded-[20px] bg-surface-2" />
    </main>
  );
}
