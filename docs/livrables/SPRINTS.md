# AMANA — SPRINTS.md (MVP)

> Déclinaison exécutable de `03_ROADMAP_MVP.md`. Sprints de 2 semaines. Les stories référencées (S1-xx…) sont détaillées dans `BACKLOG.md` ; le comportement IA dans `AI_BEHAVIOR.md` ; la page principale dans `DASHBOARD.md`.
> Objectif global : prouver **Décharger → Clarifier → Avancer**, première victoire utilisateur en quelques minutes.

---

## Sprint 0 — Fondations (semaines 1–2)

**Objectif** : un socle sur lequel tout le reste s'empile sans dette — et des specs relues qui font foi.

**Contenu (tâches, pas de stories utilisateur)**
- Rédaction/relecture des 10 livrables du brief (dont les 4 de ce dossier) + validation des arbitrages canoniques (§14 de la compilation).
- Prompt système v1 (draft en `AI_BEHAVIOR.md` §10) + **bibliothèque de cas de test conversationnels** (≥ 10 cas : « Je suis perdu », décharge 20 items, stress fort, demande de diagnostic, détresse, 4ᵉ projet actif, idée à ne pas presser, question piège mémoire, demande « dis-moi quoi faire », relance culpabilisante à détecter).
- Repo Next.js 15 + TypeScript + Tailwind v4 (tokens du design system) + next-intl (FR) + Serwist.
- Supabase UE : schéma initial (users, profiles, conversations, messages, memories, projects, goals, tasks, events, insights) + RLS activée partout dès le départ.
- Intégration Claude API + Vercel AI SDK (streaming, tool calling typé) ; secrets serveur uniquement.
- CI/CD Vercel + préprod.

**Définition de fini**
- [ ] Une page connectée à la BDD en préprod.
- [ ] Un chat streaming basique fonctionnel en préprod (prompt v1 branché).
- [ ] Les 10 docs relus et validés ; tout ce qui dépasse le périmètre est dans la boîte à idées V1.
- [ ] Suite de cas de test conversationnels exécutable (même manuellement scriptée).

**Démo de fin de sprint** : depuis un navigateur en préprod — je me connecte à la base, j'ouvre le chat, je joue le cas « Je suis perdu » et je montre les livrables validés.

**Risques du sprint**
| Risque | Parade |
|---|---|
| Les specs s'éternisent (le blueprint est immense) | Timebox : livrables « assez bons » en semaine 1, relecture en semaine 2 ; `MVP_SCOPE.md` fait foi |
| Prompt v1 décevant en français réel | Évaluation contre la bibliothèque de cas dès ce sprint, pas au Sprint 1 |
| Sur-ingénierie du socle | S'en tenir à `02_STACK.md` : pas de microservices, pas de vector DB dédiée |

---

## Sprint 1 — Entrer (semaines 3–4)

**Objectif** : un inconnu devient un utilisateur qui a eu **une vraie première conversation** — seul, en moins de 12 minutes.

**Stories** : S1-01, S1-02 (compte) · S1-03, S1-04, S1-05, S1-06 (onboarding) · S1-07 (profil) · S1-08, S1-09 (conversation) · S1-10 (events) · S1-11 (sécurité socle).

**Définition de fini**
- [ ] Tous les critères d'acceptation des stories S1 passent (tests E2E Playwright sur inscription → onboarding → conversation).
- [ ] Chrono d'onboarding testé sur 5 personnes : médiane ≤ 10 min.
- [ ] 100 % des conversations significatives de test se concluent par une action datée enregistrée.
- [ ] Tests RLS d'isolation entre 2 comptes verts en CI.
- [ ] Aucun texte de l'app ne contient « test », « diagnostic », « tu dois », ni langage anthropomorphique (revue éditoriale).

**Démo de fin de sprint** : sur un téléphone, en conditions réelles — création de compte par magic link, onboarding complet chronométré, choix d'une porte d'entrée, conversation « Je suis perdu » qui se conclut par une action datée visible en base.

**Risques du sprint**
| Risque | Parade |
|---|---|
| Onboarding trop long → abandon | Chrono cible testé sur 5 personnes pendant le sprint, coupes immédiates si > 10 min |
| L'entonnoir se dérègle (conseil trop tôt, pas d'action finale) | Cas de test conversationnels en CI de prompt ; % d'actions datées suivi dès maintenant |
| Auth/magic link friction (emails en spam) | Google en secours dès le jour 1 ; test de délivrabilité Resend en début de sprint |
| DISC perçu comme un test | Formulation narrative relue par 2 personnes hors équipe |

---

## Sprint 2 — Le cœur (semaines 5–6)

**Objectif** : le **parcours signature** fonctionne de bout en bout — je vide ma tête, AMANA structure, je valide, mon dashboard reflète mes priorités.

**Stories** : S2-01 (décharge mentale) · S2-02, S2-03, S2-04 (mémoire + écran) · S2-05, S2-06 (projets, max 3 actifs) · S2-07 (actions) · S2-08, S2-09, S2-10 (dashboard, indices, états vides).

**Définition de fini**
- [ ] Critères d'acceptation S2 verts ; E2E du parcours signature (décharge → validation → dashboard) en CI.
- [ ] Une décharge de 15 items en vrac produit une structuration jugée « juste » sur les cas de test (validation humaine notée).
- [ ] Écran Mémoire : consulter/modifier/supprimer effectifs — une mémoire supprimée n'apparaît plus jamais en contexte (test dédié).
- [ ] Impossible d'avoir 4 projets actifs (test automatisé).
- [ ] Indices calculés par le job quotidien, avec « en construction » sous le seuil de données ; formules affichées conformes à `DASHBOARD.md` §5.
- [ ] pgvector : rappel sémantique branché et testé sur 3 scénarios (dont la question piège « n'invente pas »).

**Démo de fin de sprint** : le parcours signature en une prise — je dicte 15 pensées en vrac, AMANA propose projets/tâches/décisions/rappels, j'en corrige une, je valide, le dashboard affiche 1 + 2 priorités avec leur « pourquoi », j'ouvre l'écran Mémoire et je supprime une mémoire devant tout le monde.

**Risques du sprint**
| Risque | Parade |
|---|---|
| Structuration de la décharge décevante (mauvais découpage projets/tâches) | Jeu de 10 décharges réelles anonymisées comme fixtures ; itération du tool use `propose_structure` sur ces cas |
| Indices perçus comme du flicage ou absurdes au démarrage | Seuils « en construction », formules affichées, revue des libellés (jamais de rouge, jamais de reproche) |
| Coût API qui dérape (décharges longues) | Routage Sonnet/Haiku conforme à `02_STACK.md` + plafond par utilisateur + suivi PostHog dès ce sprint |
| Le sprint est le plus chargé des trois | S2-09/S2-10 dégradables : indices peuvent basculer au début du Sprint 3 sans casser le parcours signature |

---

## Sprint 3 — La boucle (semaines 7–8)

**Objectif** : AMANA **vit avec l'utilisateur dans le temps** — rappels, rituels, bilans, feedback — et l'équipe pilote avec le dashboard admin. L'app tient 7 jours sans intervention manuelle.

**Stories** : S3-01 (rappels) · S3-02, S3-03 (rituels matin/soir) · S3-04 (bilan hebdo) · S3-05 (feedback & signalement IA) · S3-06, S3-07 (dashboard admin + qualité IA) · S3-08, S3-09 (RGPD, audit, sauvegardes) · S3-10 (polish PWA/offline).

**Définition de fini**
- [ ] Critères d'acceptation S3 verts.
- [ ] Un utilisateur test vit 7 jours consécutifs avec l'app sans intervention manuelle de l'équipe (rappels partis, bilans générés, aucun incident bloquant).
- [ ] Chaque libellé de rappel/bilan relu contre la règle « jamais culpabiliser » (revue éditoriale documentée).
- [ ] Export JSON et suppression de compte testés de bout en bout sur un compte réel.
- [ ] Audit RLS complet + restauration de sauvegarde réussie en préprod.
- [ ] Dashboard admin : funnel, rétention J1/J3/J7, frictions, qualité IA (% actions datées, signalements, `distress_detected`) avec filtres.
- [ ] Install PWA guidée fonctionnelle iOS et Android ; dashboard consultable hors ligne.

**Démo de fin de sprint** : une journée compressée — rituel du matin (état, intention, validation 1 + 2), un rappel « est-ce toujours la bonne priorité ? » reçu en push, une action terminée avec question de capitalisation, mini-bilan du soir avec la question lâcher-prise ; puis côté admin : le funnel d'activation de l'équipe test et un signalement IA traité. Enfin : export RGPD téléchargé.

**Risques du sprint**
| Risque | Parade |
|---|---|
| Notifications perçues comme du harcèlement | Max 1 rappel par déclencheur, tout désactivable, revue des libellés ; test sur l'équipe 1 semaine |
| Push web iOS capricieux (PWA) | Email en canal de secours systématique ; documenter la limite pour la bêta |
| Admin dashboard qui grossit sans fin | Périmètre strict S3-06/S3-07 ; le reste via PostHog embarqué |
| Dette de fin de MVP (états vides, erreurs) oubliée | Le polish (S3-10 + états vides) est une story, pas un « si on a le temps » |

---

## Bêta fermée (semaines 9–12) — rappel de cadrage

- 15–30 utilisateurs du persona prioritaire (cercle proche puis ambassadeurs) ; 1 itération par semaine à partir du feedback + dashboard admin.
- Mesures contre les critères de succès (seuils proposés par la roadmap) : ≥ 60 % terminent l'onboarding · ≥ 50 % font une décharge complète en 24 h · ≥ 30 % reviennent 3 jours distincts la première semaine · verbatim cible « ça m'aide à y voir plus clair ».
- Sortie : décision **Go/No-Go V1** (adaptation DISC avancée, agents spécialisés, communauté fondatrice).

## Règles de pilotage transverses

1. **Le périmètre ne bouge pas en cours de sprint** : toute idée nouvelle va dans la boîte à idées V1 (c'est aussi un comportement produit à s'appliquer à soi-même).
2. **La qualité IA se mesure à chaque itération de prompt** contre la bibliothèque de cas — jamais « au ressenti ».
3. **Chaque sprint se termine par sa démo** en conditions réelles (mobile, préprod), pas en localhost.
4. **Les règles éthiques sont des critères de fini**, pas des vœux : un libellé culpabilisant ou anthropomorphique est un bug bloquant.
