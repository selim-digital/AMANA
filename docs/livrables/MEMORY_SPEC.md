# AMANA — MEMORY_SPEC.md

> Spécification de la mémoire intelligente — **la fonction fondatrice** d'AMANA (§4 de `01_AMANA_COMPILATION.md`).
> Répond aux quatre questions du brief : **que mémorise-t-on ? quand ? pourquoi ? qui peut modifier ?**
> Implémentation : table `memories` de DOMAIN_MODEL.md (Postgres + pgvector), un seul agent conversationnel au MVP (arbitrage §14).

---

## 1. Principes directeurs

1. **La mémoire sert la personne, pas le système.** Elle existe pour lutter contre l'oubli (engagements, intentions, apprentissages, progrès) et permettre un accompagnement réellement personnalisé — jamais pour profiler, vendre ou manipuler (charte §12).
2. **Minimisation** : tout ne se conserve pas. Chaque information passe le filtre **utilité / durabilité / importance** avant stockage.
3. **Contrôle utilisateur obligatoire** : consulter, modifier, supprimer, désactiver — toute mémoire, à tout moment, depuis l'écran Mémoire.
4. **Transparence** : l'utilisateur sait ce qu'AMANA retient et pourquoi (chaque entrée garde sa source). Vocabulaire non anthropomorphique : « AMANA a noté », jamais « AMANA pense/se souvient avec émotion ».
5. **La source de vérité est structurée** : la table `memories` est relationnelle et typée ; le vecteur (`embedding vector(1024)`) ne sert **qu'au rappel sémantique**, jamais de stockage autonome.

---

## 2. Architecture : court terme et long terme

| Niveau | Contenu | Support technique |
|---|---|---|
| **Court terme** | Conversation en cours, objectif immédiat de l'échange | Contexte du prompt (messages de la conversation), non persisté comme mémoire |
| **Long terme — `stable`** | Identité, valeurs cardinales, vision de vie, mission | `memories.layer = 'stable'` (+ miroir dans `profiles`/`values`) |
| **Long terme — `evolutive`** | Projets, priorités, contexte de vie (déménagement, associé, période chargée…) | `memories.layer = 'evolutive'` |
| **Long terme — `learning`** | Forces, blocages récurrents, méthodes qui fonctionnent pour cette personne | `memories.layer = 'learning'` |

Règles par couche :

- **`stable`** : rare, changement = événement de vie. Modification proposée uniquement avec **validation explicite** de l'utilisateur. Jamais d'expiration automatique.
- **`evolutive`** : mise à jour continue ; une nouvelle mémoire peut **remplacer** une ancienne (l'ancienne passe `archived`, jamais écrasée silencieusement). `expires_at` possible (ex. « en période d'examens jusqu'à juin »).
- **`learning`** : accumulée par observation d'usage et feedback ; alimente les `insights` (« J'ai remarqué que tu avances mieux quand… »). Confiance croissante : un pattern n'est affirmé qu'après répétition (≥ 2–3 occurrences dans `events`).

La **base d'événements** (`events` : projet créé, tâche terminée, blocage, apprentissage…) n'est pas de la mémoire conversationnelle mais son carburant : les patterns détectés dans `events` deviennent des mémoires `learning` ou des `insights`. Vision cible V1+ : graphe de connaissance personnel (Utilisateur → Valeurs → Domaines → Projets → Actions → Apprentissages).

---

## 3. Que mémorise-t-on ? (et que ne mémorise-t-on jamais)

### On mémorise (si le filtre passe)

| Catégorie (`kind`) | Couche | Exemples |
|---|---|---|
| `identity` | stable | Prénom, situation (entrepreneur, parent), langue |
| `value` | stable | « L'honnêteté est sa 1ʳᵉ valeur cardinale » |
| `vision` | stable | Vision de vie, mission personnelle issue de l'onboarding |
| `project_context` | evolutive | « Lance une formation en ligne, échéance septembre » |
| `priority` | evolutive | « Priorité actuelle : santé avant croissance du CA » |
| `life_context` | evolutive | « Déménagement prévu cet été » |
| `strength` | learning | « Très efficace le matin avant 9h » |
| `blocker` | learning | « Bloque quand l'action n'est pas découpée » |
| `method` | learning | « Les étapes de 10 minutes débloquent sa procrastination » |
| `preference` | stable/evolutive | « Préfère un ton direct, sans détour » ; dimension spirituelle activée |

### On ne mémorise jamais (garde-fous durs)

- **Données de santé, diagnostics, états psychologiques cliniques** — aucun diagnostic médical (charte §12). Si l'utilisateur évoque une souffrance : l'agent oriente vers des professionnels, **rien n'est stocké en mémoire** (seul un event technique neutre `distress_redirect` sans contenu peut être journalisé).
- Données de tiers identifiables au-delà du nécessaire (prénom/rôle d'un associé lié à un projet : oui ; informations personnelles sur ce tiers : non).
- Croyances/opinions sensibles **non volontairement partagées comme cadre d'accompagnement** (la dimension spirituelle n'est mémorisée que si l'utilisateur l'active).
- Contenu brut des conversations (les `messages` sont archivés à part ; la mémoire ne duplique pas le verbatim, elle synthétise).
- Le profil DISC reste dans `profiles.disc` (couche d'adaptation invisible), **pas** dans les mémoires affichables — il n'est jamais restitué comme étiquette.

---

## 4. Cycle de vie d'une mémoire

```
┌────────────┐   ┌─────────────┐   ┌──────────────┐   ┌───────────┐
│ 1. Extraction │→│ 2. Filtre    │→│ 3. Validation │→│ 4. Stockage │
│ (tool use)    │ │ U/D/I        │ │ implicite ou  │ │ typé +      │
│               │ │              │ │ explicite     │ │ embedding   │
└────────────┘   └─────────────┘   └──────────────┘   └───────────┘
                                                            │
┌────────────────┐   ┌───────────────┐   ┌────────────────┐ │
│ 7. Modification │←│ 6. Restitution │←│ 5. Rappel        │←┘
│ / suppression   │ │ progressive    │ │ sémantique +     │
│ (utilisateur)   │ │ (insights)     │ │ règles contexte  │
└────────────────┘   └───────────────┘   └────────────────┘
```

### 4.1 Extraction — *quand ?*

Quatre sources (`memories.source`), par ordre d'apparition dans la vie de l'utilisateur :

1. **`onboarding`** : la synthèse narrative validée par l'utilisateur produit les premières mémoires `stable` (valeurs, vision, situation). Statut directement `active` car explicitement validées.
2. **`conversation`** : pendant chaque échange (chat ou décharge mentale), le modèle dispose d'un outil `proposer_memoire` (tool use, Claude via Vercel AI SDK). Il l'appelle quand une information **candidate** apparaît — jamais en interrogatoire : l'acquisition est progressive et non intrusive.
3. **`usage`** : un job serveur (analyse périodique des `events`) détecte des patterns (« 80 % des tâches terminées le sont avant 10h ») → mémoire `learning` proposée.
4. **`feedback` / `user_manual`** : feedback volontaire post-action (champ `learning` des tâches) ou saisie directe dans l'écran Mémoire.

### 4.2 Filtre de pertinence — *pourquoi celle-ci et pas une autre ?*

Chaque candidate est notée de 1 à 5 sur trois axes (par le modèle extracteur, stockés en colonnes) :

- **Utilité** : cette information améliorera-t-elle concrètement l'accompagnement ?
- **Durabilité** : sera-t-elle encore vraie dans 1 mois ? 6 mois ? (une humeur passagère ne passe pas)
- **Importance** : touche-t-elle à ce qui compte pour la personne (valeurs, projets, blocages) ?

**Seuil MVP** : rejet si `utility < 3` **ou** `durability < 2` **ou** `importance < 2`. Les rejetées ne sont **pas stockées** (minimisation), seul un compteur agrégé anonyme est journalisé pour la qualité IA (dashboard admin).

Déduplication avant insertion : recherche des voisines sémantiques (`embedding <=> candidate < 0.15` de distance cosinus). Si quasi-doublon → mise à jour/consolidation de l'existante plutôt que création.

### 4.3 Validation — implicite ou explicite

| Mode | Quand | Mécanique |
|---|---|---|
| **Implicite** | Couches `evolutive` et `learning`, informations factuelles peu sensibles | La mémoire est créée en `status = 'proposed'`, l'agent la mentionne naturellement (« Je note que ton échéance est en septembre. ») avec possibilité d'annuler en un geste. Sans objection ni annulation, elle passe `active` après l'échange. |
| **Explicite** | Couche `stable` (identité, valeurs, vision), toute modification d'une mémoire stable existante, tout ce qui touche aux préférences spirituelles | Question directe (« Veux-tu que je retienne cela ? ») ou validation dans l'écran Mémoire. Sans « oui » clair → non stockée. |

L'utilisateur peut **désactiver la mémorisation** globalement ou par couche (préférence `preferences.memory_opt_out` du profil) : l'outil `proposer_memoire` est alors retiré du prompt.

### 4.4 Stockage typé

Insertion dans `memories` (voir DDL) : couche, `kind`, contenu synthétique **en une phrase autonome et compréhensible hors contexte**, scores U/D/I, source + `source_ref` (traçabilité vers la conversation d'origine), embedding `vector(1024)` calculé sur `content`.

### 4.5 Rappel — sémantique + règles de contexte

À chaque tour de conversation, le serveur construit le contexte mémoire injecté dans le prompt système :

1. **Règles fixes (toujours injectées)** : mémoires `stable` actives (identité, 3 valeurs cardinales, vision, préférences de ton) — volume faible et borné.
2. **Rappel sémantique (pgvector)** : embedding du message utilisateur → top-k (k = 8 au MVP) des mémoires `evolutive`/`learning` actives par distance cosinus, seuil de similarité minimal 0,25 ; `last_recalled_at` mis à jour.
3. **Règles de contexte (métier, prioritaires sur le score)** :
   - conversation liée à un projet → mémoires `project_context` de ce projet remontées d'office ;
   - check-in du matin → priorités actuelles + méthode qui fonctionne ;
   - blocage détecté → mémoires `blocker` et `method` ;
   - stress/surcharge exprimé → réduire le volume injecté (apaisement avant richesse, §2 de la compilation).
4. **Budget de contexte** : plafond de tokens mémoire par tour ; arbitrage par `importance` décroissante.

### 4.6 Restitution progressive

La mémoire ne se « vide » jamais d'un bloc sur l'utilisateur :

- L'agent mobilise les mémoires **naturellement** dans la conversation, sans réciter sa base.
- Les patterns `learning` consolidés deviennent des `insights` (« J'ai remarqué que tu avances mieux quand tu commences par la tâche la plus courte — ça se vérifie sur tes 3 dernières semaines. ») avec `evidence` = ids des mémoires/events → l'utilisateur peut voir **d'où vient** l'observation.
- Ton : hypothèse, jamais verdict (« je peux me tromper », libre arbitre absolu §12).

### 4.7 Modification / suppression — *qui peut modifier ?*

| Acteur | Droits |
|---|---|
| **Utilisateur** | Tout : consulter, **modifier le contenu**, changer la couche, archiver, **supprimer**, désactiver la mémorisation. Écran Mémoire = liste par couche avec source de chaque entrée. Suppression = `deleted_at` immédiat (la mémoire sort de tout rappel **dès le tour suivant**) puis purge définitive ≤ 30 jours ; purge totale immédiate à la suppression du compte (RGPD). |
| **Agent IA** | Peut **proposer** (création, mise à jour, archivage) — ne supprime jamais définitivement, n'écrase jamais silencieusement une mémoire `stable`. |
| **Système (jobs)** | Archive les mémoires expirées (`expires_at`), consolide les doublons, recalcule les embeddings en cas de changement de modèle. Ne crée du contenu qu'en `proposed`. |
| **Admin / équipe** | **Aucun accès en clair** aux mémoires individuelles. Dashboard admin = agrégats anonymisés uniquement (volumes par couche, taux d'acceptation des propositions, qualité IA). |

---

## 5. Format d'une entrée mémoire (exemple JSON)

Représentation API (`GET /api/memory`) d'une ligne de la table `memories` :

```json
{
  "id": "b7e9c2a4-5f3d-4e1a-9c8b-2d6f0a1e7b3c",
  "layer": "learning",
  "kind": "method",
  "content": "Découper une action bloquée en étapes de 10 minutes lui permet de démarrer.",
  "status": "active",
  "source": "conversation",
  "source_ref": "1f4a8d0e-9b2c-4c7a-8e5d-3a6b9c0d1e2f",
  "scores": { "utility": 5, "durability": 4, "importance": 4 },
  "user_editable": true,
  "expires_at": null,
  "last_recalled_at": "2026-07-22T08:14:03Z",
  "created_at": "2026-07-02T19:40:11Z",
  "updated_at": "2026-07-10T07:05:44Z"
}
```

Notes :

- `embedding` n'est **jamais** exposé par l'API (détail interne).
- `source_ref` permet à l'écran Mémoire d'afficher « Retenu lors de ta conversation du 2 juillet » avec lien.
- `content` est toujours une phrase autonome, en langage humain, dans la langue de l'utilisateur.

---

## 6. Critères de qualité (mesurés dès le MVP)

- Taux d'acceptation des mémoires proposées (implicites non annulées + explicites validées) — cible > 80 %.
- Taux de suppression a posteriori par l'utilisateur — signal de sur-mémorisation si élevé.
- Part des tours de conversation où au moins une mémoire rappelée est effectivement pertinente (feedback léger « AMANA était-il à côté ? »).
- Zéro entrée de catégorie interdite (§3) détectée en revue qualité.
