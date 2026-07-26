# AMANA — DASHBOARD.md (MVP)

> Spécification de la **page principale unique** du MVP. Le dashboard est « une fenêtre claire sur ce qui compte aujourd'hui », **pas un centre de contrôle**.
> Sources : `01_AMANA_COMPILATION.md` (§7, §8, §14 : indices **Clarté · Action · Alignement**, priorités **1 + 2**) ; `03_ROADMAP_MVP.md` (Sprint 2 pour la page, Sprint 3 pour les rituels/rappels).
> Design : sobre, respirant, calme — jamais « usine à statistiques ». Vocabulaire : « Ce qui compte aujourd'hui », « Ta prochaine étape ».

---

## 1. Structure de la page (ordre vertical, mobile-first)

```
┌──────────────────────────────────────┐
│ 1. Intention du jour                 │  question + réponse du matin (ou CTA rituel)
├──────────────────────────────────────┤
│ 2. Priorités : 1 essentielle         │  carte mise en avant (or)
│    + 2 secondaires                   │  cartes sobres
├──────────────────────────────────────┤
│ 3. Chemin consolidé                  │  projets actifs (≤3) sur le chemin, prochaine étape
├──────────────────────────────────────┤
│ 4. Indices : Clarté · Action ·       │  3 jauges discrètes, tap → explication honnête
│    Alignement                        │
├──────────────────────────────────────┤
│ 5. Entrées : [Parler à AMANA]        │  accès conversation / décharge mentale
│    [Déposer ce que j'ai en tête]     │
└──────────────────────────────────────┘
```

Interdits de design : compteurs multiples, graphiques denses, badges clinquants, rouge d'alerte, tout élément culpabilisant (retards en rouge, séries brisées).

---

## 2. Intention du jour

**Quoi** : une question courte affichée en haut de page, à laquelle l'utilisateur répond une fois par jour (rituel du matin, §7). Sa réponse (1 phrase libre) reste affichée toute la journée comme cap.

**Génération (v1, côté serveur — `claude-haiku-4-5`)**
- Entrées : profil (valeurs cardinales, vision, style d'accompagnement), priorités de la veille et leur issue, état stress/énergie du dernier check-in, jour de la semaine.
- Sortie : 1 question de ≤ 120 caractères, jamais culpabilisante, jamais « tu dois ».
- Fallback statique (si l'appel IA échoue ou profil vide) — rotation de 7 questions génériques, dont la question signature : « Si tu ne pouvais accomplir qu'une seule chose aujourd'hui, laquelle aurait le plus d'impact ? »

**Adaptation au profil / à l'état**
| Contexte | Teinte de la question |
|---|---|
| Stress fort déclaré la veille/le matin | Apaisante, centrée sur une seule chose : « Quelle est la seule chose qui mérite ton attention aujourd'hui ? » |
| Énergie haute | Orientée défi : « Quelle avancée significative est à ta portée aujourd'hui ? » |
| Veille = priorité essentielle non faite | Sans reproche, causale : « Qu'est-ce qui rendrait [priorité] plus simple aujourd'hui ? » |
| Réussite la veille | Capitalisation : « Qu'est-ce qui a fonctionné hier que tu peux refaire aujourd'hui ? » |
| Défaut | Alignement doux : lien avec une valeur cardinale ou la vision |

**Cache** : générée 1 fois par jour (à la première visite après 4 h du matin, fuseau utilisateur), stockée ; jamais régénérée dans la journée.

---

## 3. Priorités du jour : 1 essentielle + 2 secondaires

**Règle produit** (arbitrage §14) : **maximum 3 priorités**, hiérarchisées — 1 **essentielle** (visuellement dominante) + 2 **secondaires**. Distinction Important / Urgent / **Essentiel** ; « activité ≠ progression ».

**Qui décide** : l'algorithme **propose**, l'utilisateur **dispose**. Au rituel du matin, les 3 propositions sont présentées ; l'utilisateur confirme, réordonne ou remplace (depuis ses actions à faire). Sans rituel effectué, les propositions s'affichent avec la mention « proposé par AMANA » et restent modifiables.

### Algorithme de sélection v1 (score par action candidate)

Candidates : actions en état `à faire` ou `en cours`, non bloquées, appartenant à un projet actif ou sans projet, échéance ≤ 7 jours ou sans échéance mais marquées importantes.

```
score(action) =
    2.0 × urgence        // échéance : aujourd'hui/dépassée=1 ; demain=0.8 ; ≤3j=0.6 ; ≤7j=0.3 ; sinon 0
  + 1.5 × importance     // priorité déclarée sur l'action (haute=1, normale=0.5, basse=0.2)
  + 1.5 × alignement     // action liée à un projet actif dont le domaine/valeurs recoupent
                         // les valeurs cardinales du profil = 1 ; projet actif sans lien explicite = 0.6 ;
                         // action orpheline = 0.3
  + 1.0 × continuité     // action = « prochaine action » désignée d'un projet actif = 1, sinon 0
  − 1.0 × répétition     // reportée ≥ 3 fois = 1 (elle a besoin d'être re-clarifiée, pas re-poussée :
                         // proposer de la réduire à 10 min plutôt que de la re-prioriser telle quelle)
```

- **Essentielle** = meilleur score, avec départage par la **question signature** : en cas d'écart < 10 % entre les deux premières, ne pas trancher par la machine — poser à l'utilisateur : « Si tu ne pouvais accomplir qu'une seule chose aujourd'hui, laquelle aurait le plus d'impact ? » (choix binaire).
- **Secondaires** = 2 meilleurs scores suivants, avec contrainte de diversité : pas 3 actions du même projet si un autre projet actif a une action candidate.
- **Adaptation à l'état** : stress fort déclaré → n'afficher que **l'essentielle** (réduite à une version ≤ 30 min si possible), masquer les secondaires derrière « Voir plus » ; énergie haute → l'essentielle peut être l'action la plus ambitieuse à score proche (bonus +0.3 sur la durée estimée la plus longue).
- Transparence : chaque proposition affiche en une ligne son pourquoi (« échéance demain », « prochaine étape de [projet] », « aligné avec [valeur] »).

---

## 4. Chemin consolidé

Vue « paysage » sobre des **projets actifs (max 3)**, dans la métaphore du chemin (pointillés or, étapes en cercles) :

- Par projet : nom, domaine, **prochaine action** (tap = ouvrir/faire/reprogrammer), échéance la plus proche, progression simple (% d'actions terminées sur les actions définies, ou « en exploration » pour un projet en phase de création — on n'affiche pas de % à un projet qui mûrit).
- Lien discret vers « Projets secondaires / en attente / boîte à idées » (liste simple, pas sur le chemin).
- Zoom (profondeur, §8) : tap sur un projet → page projet. Le dashboard ne montre jamais le détail des tâches — il reste une fenêtre.

---

## 5. Les 3 indices : Clarté · Action · Alignement

**Philosophie** : indicateurs **personnels, honnêtes et explicables** — jamais un score de performance, jamais comparés à d'autres. Chaque indice est cliquable et affiche sa formule en langage humain (« Comment c'est calculé »). Échelle 0–100, fenêtre glissante de **7 jours**, recalcul quotidien (job du matin). Le « lâcher-prise » n'est **pas** un indice : c'est une question du bilan du soir (arbitrage §14).

Événements requis (table `events`) : `task_created`, `task_completed`, `task_postponed`, `task_due_set`, `project_activated`, `project_next_action_set`, `mental_download_completed`, `conversation_concluded` (payload : action datée oui/non), `morning_ritual_done`, `evening_review_done` (payload : réponse lâcher-prise, apprentissage oui/non), `priority_confirmed`.

### 5.1 Clarté — « Est-ce que je sais où je vais et quoi faire ensuite ? »

```
clarte = 100 × moyenne pondérée sur 7 j de :
  0.4 × part des projets actifs ayant une « prochaine action » définie ET une échéance
  0.3 × part des actions à faire ayant une échéance
  0.3 × ratio de jours avec priorités confirmées (priority_confirmed / 7)
```

Honnêteté : si < 3 projets ou < 5 actions existent, afficher « en construction » plutôt qu'un chiffre instable.

### 5.2 Action — « Est-ce que j'avance sur ce qui compte ? »

```
action = 100 × moyenne pondérée sur 7 j de :
  0.5 × taux de complétion des priorités du jour (priorités faites / priorités confirmées)
  0.3 × ratio de jours avec ≥ 1 task_completed (régularité — on valorise les causes)
  0.2 × (1 − taux de report) où taux de report = task_postponed / (task_postponed + task_completed)
```

Garde-fous anti-culpabilisation : jamais affiché en rouge ; en baisse, le libellé reste factuel (« moins d'actions terminées cette semaine ») et propose une aide (« une action te bloque ? on peut la réduire »), jamais un reproche. Un jour sans aucune activité ne pénalise le ratio de régularité qu'à hauteur de sa pondération — pas de « série brisée ».

### 5.3 Alignement — « Ce que je fais sert-il ce qui compte pour moi ? »

```
alignement = 100 × moyenne pondérée sur 7 j de :
  0.5 × part des tasks_completed liées à un projet actif (vs actions orphelines/dispersion)
  0.3 × part des projets actifs explicitement reliés à une valeur cardinale ou au niveau
        Mission/Domaine de l'architecture de vie
  0.2 × ratio de jours avec evening_review_done (la conscience de l'alignement passe par le bilan)
```

Limite assumée v1 : l'alignement « réel » (cohérence profonde valeurs/vision, KPI signature §3) est un jugement qualitatif — cette v1 mesure des **proxys comportementaux** et le dit dans « Comment c'est calculé » : « Cet indice est une estimation simple ; toi seul sais s'il est juste. » Les check-ups qualitatifs par projet (maquette « Purpose & alignement ») sont différés post-MVP.

---

## 6. États vide et premier jour

| État | Affichage |
|---|---|
| **Jour 1 (sortie d'onboarding)** | Le dashboard reflète la porte d'entrée choisie : le 1er projet créé sur le chemin (ou l'invitation à en créer un), **1 seule priorité** (la première action datée issue de l'onboarding ou de la première conversation), intention du jour générée depuis la synthèse narrative. Indices **masqués**, remplacés par : « Tes repères Clarté, Action et Alignement apparaîtront après quelques jours d'usage. » |
| **Aucun projet** | Chemin remplacé par une invitation sobre : « Commence par déposer ce que tu as en tête » (CTA décharge mentale) ou « Créer un premier projet ». Jamais un écran vide brut. |
| **Aucune action candidate** | Zone priorités : « Rien d'urgent aujourd'hui. Tu veux avancer sur [projet le moins actif] ou simplement déposer ce qui t'occupe ? » |
| **Indices sans données (J1–J6)** | « En construction » + jour d'apparition estimé. Jamais de 0/100 affiché faute de données. |
| **Retour après ≥ 7 jours d'absence** | Accueil sans reproche : « Content de te revoir » est interdit (anthropomorphique) → « Reprenons simplement. Qu'est-ce qui a changé depuis la dernière fois ? » + proposition de re-décharge ; les priorités périmées sont proposées à reprogrammer, pas affichées « en retard ». |

---

## 7. Rituels (Sprint 3)

### Rituel du matin (~2 min)
1. Check-in état : « Comment tu arrives ce matin ? » (2 curseurs simples : énergie basse/normale/haute, charge légère/normale/forte) → alimente l'adaptation du jour.
2. Intention du jour : question affichée → réponse libre en 1 phrase (facultative).
3. Priorités : validation/ajustement des 3 propositions (départage par question signature si nécessaire).
→ événements : `morning_ritual_done`, `priority_confirmed`. Accessible mais **jamais bloquant** : le dashboard fonctionne sans rituel fait.

### Mini-bilan du soir (~2 min)
1. « Qu'est-ce que tu as accompli aujourd'hui ? » (cases sur les priorités + champ libre court)
2. « Qu'est-ce que tu as appris ? » (facultatif → mémoire couche apprentissage, avec filtre)
3. « Quoi ajuster demain ? » (facultatif → peut créer/reprogrammer une action datée)
4. **Lâcher-prise** : « Aujourd'hui, est-ce que tu as porté uniquement ce qui dépend réellement de toi ? » (oui / pas vraiment + champ libre facultatif)
→ événement `evening_review_done`. Une priorité non faite déclenche l'analyse causale bienveillante (flou / peur / organisation / ressources / surcharge → proposer étape de 10 min ou reprogrammation), **jamais** un constat d'échec.

### Rappels associés (règles, Sprint 3)
- Matin (heure choisie par l'utilisateur) : invitation au rituel — désactivable.
- Avant échéance d'une priorité : « Est-ce toujours la bonne priorité ? »
- Échéance manquée : proposer de reprogrammer (jamais de ton d'alerte).
- Après réussite : proposer de capitaliser (question A2 de la bibliothèque).
- Soir : invitation au mini-bilan. **Aucune notification addictive** (pas de relance en rafale, max 1 rappel par déclencheur).

---

## 8. Données & API (alignement brief)

- `GET /dashboard` renvoie : `{ intention, priorities: {essential, secondary[2]}, path: projects[≤3], indices: {clarte, action, alignement, status}, state: {stress, energie} }`.
- Calcul des indices : job quotidien (04 h fuseau utilisateur) + recalcul à la volée après `evening_review_done`.
- Tous les affichages du dashboard doivent être rendables **hors connexion** (PWA : dernier snapshot en cache), les mutations passant en file d'attente.
