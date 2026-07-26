import { DesertScene, ForestScene, OceanScene } from "@/components/Scenes";

/** Galerie interne de contrôle qualité des univers (revue design). */
export default function ScenesPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <h1 className="voice-amana text-2xl">Les trois univers</h1>
      {[
        { nom: "Desert Path — La Source", Scene: DesertScene },
        { nom: "Forest Path — Build", Scene: ForestScene },
        { nom: "Ocean Path — Align", Scene: OceanScene },
      ].map(({ nom, Scene }) => (
        <figure key={nom} className="m-0">
          <div className="overflow-hidden rounded-[22px]">
            <Scene className="aspect-[16/7] w-full" />
          </div>
          <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-ink-faint">
            {nom}
          </figcaption>
        </figure>
      ))}
    </main>
  );
}
