/** Magasin local du Sprint 1 : localStorage, même forme que le futur schéma
 *  Supabase (DOMAIN_MODEL.md) pour un branchement sans réécriture au Sprint 2. */

export type StatutProjet = "actif" | "secondaire" | "attente" | "futur" | "abandonne";

export type Projet = {
  id: string;
  nom: string;
  statut: StatutProjet;
  vision?: string;
  objectif?: string;
  action?: string;
  date?: string;
  pct?: number;
};

export type Tache = {
  id: string;
  titre: string;
  type: "tache" | "rappel" | "decision";
  faite: boolean;
};

export type Onboarding = {
  prenom?: string;
  situation?: string;
  vision?: string;
  domaines?: string[];
  projets?: string;
  charge?: string;
  style?: string;
  motivation?: string;
  porte?: string;
};

const K = { onb: "amana.onboarding", projets: "amana.projets", taches: "amana.taches" };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const getOnboarding = () => read<Onboarding>(K.onb, {});
export const getProjets = () => read<Projet[]>(K.projets, []);
export const getTaches = () => read<Tache[]>(K.taches, []);
export const saveProjets = (p: Projet[]) => write(K.projets, p);
export const saveTaches = (t: Tache[]) => write(K.taches, t);

const uid = () => Math.random().toString(36).slice(2, 10);

/** Règle produit : max 3 projets actifs — au-delà, le projet part en « futurs ». */
export function validerDecharge(items: { type: string; titre: string }[]) {
  const projets = getProjets();
  const taches = getTaches();
  for (const it of items) {
    if (it.type === "Projet") {
      const actifs = projets.filter((p) => p.statut === "actif").length;
      projets.push({ id: uid(), nom: it.titre, statut: actifs < 3 ? "actif" : "futur", pct: 0 });
    } else {
      const type = it.type === "Rappel" ? "rappel" : it.type === "Décision" ? "decision" : "tache";
      taches.push({ id: uid(), titre: it.titre, type, faite: false });
    }
  }
  saveProjets(projets);
  saveTaches(taches);
}

export function basculerTache(id: string) {
  const taches = getTaches().map((t) => (t.id === id ? { ...t, faite: !t.faite } : t));
  saveTaches(taches);
  return taches;
}
