# AMANA — SCREENS

> Liste exhaustive des écrans du MVP. Chaque écran : objectif, composants clés, états (vide / chargement / erreur), navigation entrante / sortante. Les parcours (`Flux n°…`) renvoient à `USER_FLOWS.md`.

## Design system — règles applicables à tous les écrans

Tokens : `design/amana-design-system.html` (V3). **Ivoire** `--paper #F5F1E8` / `--surface #FDFBF6` · **Encre** `--ink #161310` (+ `--ink-soft`, `--ink-faint`) · **Or** `--gold #C2A05C` (+ `--gold-deep`, `--gold-soft`) · Stone `#D8C3A5`. Mode sombre fourni par les mêmes variables. Ratio d'usage : 60 % ivoire · 30 % encre · 8 % stone · 2 % or.

- **Un seul accent or par écran** : l'or marque l'essentiel (la priorité essentielle, la destination du chemin, le CTA principal). Jamais deux éléments or en concurrence.
- **Serif pour les moments de sens** (classe `.serif`) : intention du jour, questions de réflexion, synthèse narrative, bilan du soir, citations. Sans-serif (system-ui) pour tout l'utilitaire.
- Métaphore unique : **le chemin** (pointillés or, étapes en cercles, destination dorée). Pas d'autres métaphores visuelles.
- **« Un outil n'a pas d'âme »** : aucune mascotte, aucun visage, aucun « AMANA pense/adore ». Formulations : « AMANA propose / structure / facilite ». Langage UX : « Votre prochaine étape », « Ce qui compte aujourd'hui ».
- Ton : sobre, respirant, calme ; jamais surchargé, jamais « usine à statistiques », jamais infantilisant, **jamais culpabilisant** (états d'erreur compris).
- Mobile-first PWA ; navigation basse persistante (hors onboarding, bilan et admin) : **Aujourd'hui** (`SCR-DASH`) · **Projets** (`SCR-PROJ-LIST`) · **Déposer** (bouton central → `SCR-DUMP`) · **Profil** (`SCR-PROFIL`). La conversation (`SCR-CONV`) est accessible depuis chaque écran (bouton flottant discret encre).

---

## SCR-LOGIN — Accueil / connexion

- **Objectif** : entrer avec une friction minimale (Flux 1).
- **Composants** : logo (3 points ascendants), promesse en une ligne (serif), bouton Google, champ email + « Recevoir mon lien » (CTA or — l'accent unique), mention légale discrète. Sous-écran : confirmation « lien envoyé » + renvoyer.
- **États** : vide = état nominal · chargement = bouton en attente (spinner sobre) · erreur = email invalide inline ; lien expiré → écran dédié « Ce lien n'est plus valide » + renvoyer.
- **Navigation** : entrée = URL racine déconnectée, lien email, install PWA. Sortie = mini-formulaire prénom/langue/fuseau → `SCR-ONB-1` (nouveau) ou `SCR-DASH` (connu).

## SCR-ONB-1 … SCR-ONB-13 — Onboarding narratif

Séquence en scroll vertical immersif sur le chemin (univers désert/forêt/océan). ≤ 10 min au total (Flux 2). Pas de nav basse ; progression = étapes du chemin, pas de pourcentage.

| Écran | Contenu |
|---|---|
| `SCR-ONB-1` | Marque & promesse : Décharger → Clarifier → Avancer |
| `SCR-ONB-2` | Le sens d'AMANA : « le dépôt confié » (serif, respirant) |
| `SCR-ONB-3` | Accueil personnalisé par le prénom, annonce du chemin |
| `SCR-ONB-4` → `SCR-ONB-11` | Les 8 étapes : situation actuelle · vision · domaines de vie · projets en cours · charge mentale · style d'accompagnement · **DISC (11 micro-cartes max, jamais « test »)** · motivation profonde |
| `SCR-ONB-12` | Synthèse narrative ajustable (« mission personnelle », serif) — chaque bloc éditable |
| `SCR-ONB-13` | 3 portes d'entrée : Commencer par un projet / Architecturer ma vie / Architecturer un domaine |

- **Composants (patron d'étape)** : fond paysage, question (serif), zone de réponse (texte court, choix multiples, cartes à taper), « Continuer » (or sur le dernier CTA de l'écran uniquement), lien « Répondre plus tard » (encre douce).
- **États** : chargement = transition douce entre étapes ; génération de synthèse avec chemin animé · erreur = réseau → réponses conservées localement, bandeau discret « reconnexion… » ; synthèse échouée → version minimale + « Régénérer ».
- **Navigation** : entrée = fin d'inscription, ou reprise auto à l'étape atteinte. Sortie = `SCR-ONB-13` → `SCR-CONV` (portes) puis `SCR-DASH` ; fermeture app = reprise ultérieure.

## SCR-DASH — Dashboard (« Aujourd'hui »)

- **Objectif** : fenêtre claire sur ce qui compte aujourd'hui — pas un centre de contrôle (Flux 7).
- **Composants** : salutation + **intention du jour** (question serif, réponse courte optionnelle) · carte **priorité essentielle** (le seul accent or de l'écran) + 2 secondaires (encre), cochables · chemin consolidé des **projets actifs (≤ 3)** avec progression · **3 indices circulaires : Clarté / Action / Alignement** · carte contextuelle (bilan du soir après ~18 h, invitation décharge si tête pleine détectée) · nav basse.
- **États** : vide (nouvel utilisateur sans action) = invitation douce vers la décharge ou un premier projet, jamais un écran muet · chargement = squelettes ivoire · erreur = données locales en cache affichées + bandeau « synchronisation impossible » ; proposition IA échouée → tri par échéance + question d'intention générique.
- **Navigation** : entrée = post-onboarding, ouverture d'app, retours de flux, deep links. Sortie = `SCR-ACTION` (tap priorité), `SCR-PROJ` (tap projet), `SCR-DUMP`, `SCR-CONV`, `SCR-BILAN`, nav basse.

## SCR-CONV — Conversation

- **Objectif** : l'entonnoir conversationnel (Accueil → Exploration → Clarification → Alignement → **action datée**) ; modes contextuels : libre, création de projet, déblocage, capitalisation (Flux 5, 6, 10).
- **Composants** : fil de messages (streaming), bulles utilisateur ivoire / réponses sur surface, champ de saisie + micro clavier natif, **carte « action proposée »** en fin d'entonnoir (titre, date — le seul accent or) avec Accepter / Modifier, indication discrète quand la mémoire est utilisée (« issu de ta mémoire » → lien `SCR-MEM`), signalement d'une réponse inadaptée (appui long → « Signaler »).
- **États** : vide = 2–3 amorces de questions puissantes adaptées au profil · chargement = indicateur de frappe sobre (points, pas d'animation ludique) · erreur = échec IA → « Réessayer », le message utilisateur reste dans le champ ; hors-ligne → saisie désactivée avec explication neutre.
- **Navigation** : entrée = bouton flottant global, portes onboarding, création projet, action bloquée, rappel après réussite. Sortie = carte action → `SCR-ACTION` ; fin de création → `SCR-PROJ-NEW` ; retour écran appelant.
- **Règle** : toute conversation qui s'achève propose une action concrète datée ; l'agent reformule avant de conseiller, ne saute jamais à la solution, peut dire « je peux me tromper ».

## SCR-DUMP — Décharge mentale

- **Objectif** : déposer, en vrac, tout ce qui encombre l'esprit (Flux 3) — la fonction centrale.
- **Composants** : plein écran surface, grand champ texte libre, placeholder apaisant (serif), compteur discret proche de la limite technique, bouton « Déposer » (accent or unique), fermeture avec conservation du brouillon.
- **États** : vide = placeholder seul, zéro distraction · chargement = état « Structuration en cours… » avec chemin animé sobre · erreur = IA échouée → texte intact + « Réessayer » ; hors-ligne → brouillon conservé, envoi différé proposé.
- **Navigation** : entrée = bouton central nav basse, carte dashboard, porte onboarding, rappel. Sortie = `SCR-DUMP-REVIEW` (succès) ; retour arrière = brouillon gardé.

## SCR-DUMP-REVIEW — Validation du classement

- **Objectif** : transformer les propositions IA en objets réels, sous contrôle total de l'utilisateur (Flux 4).
- **Composants** : liste de cartes groupées par type (projets / tâches / décisions / rappels), carte = type modifiable + titre éditable + rattachement suggéré + échéance détectée, actions Valider / Corriger / Rejeter, « Tout valider », section « À trier » (items non classés), écran final de synthèse + **première action datée proposée** (accent or).
- **États** : vide (rien d'extrait) = message neutre + texte brut conservé, option de relance ou de création manuelle · chargement = cartes squelettes au fil du streaming · erreur = classification partielle → items reçus affichés + « Relancer le reste ».
- **Navigation** : entrée = `SCR-DUMP` uniquement. Sortie = `SCR-DASH` (synthèse validée) ; cartes projet → `SCR-PROJ` si besoin de détail.
- **Règle** : un projet qui dépasserait 3 actifs est proposé en « futurs » avec explication.

## SCR-PROJ-LIST — Projets

- **Objectif** : vue d'ensemble des projets par statut, dont la boîte à idées.
- **Composants** : segments par statut — **Actifs (≤ 3)** · Secondaires · En attente · **Futurs (boîte à idées)** · Abandonnés (repliés, avec capitalisation) ; carte projet = nom, prochaine action, échéance, mini-progression ; bouton « Nouveau projet » (accent or).
- **États** : vide = invitation à créer un premier projet ou à vider sa tête · chargement = squelettes · erreur = cache local + bandeau synchro.
- **Navigation** : entrée = nav basse. Sortie = `SCR-PROJ`, `SCR-PROJ-NEW` / `SCR-CONV` (création guidée).

## SCR-PROJ — Projet (détail)

- **Objectif** : voir et faire avancer un projet simplifié : vision, objectif, prochaine action, échéance.
- **Composants** : en-tête (nom, domaine-étiquette, statut modifiable — 5 statuts), vision courte (serif), objectif, **carte « prochaine action » datée (accent or)**, liste des actions par état, progression sur le chemin, « Discuter de ce projet » → `SCR-CONV`, passage en « abandonné » → mini-capitalisation (2 questions : appris ? pourquoi arrêter ?).
- **États** : vide (aucune action) = invite à définir la prochaine action (proposée par IA si possible) · chargement = squelettes · erreur = lecture seule sur cache + bandeau.
- **Navigation** : entrée = `SCR-PROJ-LIST`, `SCR-DASH`, `SCR-DUMP-REVIEW`, deep links. Sortie = `SCR-ACTION`, `SCR-CONV`, retour liste.
- **Règle** : passer un projet en « actif » au-delà de 3 exige d'en déclasser un autre (dialogue explicite).

## SCR-PROJ-NEW — Récapitulatif de création

- **Objectif** : valider la fiche issue de la conversation guidée (ou créer manuellement en repli) (Flux 5).
- **Composants** : formulaire pré-rempli : nom, vision, objectif, domaine, statut proposé, **prochaine action + échéance (requis)**, CTA « Créer le projet » (accent or).
- **États** : vide = formulaire vierge (repli sans IA) · chargement = enregistrement · erreur = validation champs requis ; échec réseau → contenu conservé.
- **Navigation** : entrée = fin de `SCR-CONV` mode création, ou repli direct. Sortie = `SCR-PROJ` ; abandon → brouillon en « futurs ».

## SCR-ACTION — Action (bottom sheet)

- **Objectif** : créer, consulter, modifier une action ; changer son état (Flux 6, 10).
- **Composants** : titre (requis), projet lié, domaine, priorité, durée estimée, date/heure, échéance, contexte, personnes, description, champ apprentissage ; sélecteur d'état (à faire / en cours / terminé / reporté / bloqué) ; à « terminé » → micro-feedback skippable ; à « bloqué » → proposition d'analyse causale et d'étape de 10 min ; à « reporté » → sélecteur de nouvelle date obligatoire.
- **États** : vide = création (titre seul suffit) · chargement = enregistrement optimiste + indicateur de synchro · erreur = échec réseau → conservé localement ; objet supprimé (deep link) → message neutre, retour dashboard.
- **Navigation** : entrée = dashboard, projet, conversation, review de décharge, rappel (deep link). Sortie = retour à l'écran appelant ; « bloqué » → `SCR-CONV`.

## SCR-PROFIL — Profil

- **Objectif** : voir et ajuster son histoire : identité, valeurs, vision, style d'accompagnement.
- **Composants** : synthèse narrative (serif, éditable — reprend `SCR-ONB-12`), 3 valeurs cardinales + secondaires (modifiables), vision, style d'accompagnement, compléter les étapes « répondues plus tard », liens : **Ma mémoire** (`SCR-MEM`), **Réglages** (`SCR-SETTINGS`). **Le DISC n'apparaît jamais comme étiquette** — au mieux « comment AMANA s'adapte à toi », en langage naturel.
- **États** : vide = profil partiel avec invitations douces à compléter · chargement = squelettes · erreur = lecture seule + bandeau.
- **Navigation** : entrée = nav basse. Sortie = `SCR-MEM`, `SCR-SETTINGS`, `SCR-CONV` (compléter en discutant).

## SCR-MEM — Mémoire

- **Objectif** : contrôle total sur ce qu'AMANA retient (Flux 9) — condition de confiance du produit.
- **Composants** : recherche ; trois sections : **Stable · Évolutive · Apprentissage** ; item = contenu, source, date, motif de rétention (utilité/durabilité/importance) ; détail avec **Modifier / Supprimer (confirmation) / Désactiver** ; interrupteur global « Suspendre toute nouvelle mémorisation ».
- **États** : vide = explication pédagogique de ce qui est mémorisé (et pas), sans invite pressante · chargement = squelettes · erreur = échec de suppression explicite + réessayer (jamais de faux succès).
- **Navigation** : entrée = `SCR-PROFIL`, lien contextuel de `SCR-CONV`, `SCR-SETTINGS`. Sortie = retour profil.

## SCR-BILAN — Bilan du soir

- **Objectif** : clore la journée en 2 minutes : accompli, appris, à ajuster, lâcher-prise (Flux 8).
- **Composants** : 4 cartes-questions en serif, une par vue (swipe/scroll) : accomplissements (liste pré-cochée) · apprentissage (texte court) · ajustements · **lâcher-prise** (« est-ce que je porte uniquement ce qui dépend réellement de moi ? ») ; reprogrammation des actions non faites (sans reproche) ; synthèse de clôture valorisant efforts et apprentissages (accent or sur la clôture). Variante hebdomadaire : le dimanche soir, le bilan s'ouvre sur le **bilan hebdo généré** (accomplissements, apprentissages, blocages, priorités) avant les questions du jour.
- **États** : vide (aucune action du jour) = questions ouvertes seules · chargement = génération de synthèse (chemin animé) · erreur = synthèse indisponible → clôture simple sans synthèse ; réponses partielles sauvegardées.
- **Navigation** : entrée = notification du soir, carte dashboard. Sortie = `SCR-DASH` (journée close). Entièrement skippable, sans conséquence.

## SCR-SETTINGS — Réglages

- **Objectif** : régler l'app sans friction ; exercer ses droits.
- **Composants** : notifications (activer/désactiver par type : rappels, matin, soir ; plages de silence ; heure des rituels), langue (FR, structure i18n prête), fuseau, dimension spirituelle (activable, jamais imposée), installation PWA guidée, mémoire (lien `SCR-MEM` + interrupteur global), **compte : exporter mes données · supprimer mon compte** (double confirmation, effacement en cascade), mentions légales / confidentialité, contact / feedback produit.
- **États** : vide = n/a · chargement = enregistrement inline par réglage · erreur = réglage revenu à sa valeur + message ; export en préparation → notification quand prêt.
- **Navigation** : entrée = `SCR-PROFIL`. Sortie = retour profil ; suppression de compte → `SCR-LOGIN`.

## SCR-ADMIN — Dashboard administrateur (interne)

- **Objectif** : piloter acquisition, activation, engagement, rétention, frictions et qualité IA dès le MVP (module 10). Accès restreint aux rôles admin ; desktop-first ; hors design émotionnel (mais mêmes tokens).
- **Composants** : funnel d'activation (signup → onboarding terminé → première conversation → première décharge validée → J7) ; rétention par cohortes ; points de friction (abandons par étape d'onboarding, `braindump_failed`, rappels ignorés) ; **qualité IA** (signalements de réponses inadaptées, taux de correction/rejet au classement de décharge, taux de conversations conclues par une action datée) ; filtres : langue, profil (DISC agrégé, jamais nominatif), domaine ; intégration PostHog pour le détail.
- **États** : vide = « pas encore de données pour ce filtre » · chargement = squelettes de graphes · erreur = source indisponible par panneau (les autres restent fonctionnels).
- **Navigation** : entrée = URL interne `/admin`, auth + rôle requis. Sortie = aucune vers l'app utilisateur.
- **Règles** : données agrégées et anonymisées ; jamais le contenu des conversations, décharges ou mémoires.

---

## Carte de navigation (résumé)

```
SCR-LOGIN → (nouveau) SCR-ONB-1 … 13 → SCR-CONV → SCR-DASH
          → (connu) SCR-DASH

Nav basse : SCR-DASH · SCR-PROJ-LIST · [Déposer → SCR-DUMP] · SCR-PROFIL
SCR-DUMP → SCR-DUMP-REVIEW → SCR-DASH
SCR-PROJ-LIST → SCR-PROJ → SCR-ACTION / SCR-CONV
SCR-CONV (global) → carte action → SCR-ACTION · fin création → SCR-PROJ-NEW → SCR-PROJ
SCR-PROFIL → SCR-MEM · SCR-SETTINGS
SCR-DASH → SCR-BILAN (soir) → SCR-DASH
Notifications (push/email) → deep links : SCR-ACTION · SCR-CONV · SCR-BILAN
/admin → SCR-ADMIN (rôle requis)
```
