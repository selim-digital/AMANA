"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { commitDecharge } from "@/lib/actions";

/** SCR-DUMP + SCR-DUMP-REVIEW — la fonction centrale : déposer, puis valider le classement.
 *  Sprint 1 : structuration de démonstration locale ; l'appel IA réel (tool use
 *  `structurer_decharge`) se branche au Sprint 2 avec la clé API. */

type Item = { type: "Projet" | "Tâche" | "Décision" | "Rappel"; titre: string };

function structurationDemo(texte: string): Item[] {
  return texte
    .split(/[\n.;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .slice(0, 8)
    .map((s) => {
      const low = s.toLowerCase();
      const type: Item["type"] = /appeler|envoyer|acheter|réserver|payer|relire|finir/.test(low)
        ? "Tâche"
        : /penser à|ne pas oublier|rappel/.test(low)
        ? "Rappel"
        : /choisir|décider|trancher/.test(low)
        ? "Décision"
        : s.length > 60
        ? "Projet"
        : "Tâche";
      return { type, titre: s.charAt(0).toUpperCase() + s.slice(1) };
    });
}

export default function DeposerPage() {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [saving, startSaving] = useTransition();

  if (items) {
    return (
      <main className="flex flex-col gap-4 px-5 py-6">
        <h1 className="voice-amana text-2xl">Voici ce qu'AMANA propose</h1>
        <p className="text-sm text-ink-soft">
          Rien n'est créé sans ta validation. Corrige ou rejette librement.
        </p>
        <div className="flex flex-col gap-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-3 rounded-[16px] border border-ink/10 bg-surface px-4 py-3">
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                {it.type}
              </span>
              <span className="flex-1 text-sm">{it.titre}</span>
              <button
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                aria-label="Rejeter"
                className="text-ink-faint"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            startSaving(async () => {
              await commitDecharge(items.map((it) => ({ type: it.type, titre: it.titre })));
              router.push("/aujourdhui");
            })
          }
          disabled={saving}
          className="rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Tout valider"}
        </button>
        <button onClick={() => setItems(null)} className="text-sm text-ink-faint">
          Revenir au texte
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70dvh] flex-col gap-4 px-5 py-6">
      <h1 className="voice-amana text-2xl">Dépose ce que tu as en tête</h1>
      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="En vrac, sans ordre, sans structure. Tout ce qui occupe ton esprit a sa place ici."
        className="voice-amana flex-1 resize-none rounded-[22px] border border-ink/10 bg-surface p-5 text-[15px] leading-relaxed outline-none placeholder:text-ink-faint focus:border-gold"
      />
      <button
        onClick={() => setItems(structurationDemo(texte))}
        disabled={texte.trim().length < 4}
        className="rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-40"
      >
        Déposer
      </button>
    </main>
  );
}
