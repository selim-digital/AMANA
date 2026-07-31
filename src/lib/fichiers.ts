/**
 * Préparation des pièces jointes pour la conversation.
 *
 * Trois voies, assumées :
 *  1. Images et PDF  → transmis tels quels au modèle.
 *  2. Fichiers texte → lus et intégrés au message (couvre .md, .csv, .json, code…).
 *  3. Le reste       → refusé avec une explication utile, jamais une erreur brute.
 */

export type PieceJointe = { nom: string; type: string; donnees: string };
export type Preparation =
  | { ok: true; piece?: PieceJointe; texte?: string }
  | { ok: false; raison: string };

const MAX_OCTETS = 8 * 1024 * 1024; // 8 Mo

/** Extensions lisibles comme du texte, même quand le navigateur ne les type pas. */
const TEXTE = /\.(txt|md|markdown|csv|tsv|json|ya?ml|log|html?|css|jsx?|tsx?|py|sql|xml|ics)$/i;

export async function preparerFichier(f: File): Promise<Preparation> {
  if (f.size > MAX_OCTETS) {
    return { ok: false, raison: `« ${f.name} » dépasse 8 Mo. Envoie une version plus légère.` };
  }

  const type = f.type || "";

  // 1. Images et PDF : le modèle les lit directement.
  if (type.startsWith("image/") || type === "application/pdf") {
    const donnees = await enBase64(f);
    return { ok: true, piece: { nom: f.name, type, donnees } };
  }

  // 2. Texte : on l'intègre au message.
  if (type.startsWith("text/") || type === "application/json" || TEXTE.test(f.name)) {
    const brut = await f.text();
    const coupe = brut.slice(0, 40_000);
    return {
      ok: true,
      texte:
        `\n\n--- Contenu de « ${f.name} » ---\n${coupe}` +
        (brut.length > coupe.length ? "\n[…fichier tronqué]" : ""),
    };
  }

  // 3. Refus explicite et utile.
  const bureautique = /\.(docx?|xlsx?|pptx?|odt|ods|pages|numbers)$/i.test(f.name);
  return {
    ok: false,
    raison: bureautique
      ? `« ${f.name} » n'est pas encore lisible directement. Exporte-le en PDF, ou copie le texte dans le message.`
      : `« ${f.name} » n'est pas un format que je peux lire. Les images, les PDF et les fichiers texte fonctionnent.`,
  };
}

function enBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      resolve(s.slice(s.indexOf(",") + 1)); // on retire l'en-tête data:
    };
    r.onerror = () => reject(new Error("lecture impossible"));
    r.readAsDataURL(f);
  });
}
