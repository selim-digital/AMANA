# AMANA — MVP_SCOPE

> **Ce document fait foi.** Tout ce qui n'est pas listé dans « Dans le MVP » est hors MVP par défaut : l'idée part dans la boîte à idées (backlog V1), jamais dans le sprint en cours. Il ne s'étend que par décision explicite du porteur produit.
> Références : `docs/01_AMANA_COMPILATION.md` (§13–14, arbitrages canoniques) · `docs/03_ROADMAP_MVP.md`.

## Pour qui ?

**Persona unique du MVP : l'entrepreneur / la personne à fortes responsabilités.**
Projets multiples, engagements dispersés dans trop d'outils, oublis, sentiment de courir sans avancer sur l'essentiel. Confortable avec le mobile, exigeant sur son temps : la valeur doit apparaître en quelques minutes.
Personas secondaires (étudiant, parent, sportif, managers) : **post-MVP** — on ne conçoit rien pour eux au MVP.

## Quel problème ?

1. **Surcharge mentale** : tout est porté « dans la tête », rien n'est déposé en confiance.
2. **Manque de clarté** : beaucoup d'activité, peu de progression sur ce qui compte vraiment.
3. **Oubli** : engagements, intentions et apprentissages se perdent ; aucun outil n'a de mémoire de la personne.

## Quelle promesse ?

**Décharger → Clarifier → Avancer**, avec un partenaire de progression qui se souvient.
Première victoire **en quelques minutes** : je vide ma tête, AMANA structure, je valide, je repars avec **une action concrète et datée**. Émotion centrale : la sérénité. À 30 jours : « Tout est plus clair et j'avance beaucoup plus vite sur les projets qui comptent. »

## Dans le MVP (liste fermée)

1. **Compte** : magic link + Google ; prénom, langue (FR), fuseau. Friction minimale, pas de mot de passe.
2. **Onboarding narratif ≤ 10 min** : 8 étapes + DISC en **11 questions max, jamais nommé « test »**, synthèse narrative ajustable, 3 portes d'entrée. Scroll vertical sur le « chemin ».
3. **Profil évolutif** : identité, 3 valeurs cardinales + secondaires, vision, DISC (couche invisible, jamais une étiquette affichée), style d'accompagnement.
4. **Assistant conversationnel — 1 seul agent** : entonnoir Accueil → Exploration → Clarification → Alignement → **toujours conclure par une action datée**. Streaming, ton jamais culpabilisant ni anthropomorphique.
5. **Mémoire simple** : court terme (session) + long terme v1 (couches stable / évolutive / apprentissage), filtre utilité·durabilité·importance, rappel sémantique (pgvector), **écran Mémoire : consulter / modifier / supprimer / désactiver** — contrôle total de l'utilisateur.
6. **Décharge mentale** (fonction centrale) : texte libre → structuration automatique en projets / tâches / décisions / rappels → **validation ou correction par l'utilisateur** (rien n'est créé sans lui).
7. **Projets simplifiés** : vision, objectif, prochaine action, échéance ; **5 statuts** (actifs / secondaires / en attente / futurs / abandonnés) ; **max 3 actifs** ; boîte à idées = statut « futurs ».
8. **Actions** : CRUD complet, 5 états (à faire / en cours / terminé / reporté / bloqué), échéances, champ apprentissage.
9. **Dashboard quotidien** : intention du jour, **1 priorité essentielle + 2 secondaires (3 max)**, projets actifs, **3 indices : Clarté · Action · Alignement** (v1 heuristique).
10. **Boucle quotidienne** : rituel du matin (état du dashboard), **bilan du soir** (accompli ? appris ? à ajuster ? + lâcher-prise), bilan hebdomadaire généré.
11. **Rappels intelligents** : avant échéance (« est-ce toujours la bonne priorité ? »), échéance manquée → reprogrammation sans reproche, après réussite → capitalisation. Push web + email, fréquence plafonnée, jamais addictif.
12. **Feedback intégré** : question post-action (skippable), signalement d'une réponse IA inadaptée.
13. **Dashboard admin (obligatoire dès le MVP)** : funnel d'activation, rétention, frictions, qualité IA ; filtres langue / profil / domaine.
14. **Socle** : PWA installable mobile-first, i18n prêt (lancement FR), RLS, export & suppression de compte (RGPD), sauvegardes, région UE.

## Hors MVP (explicite)

| Exclu du MVP | Renvoyé à |
|---|---|
| Adaptation DISC / stress avancée, postures multiples dynamiques | **V1** |
| Multi-agents (orchestrateur, éthique, détresse, mentor… — liste §5 compilation) | **V1/V2** |
| Progression gamifiée complète : 5 niveaux Conscience → Transmission, badges (le MVP se contente d'enregistrer les événements qui l'alimenteront) | **V1** |
| Architecture de vie complète (Vision → Missions → Domaines…), projet en 9 niveaux, 3 catégories de KPI par projet | **V1** (le MVP garde le domaine comme simple étiquette) |
| Auto-évaluations périodiques, intelligence émotionnelle avancée | **V1** |
| Communauté, ambassadeurs in-app | **V1 (débuts) / V2** |
| Feedback des proches | **V2** |
| Coachs humains, marketplace, B2B | **V2+** |
| Paiements / Premium (l'app est gratuite pendant la bêta) | **post-MVP** |
| Multimodal, intégrations externes, app native | **V3** |

## Critères de succès

- **Activation** : un nouvel inscrit atteint sa première victoire (décharge + clarification + 1 action datée) en quelques minutes ; onboarding réellement ≤ 10 min.
- **Compréhension** : verbatim cible « cette app m'aide à y voir plus clair ».
- **Seuils bêta** (proposition roadmap, 15–30 utilisateurs) : ≥ 60 % terminent l'onboarding · ≥ 50 % font une décharge complète sous 24 h · ≥ 30 % reviennent 3 jours distincts la première semaine.
- **Système** : la mémoire s'enrichit visiblement, les projets avancent, l'app vit 7 jours sans intervention manuelle.
