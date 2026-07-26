import { DesertScene } from "@/components/Scenes";

const worlds = [
  {
    title: "CARE",
    detail: "Family · Health · Relationships",
    className: "bg-panel text-panel-text",
  },
  { title: "GROW", detail: "Business · Skills · Projects", className: "bg-stone text-[#161310]" },
  {
    title: "ALIGN",
    detail: "Vision · Values · Purpose",
    className: "bg-gold text-[#12100D]",
  },
];

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <svg viewBox="0 0 200 200" className="h-20 w-20" aria-label="Symbole AMANA">
          <rect x="10" y="10" width="180" height="180" rx="52" className="fill-ink" />
          <circle cx="66" cy="134" r="13" className="fill-paper" />
          <circle cx="100" cy="100" r="13" className="fill-paper" />
          <circle cx="136" cy="64" r="14.5" className="fill-gold" />
        </svg>
        <h1 className="text-3xl font-extrabold tracking-[0.38em] indent-[0.38em]">AMANA</h1>
        <p className="voice-amana max-w-md text-balance text-xl text-ink-soft">
          Build what matters. Take care of what is entrusted to you. Grow with purpose. Align your
          actions.
        </p>
      </div>

      <div className="w-full max-w-3xl overflow-hidden rounded-[22px]">
        <DesertScene className="aspect-[16/7] w-full" />
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {worlds.map((world) => (
          <div
            key={world.title}
            className={`flex min-h-32 flex-col justify-end rounded-[22px] p-5 ${world.className}`}
          >
            <span className="text-lg font-bold tracking-widest">{world.title}</span>
            <span className="text-sm opacity-80">{world.detail}</span>
          </div>
        ))}
      </div>

      <a
        href="/login"
        className="rounded-full bg-gold px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-[#12100D]"
      >
        Commencer mon chemin
      </a>
      <p className="text-xs uppercase tracking-[0.28em] text-ink-faint">
        MVP en construction — bi-idniLlah
      </p>
    </main>
  );
}
