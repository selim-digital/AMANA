# AMANA — BACKLOG.md (MVP)

> User stories du MVP, groupées par sprint (S1/S2/S3 de `03_ROADMAP_MVP.md`). Le Sprint 0 (fondations techniques + rédaction des livrables) n'est pas décliné en stories utilisateur : ses tâches sont listées dans `SPRINTS.md`.
> Persona par défaut : **l'utilisateur** = entrepreneur/personne à responsabilités (persona prioritaire) ; **l'admin** = l'équipe AMANA.
> Couverture des 12 modules du cahier des charges (§13) : chaque story référence son module `[M#]`.
> Tailles : **S** ≤ ½ journée · **M** ≤ 2 jours · **L** ≤ 4 jours (au-delà : découper).
> Contraintes transverses applicables à toutes les stories : onboarding ≤ 10 min ; max 3 projets actifs ; priorités 1 + 2 ; toute conversation se conclut par une action datée ; ton jamais culpabilisant ni anthropomorphique.

---

## Sprint 1 — Entrer (Auth · Onboarding · Première conversation)

### S1-01 — Inscription sans friction `[M1 Compte]` — **M**
En tant que nouvel utilisateur, je veux créer un compte avec un magic link ou Google, afin de commencer sans mot de passe ni formulaire long.
- *Given* la page d'accueil, *When* je saisis mon email et clique « Recevoir mon lien », *Then* je reçois un email et le lien me connecte en < 2 min.
- *Given* la page d'accueil, *When* je choisis « Continuer avec Google », *Then* mon compte est créé et je suis connecté sans autre saisie.
- *Given* un email déjà inscrit, *When* je redemande un lien, *Then* je suis reconnecté au même compte (aucun doublon).

### S1-02 — Profil de compte minimal `[M1 Compte]` — **S**
En tant que nouvel utilisateur, je veux fournir uniquement prénom, langue et fuseau horaire, afin de démarrer avec une friction minimale.
- *Given* ma première connexion, *When* j'arrive dans l'app, *Then* seuls prénom, langue (FR par défaut) et fuseau (pré-détecté) me sont demandés.
- *Given* mon compte créé, *When* j'ouvre les préférences, *Then* je peux modifier ces trois champs.

### S1-03 — Onboarding narratif ≤ 10 min `[M2 Onboarding]` — **L**
En tant que nouvel utilisateur, je veux un parcours narratif en 8 étapes sur le « chemin », afin de me raconter (situation, vision, domaines, projets, charge mentale, style d'accompagnement, motivation) sans avoir l'impression de passer un test.
- *Given* mon compte créé, *When* je déroule l'onboarding sans me presser, *Then* je le termine en ≤ 10 min (chrono médian mesuré sur 5 testeurs).
- *Given* n'importe quel écran d'onboarding, *Then* les mots « test », « diagnostic », « analyse psychologique » n'apparaissent nulle part.
- *Given* un onboarding interrompu, *When* je reviens, *Then* je reprends à l'étape où j'étais.

### S1-04 — Questionnaire DISC discret `[M2 Onboarding][M3 Profil]` — **M**
En tant que nouvel utilisateur, je veux répondre à au plus 11 questions de style, afin qu'AMANA adapte son accompagnement sans jamais m'étiqueter.
- *Given* l'étape DISC, *When* je réponds, *Then* il y a au maximum 11 questions et le résultat est stocké dans mon profil.
- *Given* mon profil DISC stocké, *When* je navigue dans l'app, *Then* aucune étiquette DISC (« tu es un D ») n'est jamais affichée.

### S1-05 — Synthèse narrative ajustable `[M2 Onboarding][M3 Profil]` — **M**
En tant que nouvel utilisateur, je veux relire et corriger la synthèse de mon histoire (« mission personnelle »), afin que le point de départ soit juste et m'appartienne.
- *Given* la fin des 8 étapes, *When* la synthèse s'affiche, *Then* je peux modifier chaque élément (valeurs, vision, style) avant validation.
- *Given* ma synthèse validée, *Then* valeurs cardinales (3), vision et style d'accompagnement sont enregistrés dans mon profil évolutif.

### S1-06 — Trois portes d'entrée `[M2 Onboarding]` — **S**
En tant que nouvel utilisateur, je veux choisir entre « Commencer par un projet », « Architecturer ma vie » et « Architecturer un domaine », afin d'entrer par ce qui me préoccupe vraiment.
- *Given* ma synthèse validée, *When* l'écran final s'affiche, *Then* les 3 portes sont proposées et mon choix conditionne le premier écran suivant.
- *Given* mon choix, *Then* un événement `onboarding_completed` est enregistré avec la porte choisie.

### S1-07 — Profil évolutif consultable `[M3 Profil]` — **M**
En tant qu'utilisateur, je veux consulter et modifier mon profil (valeurs, vision, style d'accompagnement), afin qu'il évolue avec moi.
- *Given* mon compte, *When* j'ouvre l'écran Profil, *Then* je vois valeurs cardinales, vision, style — et je peux modifier chacun.
- *Given* une modification, *Then* la conversation suivante en tient compte (visible dans le contexte injecté).

### S1-08 — Première conversation en entonnoir `[M5 Assistant]` — **L**
En tant qu'utilisateur, je veux converser avec AMANA selon l'entonnoir (Accueil → Exploration → Clarification → Alignement → action datée), afin d'y voir plus clair et de repartir avec un premier pas concret.
- *Given* une conversation significative, *When* elle se conclut, *Then* une action avec échéance a été proposée, validée par moi et enregistrée.
- *Given* mes messages, *When* AMANA reformule, *Then* elle me demande validation avant de conseiller.
- *Given* toute réponse d'AMANA, *Then* aucun « tu dois », aucune culpabilisation, aucun langage anthropomorphique (cas de test automatisés sur la bibliothèque conversationnelle).
- *Given* le scénario « Je suis perdu » de `AI_BEHAVIOR.md` §6, *When* joué en préprod, *Then* le déroulé observé suit questions → reformulation → action datée.

### S1-09 — Streaming et mémoire de session `[M5 Assistant]` — **M**
En tant qu'utilisateur, je veux des réponses fluides qui tiennent compte du fil de la conversation en cours, afin d'avoir un échange naturel.
- *Given* une conversation ouverte, *When* AMANA répond, *Then* la réponse s'affiche en streaming (< 2 s avant le premier mot).
- *Given* 10 échanges dans la même session, *When* je fais référence à un message précédent, *Then* AMANA en tient compte sans que je répète.

### S1-10 — Events de base `[M10 Admin]` — **S**
En tant qu'admin, je veux que `signup`, `onboarding_completed` et `first_conversation` soient tracés, afin de mesurer l'activation dès la bêta.
- *Given* un nouvel inscrit, *When* il franchit chaque jalon, *Then* l'événement est enregistré en base et visible dans PostHog, sans contenu personnel en clair.

### S1-11 — Socle sécurité `[M12 Sécurité]` — **M**
En tant qu'utilisateur, je veux que mes données soient isolées et protégées dès le premier jour, afin de pouvoir confier des choses personnelles.
- *Given* deux comptes A et B, *When* A tente d'accéder à une ressource de B (test automatisé RLS), *Then* l'accès est refusé.
- *Given* l'application déployée, *Then* toutes les clés API sont côté serveur (aucune dans le bundle client) et le trafic est intégralement en HTTPS.

---

## Sprint 2 — Le cœur (Décharge · Mémoire · Projets · Dashboard)

### S2-01 — Décharge mentale `[M5 Assistant]` — **L**
En tant qu'utilisateur surchargé, je veux vider tout ce que j'ai en tête en texte libre et voir AMANA le structurer, afin de me libérer la charge mentale en quelques minutes.
- *Given* l'entrée « Déposer ce que j'ai en tête », *When* j'écris 15 items en vrac et j'envoie, *Then* AMANA me propose une structuration en projets / tâches / décisions / rappels (tool use `propose_structure`).
- *Given* les propositions affichées, *When* je valide, corrige ou supprime chaque élément, *Then* seuls les éléments validés sont créés en base.
- *Given* une décharge validée, *Then* l'événement `mental_download_completed` est enregistré et le dashboard reflète les nouveaux éléments.

### S2-02 — Écriture mémoire filtrée `[M4 Mémoire]` — **M**
En tant qu'utilisateur, je veux qu'AMANA ne retienne que ce qui est utile, durable et important, afin de ne pas être fiché pour chaque phrase prononcée.
- *Given* une conversation contenant un fait durable (ex. une valeur, un blocage récurrent), *When* elle se termine, *Then* une mémoire est créée avec sa couche (stable/évolutive/apprentissage) et sa source.
- *Given* une conversation contenant des détails éphémères ou sensibles non nécessaires, *Then* aucune mémoire n'est créée pour ces éléments (cas de test dédiés).

### S2-03 — Rappel des mémoires en conversation `[M4 Mémoire]` — **M**
En tant qu'utilisateur, je veux qu'AMANA se souvienne de ce que je lui ai confié, afin de ne pas me répéter.
- *Given* une mémoire « avance mieux le matin » créée la semaine passée, *When* je parle de planifier une tâche exigeante, *Then* la réponse peut s'appuyer sur cette mémoire (rappel sémantique pgvector).
- *Given* aucune mémoire pertinente, *Then* AMANA n'invente jamais un souvenir (cas de test : question piège « qu'est-ce que je t'ai dit sur X ? »).

### S2-04 — Écran Mémoire : consulter, modifier, supprimer `[M4 Mémoire][M12 Sécurité]` — **M**
En tant qu'utilisateur, je veux voir tout ce qu'AMANA sait de moi et le corriger ou l'effacer, afin de garder le contrôle total.
- *Given* l'écran Mémoire, *When* je l'ouvre, *Then* toutes mes mémoires sont listées par couche, en langage clair.
- *Given* une mémoire, *When* je la modifie ou la supprime, *Then* le changement est immédiat et la version supprimée n'est plus jamais utilisée en conversation.

### S2-05 — Projets simplifiés `[M6 Projets]` — **M**
En tant qu'utilisateur, je veux créer un projet avec vision, objectif, prochaine action et échéance, afin de le rendre concret sans usine à gaz.
- *Given* la création guidée, *When* je termine, *Then* le projet a au minimum un titre et un statut ; vision/objectif/prochaine action/échéance sont proposés mais non bloquants.
- *Given* un projet en phase de création (idée qui mûrit), *When* je le crée en « futur », *Then* aucune pression de structuration (pas d'objectif requis, pas de %).

### S2-06 — Limite de 3 projets actifs `[M6 Projets]` — **S**
En tant qu'utilisateur, je veux être aidé à choisir quand je dépasse 3 projets actifs, afin de rester concentré sur ce qui compte.
- *Given* 3 projets actifs, *When* j'active un 4ᵉ, *Then* l'app me demande lequel passe en secondaire/en attente — impossible d'avoir 4 actifs.
- *Given* la liste projets, *Then* les 5 statuts existent (actifs / secondaires / en attente / futurs / abandonnés) et la boîte à idées reçoit les capturés en un geste.

### S2-07 — CRUD des actions `[M7 Actions]` — **M**
En tant qu'utilisateur, je veux créer, modifier, terminer, reporter ou bloquer une action avec échéance, afin de piloter mes journées simplement.
- *Given* une action, *When* je change son état (à faire / en cours / terminé / reporté / bloqué), *Then* l'état et l'événement associé sont enregistrés.
- *Given* une action créée en conversation (tool use `create_action`), *Then* elle apparaît dans mes actions avec son échéance.
- *Given* une action marquée bloquée, *Then* AMANA propose l'analyse causale (flou/peur/organisation/ressources/surcharge) et la réduction à 10 min — sans reproche.

### S2-08 — Dashboard : intention + 1 & 2 priorités `[M8 Dashboard]` — **L**
En tant qu'utilisateur, je veux une page principale avec l'intention du jour et 1 priorité essentielle + 2 secondaires, afin de savoir en un regard ce qui compte aujourd'hui.
- *Given* mes actions et projets, *When* j'ouvre le dashboard, *Then* je vois 1 essentielle + ≤ 2 secondaires sélectionnées selon l'algorithme de `DASHBOARD.md` §3, chacune avec son « pourquoi » en une ligne.
- *Given* les propositions, *When* je remplace ou réordonne, *Then* mon choix prime et est conservé pour la journée.
- *Given* deux candidates à scores proches (< 10 %), *Then* la question signature m'est posée au lieu d'un choix machine.

### S2-09 — Chemin consolidé + indices v1 `[M8 Dashboard]` — **M**
En tant qu'utilisateur, je veux voir mes projets actifs sur le chemin et mes 3 indices (Clarté / Action / Alignement), afin de percevoir ma progression sans usine à statistiques.
- *Given* mes 7 derniers jours d'événements, *When* le job quotidien tourne, *Then* les 3 indices sont calculés selon les formules de `DASHBOARD.md` §5.
- *Given* un indice, *When* je le touche, *Then* « Comment c'est calculé » s'affiche en langage humain, y compris la limite assumée de l'Alignement v1.
- *Given* moins de données que le seuil, *Then* l'indice affiche « en construction » — jamais 0/100.

### S2-10 — États vides et premier jour `[M8 Dashboard]` — **S**
En tant que nouvel utilisateur, je veux un dashboard accueillant dès le jour 1, afin de ne jamais tomber sur un écran vide ou culpabilisant.
- *Given* ma sortie d'onboarding, *When* j'arrive sur le dashboard, *Then* il reflète ma porte d'entrée (cf. `DASHBOARD.md` §6) et les indices sont masqués avec explication.
- *Given* un retour après ≥ 7 jours, *Then* aucune mention de retard ni ton de reproche ; les priorités périmées sont proposées à reprogrammer.

---

## Sprint 3 — La boucle (Rappels · Bilans · Feedback · Admin · RGPD)

### S3-01 — Rappels intelligents `[M11 Notifications]` — **L**
En tant qu'utilisateur, je veux des rappels utiles aux bons moments (avant échéance, échéance manquée, après réussite), afin d'être soutenu sans être harcelé.
- *Given* une priorité avec échéance à demain, *When* le rappel part, *Then* il demande « est-ce toujours la bonne priorité ? » (push web et/ou email selon mes préférences).
- *Given* une échéance manquée, *Then* le message propose de reprogrammer — vocabulaire neutre, jamais alarmiste, max 1 rappel par déclencheur.
- *Given* une action terminée importante, *Then* un rappel de capitalisation propose la question « qu'est-ce qui a fonctionné ? ».
- *Given* mes préférences, *When* je coupe un type de rappel, *Then* il ne part plus.

### S3-02 — Rituel du matin `[M8 Dashboard]` — **M**
En tant qu'utilisateur, je veux un rituel du matin de 2 minutes (état, intention, priorités), afin de commencer la journée au clair.
- *Given* ma première visite du jour, *When* j'ouvre le rituel, *Then* je passe check-in état → intention → validation des priorités en ≤ 2 min, et `morning_ritual_done` + `priority_confirmed` sont enregistrés.
- *Given* un stress fort déclaré, *Then* seule l'essentielle est mise en avant, en version réduite si possible.
- *Given* que je saute le rituel, *Then* le dashboard fonctionne normalement (jamais bloquant).

### S3-03 — Mini-bilan du soir `[M8 Dashboard][M9 Feedback]` — **M**
En tant qu'utilisateur, je veux un mini-bilan du soir (accompli, appris, à ajuster, lâcher-prise), afin de clôturer ma journée sereinement.
- *Given* le bilan du soir, *When* je le complète, *Then* les 4 questions sont posées, `evening_review_done` est enregistré avec la réponse lâcher-prise, et un apprentissage saisi part en mémoire (couche apprentissage).
- *Given* une priorité non faite, *Then* le bilan propose l'analyse causale et une reprogrammation — aucune formulation de reproche (revue de tous les libellés).

### S3-04 — Bilan hebdomadaire généré `[M5 Assistant][M9 Feedback]` — **M**
En tant qu'utilisateur, je veux un bilan de semaine (accomplissements, apprentissages, blocages, priorités à venir), afin de prendre du recul régulièrement.
- *Given* dimanche soir (ou jour choisi), *When* le bilan est généré depuis mes événements de la semaine, *Then* il liste les 4 rubriques et se conclut par une proposition de priorités pour la semaine — modifiable.
- *Given* une semaine sans activité, *Then* le bilan reste bienveillant et propose simplement de reprendre par une décharge.

### S3-05 — Feedback post-action & signalement IA `[M9 Feedback]` — **M**
En tant qu'utilisateur, je veux signaler une réponse d'IA inadaptée et répondre à de courtes questions après mes actions, afin qu'AMANA apprenne ce qui m'aide vraiment.
- *Given* une réponse d'AMANA, *When* je touche « réponse inadaptée », *Then* le signalement (message, motif optionnel) est enregistré et visible côté admin.
- *Given* une action terminée, *When* la question post-action s'affiche (« qu'est-ce qui a aidé ? »), *Then* ma réponse est enregistrée et je peux l'ignorer sans friction.
- *Given* un feedback donné, *Then* il est reconnu sobrement (remerciement simple, pas de gamification clinquante).

### S3-06 — Dashboard admin : funnel & rétention `[M10 Admin]` — **L**
En tant qu'admin, je veux un tableau de bord acquisition → activation → engagement → rétention, afin de piloter la bêta avec des faits.
- *Given* la page admin (accès restreint aux rôles admin), *When* je l'ouvre, *Then* je vois : funnel signup → onboarding_completed → first_conversation → mental_download_completed, rétention J1/J3/J7, et frictions (étapes d'abandon d'onboarding).
- *Given* les filtres langue / profil DISC / domaine / porte d'entrée, *When* j'en applique un, *Then* toutes les métriques se recalculent.
- *Given* les données affichées, *Then* elles sont agrégées/anonymisées — jamais de contenu de conversation lisible.

### S3-07 — Qualité IA côté admin `[M10 Admin]` — **M**
En tant qu'admin, je veux suivre la qualité de l'agent (taux de conversations conclues par une action datée, signalements, `distress_detected`), afin d'itérer sur le prompt chaque semaine.
- *Given* la section Qualité IA, *When* je l'ouvre, *Then* je vois ces 3 indicateurs sur 7/30 jours et la liste des signalements avec motif.
- *Given* un événement `distress_detected`, *Then* il est compté sans exposer le contenu de la conversation.

### S3-08 — Export et suppression de compte (RGPD) `[M12 Sécurité]` — **M**
En tant qu'utilisateur, je veux exporter mes données et supprimer mon compte, afin d'exercer mes droits.
- *Given* mes préférences, *When* je demande l'export, *Then* je reçois un fichier lisible (JSON) contenant profil, mémoires, projets, actions, conversations.
- *Given* la suppression demandée et confirmée, *Then* toutes mes données sont supprimées en cascade (délai annoncé, `deleted_at` puis purge) et mon email ne permet plus de retrouver l'ancien compte.

### S3-09 — Audit sécurité & sauvegardes `[M12 Sécurité]` — **M**
En tant qu'admin, je veux un audit RLS complet et des sauvegardes vérifiées, afin de protéger des données très personnelles.
- *Given* la suite de tests RLS, *When* elle tourne en CI, *Then* chaque table est couverte par un test d'isolation entre 2 comptes.
- *Given* les sauvegardes Supabase, *When* une restauration d'essai est effectuée en préprod, *Then* elle aboutit et est documentée.

### S3-10 — Polish PWA & offline `[M1 Compte][M8 Dashboard]` — **M**
En tant qu'utilisateur mobile, je veux installer AMANA et consulter mon dashboard même sans réseau, afin de l'avoir toujours sous la main.
- *Given* mon mobile, *When* je visite l'app, *Then* l'installation PWA est proposée de façon guidée et fonctionne (iOS/Android).
- *Given* une coupure réseau, *When* j'ouvre le dashboard, *Then* le dernier snapshot s'affiche et mes changements d'état d'action partent à la reconnexion.

---

## Couverture des 12 modules (traçabilité)

| Module | Stories |
|---|---|
| M1 Compte utilisateur | S1-01, S1-02, S3-10 |
| M2 Onboarding narratif | S1-03, S1-04, S1-05, S1-06 |
| M3 Profil évolutif | S1-04, S1-05, S1-07 |
| M4 Mémoire intelligente | S2-02, S2-03, S2-04 |
| M5 Assistant conversationnel | S1-08, S1-09, S2-01, S3-04 |
| M6 Gestion des projets | S2-05, S2-06 |
| M7 Gestion des actions | S2-07 |
| M8 Dashboard quotidien | S2-08, S2-09, S2-10, S3-02, S3-03, S3-10 |
| M9 Feedback & apprentissage | S3-03, S3-04, S3-05 |
| M10 Dashboard administrateur | S1-10, S3-06, S3-07 |
| M11 Notifications intelligentes | S3-01 |
| M12 Sécurité / RGPD | S1-11, S2-04, S3-08, S3-09 |
