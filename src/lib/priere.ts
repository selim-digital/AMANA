/**
 * Les horaires de prière, calculés sur l'appareil.
 *
 * Ils rythment les cinq rendez-vous quotidiens d'AMANA. Rien n'est dit à la
 * personne de ce calage : elle constate seulement que l'app arrive au bon
 * moment. C'est le propre d'un bon rythme — il ne s'annonce pas.
 *
 * Le calcul est local et hors ligne : aucune position n'est envoyée à un
 * service tiers. Astronomie standard (position du soleil, équation du temps),
 * la même que celle des calendriers de mosquée.
 */

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/** Conventions de calcul. Le doute sur l'angle relève du fiqh, pas du code. */
export const METHODES = {
  // Ligue Islamique Mondiale — la convention la plus répandue en France.
  mwl: { nom: "Ligue Islamique Mondiale", fajr: 18, isha: 17, ishaApresMaghrib: 0 },
  // Umm al-Qura (La Mecque) — celle de Nusuk : Isha 90 min après le Maghrib.
  umm_al_qura: { nom: "Umm al-Qura (La Mecque)", fajr: 18.5, isha: 0, ishaApresMaghrib: 90 },
  // ISNA — Amérique du Nord.
  isna: { nom: "ISNA (Amérique du Nord)", fajr: 15, isha: 15, ishaApresMaghrib: 0 },
  // Université de Karachi — sous-continent indien.
  karachi: { nom: "Université de Karachi", fajr: 18, isha: 18, ishaApresMaghrib: 0 },
} as const;

export type Methode = keyof typeof METHODES;
export type NomPriere = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRIERES: NomPriere[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

/** Jour julien à 0h UT. */
function julien(annee: number, mois: number, jour: number) {
  if (mois <= 2) {
    annee -= 1;
    mois += 12;
  }
  const a = Math.floor(annee / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (annee + 4716)) + Math.floor(30.6001 * (mois + 1)) + jour + b - 1524.5
  );
}

/** Déclinaison du soleil et équation du temps, pour un jour julien donné. */
function soleil(jd: number) {
  const d = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * d) % 360; // anomalie moyenne
  const q = (280.459 + 0.98564736 * d) % 360; // longitude moyenne
  const l = (q + 1.915 * Math.sin(g * D2R) + 0.02 * Math.sin(2 * g * D2R)) % 360;
  const e = 23.439 - 0.00000036 * d; // obliquité de l'écliptique

  const declinaison = R2D * Math.asin(Math.sin(e * D2R) * Math.sin(l * D2R));
  let ascension =
    (R2D * Math.atan2(Math.cos(e * D2R) * Math.sin(l * D2R), Math.cos(l * D2R))) / 15;
  ascension = (ascension + 24) % 24;

  // Équation du temps, en heures.
  let eqt = q / 15 - ascension;
  if (eqt > 12) eqt -= 24;
  if (eqt < -12) eqt += 24;

  return { declinaison, eqt };
}

/**
 * Angle horaire (en heures) séparant le midi solaire du moment où le soleil
 * atteint l'altitude donnée. `null` aux latitudes où ça n'arrive jamais —
 * l'été polaire n'est pas une erreur de calcul.
 */
function angleHoraire(altitude: number, latitude: number, declinaison: number): number | null {
  const num = -Math.sin(altitude * D2R) - Math.sin(declinaison * D2R) * Math.sin(latitude * D2R);
  const den = Math.cos(declinaison * D2R) * Math.cos(latitude * D2R);
  const cos = num / den;
  if (cos > 1 || cos < -1) return null;
  return (R2D * Math.acos(cos)) / 15;
}

/**
 * Les cinq horaires du jour, en Date absolues.
 * `ombre` : 1 pour la majorité des écoles, 2 pour l'école hanafite.
 */
export function horairesDuJour(
  date: Date,
  latitude: number,
  longitude: number,
  methode: Methode = "mwl",
  ombre: 1 | 2 = 1,
): Record<NomPriere, Date> | null {
  const m = METHODES[methode];
  const jd = julien(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { declinaison, eqt } = soleil(jd);

  // Midi solaire, exprimé en heures UTC.
  const midi = 12 - eqt - longitude / 15;

  const enDate = (heuresUTC: number) => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
    );
    d.setTime(d.getTime() + heuresUTC * 3_600_000);
    return d;
  };

  const tFajr = angleHoraire(m.fajr, latitude, declinaison);
  const tCoucher = angleHoraire(0.833, latitude, declinaison);

  // L'ombre d'un objet vaut sa hauteur (× le facteur) plus l'ombre de midi.
  const altitudeAsr =
    R2D * Math.atan(1 / (ombre + Math.tan(Math.abs(latitude - declinaison) * D2R)));
  const tAsr = angleHoraire(altitudeAsr, latitude, declinaison);

  if (tFajr === null || tCoucher === null || tAsr === null) return null;

  const maghrib = enDate(midi + tCoucher);

  let isha: Date;
  if (m.ishaApresMaghrib) {
    isha = new Date(maghrib.getTime() + m.ishaApresMaghrib * 60_000);
  } else {
    const tIsha = angleHoraire(m.isha, latitude, declinaison);
    if (tIsha === null) return null;
    isha = enDate(midi + tIsha);
  }

  return {
    fajr: enDate(midi - tFajr),
    dhuhr: enDate(midi),
    asr: enDate(midi + tAsr),
    maghrib,
    isha,
  };
}

/**
 * Le dernier créneau atteint aujourd'hui, ou null avant le Fajr.
 * C'est lui qui décide si un rendez-vous est dû.
 */
export function creneauCourant(
  maintenant: Date,
  latitude: number,
  longitude: number,
  methode: Methode = "mwl",
  ombre: 1 | 2 = 1,
): NomPriere | null {
  const h = horairesDuJour(maintenant, latitude, longitude, methode, ombre);
  if (!h) return null;
  let courant: NomPriere | null = null;
  for (const p of PRIERES) {
    if (maintenant.getTime() >= h[p].getTime()) courant = p;
  }
  return courant;
}

/**
 * Ce que chaque moment appelle. Le rythme du jour n'est pas plat : on ne
 * demande pas la même chose à quelqu'un au lever qu'à la tombée de la nuit.
 */
export const TEMPS: Record<NomPriere, { moment: string; posture: string }> = {
  fajr: {
    moment: "avant le jour",
    posture:
      "La journée n'a pas commencé. C'est le moment de poser UNE intention, pas de faire le bilan de quoi que ce soit. Sois bref et calme.",
  },
  dhuhr: {
    moment: "milieu de journée",
    posture:
      "La journée est lancée. C'est le moment de vérifier que l'essentiel avance, et de relancer une seule chose si elle stagne.",
  },
  asr: {
    moment: "après-midi",
    posture:
      "Il reste du temps, mais plus beaucoup. C'est le moment de réduire : quelle est la plus petite chose qui compte encore avant ce soir ?",
  },
  maghrib: {
    moment: "tombée du jour",
    posture:
      "La journée se termine. C'est le moment de reconnaître ce qui a été fait, même minuscule. Aucune nouvelle tâche.",
  },
  isha: {
    moment: "la nuit",
    posture:
      "Le jour est clos. C'est le moment du recul et du lâcher-prise, jamais celui d'une injonction. Prépare demain d'une phrase, sans liste.",
  },
};
