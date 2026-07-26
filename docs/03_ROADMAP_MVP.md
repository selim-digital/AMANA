# AMANA — Roadmap MVP bi-idniLlah

> Sprints de 2 semaines. La structure reprend les 3 sprints du Brief court MVP, précédés d'un Sprint 0 de fondations et suivis d'une bêta fermée. Objectif global : **prouver « Décharger → Clarifier → Avancer » avec une première victoire utilisateur en quelques minutes.**

## Vue d'ensemble (~10 semaines jusqu'à la bêta)

| Phase | Durée | Objectif de sortie |
|---|---|---|
| Sprint 0 — Fondations | 2 sem. | Socle technique + design system appliqué + 10 livrables rédigés |
| Sprint 1 — Entrer | 2 sem. | Auth + onboarding narratif + première conversation |
| Sprint 2 — Le cœur | 2 sem. | Décharge mentale + mémoire + projets + dashboard |
| Sprint 3 — La boucle | 2 sem. | Rappels + bilans + feedback + dashboard admin |
| Bêta fermée | 2–4 sem. | 15–30 utilisateurs réels, itérations, critères de succès mesurés |

---

## Sprint 0 — Fondations (semaines 1–2)

**Produit / specs**
- [ ] Rédiger les 10 livrables du brief (`MVP_SCOPE`, `USER_FLOWS`, `SCREENS`, `DOMAIN_MODEL`, `MEMORY_SPEC`, `AI_BEHAVIOR`, `DASHBOARD`, `API_SPEC`, `BACKLOG`, `SPRINTS`) à partir de `01_AMANA_COMPILATION.md`
- [ ] Valider les arbitrages canoniques (§14 de la compilation)
- [ ] Écrire le prompt système v1 de l'agent (postures, entonnoir conversationnel, règles éthiques, fin sur une action datée)

**Technique**
- [ ] Repo Git + Next.js 15 + TypeScript + Tailwind v4 + next-intl (FR) + Serwist (PWA)
- [ ] Projet Supabase région UE : schéma initial (users, profiles, conversations, messages, memories, projects, goals, tasks, events, insights) + RLS
- [ ] Intégration Claude API + Vercel AI SDK (streaming) ; secrets côté serveur
- [ ] Tokens du design system dans Tailwind (couleurs, typo, rayons — cf. `design/amana-design-system.html`)
- [ ] Déploiement continu Vercel + environnement de préprod

**Définition de fini** : une page connectée à la BDD, un chat streaming basique fonctionnel en préprod, les 10 docs relus.

## Sprint 1 — Entrer (semaines 3–4)

- [ ] Auth magic link + Google (friction minimale) ; création de compte : prénom, langue, fuseau
- [ ] **Onboarding narratif ≤ 10 min** : 8 étapes + DISC 11 questions max, scroll vertical sur le chemin (univers), synthèse narrative ajustable
- [ ] 3 portes d'entrée finales (projet / vie / domaine)
- [ ] Profil évolutif stocké (valeurs cardinales, vision, DISC, style d'accompagnement)
- [ ] Conversation v1 : entonnoir complet, mémoire courte (session), toujours conclure par une action datée
- [ ] Events de base (signup, onboarding_completed, first_conversation)

**Critère de sortie** : un nouvel inscrit atteint sa première conversation en < 12 min, sans aide.

## Sprint 2 — Le cœur (semaines 5–6)

- [ ] **Décharge mentale** : texte libre → tool use Claude → propositions structurées (projets / tâches / décisions / rappels) que l'utilisateur valide ou corrige
- [ ] Mémoire long terme v1 : écriture (avec filtre utilité/durabilité/importance), lecture en contexte de conversation, **écran Mémoire** (consulter / modifier / supprimer)
- [ ] Projets simplifiés : vision, objectif, prochaine action, échéance ; max 3 actifs ; boîte à idées
- [ ] Actions : CRUD complet, états, échéances
- [ ] **Dashboard** : intention du jour, 1 + 2 priorités, projets actifs, 3 indices (Clarté / Action / Alignement) v1
- [ ] pgvector : rappel sémantique des mémoires pertinentes dans la conversation

**Critère de sortie** : le parcours signature fonctionne de bout en bout — je vide ma tête, AMANA structure, je valide, mon dashboard reflète mes priorités.

## Sprint 3 — La boucle (semaines 7–8)

- [ ] Rappels intelligents (avant échéance, échéance manquée → reprogrammation, après réussite → capitalisation) ; push web + email
- [ ] Boucle quotidienne : rituel du matin (intention) et mini-bilan du soir
- [ ] Bilan hebdomadaire généré (accomplissements, apprentissages, blocages, priorités)
- [ ] Feedback intégré (questions post-action, signalement de réponse IA inadaptée)
- [ ] **Dashboard admin** : funnel d'activation, rétention, frictions, qualité IA ; filtres (langue, profil, domaine) — page interne + PostHog
- [ ] Sécurité : audit RLS, export & suppression de compte (RGPD), sauvegardes
- [ ] Polish : états vides, erreurs, performance mobile, install PWA guidée

**Critère de sortie** : l'app vit sans intervention manuelle pendant 7 jours pour un utilisateur test.

## Bêta fermée (semaines 9–12)

- 15–30 utilisateurs du persona prioritaire (entrepreneurs/responsables), recrutés dans le cercle proche puis ambassadeurs
- Mesures contre les **critères de succès MVP** (les seuils chiffrés ci-dessous sont une proposition de cette roadmap, pas une exigence du blueprint) :
  - ≥ 60 % terminent l'onboarding
  - ≥ 50 % réalisent une décharge mentale complète dans les 24 h
  - ≥ 30 % reviennent 3 jours distincts la première semaine
  - Verbatim cible : « ça m'aide à y voir plus clair »
- 1 itération hebdo à partir du feedback + dashboard admin
- Décision Go/No-Go V1 (adaptation DISC avancée, agents spécialisés, communauté fondatrice)

## Jalons post-MVP (rappel du blueprint)

- **V1 (12–24 mois)** : personnalisation DISC/stress, coach adaptatif, agents mémoire/projet/supervision/éthique, progression gamifiée, débuts de communauté
- **V2** : feedback des proches, mentors humains, B2B, multi-agents complet
- **V3 / 5–10 ans** : infrastructure personnelle multimodale, intégrations externes

## Risques principaux & parades

| Risque | Parade |
|---|---|
| Périmètre qui gonfle (le blueprint est immense) | `MVP_SCOPE.md` fait foi ; toute idée hors périmètre va dans la boîte à idées V1 |
| Qualité IA décevante en français réel | Bibliothèque de cas de test conversationnels dès Sprint 0 ; évaluation à chaque itération de prompt |
| Coût API non maîtrisé | Routage Sonnet/Haiku + plafond par utilisateur gratuit + suivi PostHog |
| Onboarding trop long → abandon | Chrono cible 10 min testé dès Sprint 1 sur 5 personnes |
| Données sensibles (pensées personnelles) | Minimisation, RLS, région UE, écran Mémoire transparent dès le MVP |
