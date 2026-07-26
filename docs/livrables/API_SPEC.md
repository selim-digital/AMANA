# AMANA — API_SPEC.md

> Contrats d'API du MVP — Next.js 15 App Router (Route Handlers `app/api/**/route.ts`) + Supabase.
> Aligné sur `02_STACK.md` (Vercel AI SDK, Claude `claude-sonnet-5` / `claude-haiku-4-5`) et DOMAIN_MODEL.md.
> Convention : **mutations UI simples → Server Actions** possibles, mais tout contrat ci-dessous existe en Route Handler (testable, appelable par la PWA offline-sync et par les tests Playwright).

---

## 1. Conventions générales

### 1.1 Authentification

- **Session Supabase Auth** (cookies gérés par `@supabase/ssr`). Chaque handler crée un client serveur et résout `auth.getUser()`.
- Pas de session valide → `401 UNAUTHORIZED`. Aucune route publique hors auth/webhooks.
- La RLS Postgres est la **seconde ligne de défense** : même un bug serveur ne peut pas lire les données d'un autre utilisateur (le client serveur utilise le token de session, pas `service_role`).
- Routes admin (`/api/admin/**`, hors périmètre de ce document) : `service_role` + garde applicative sur un rôle admin.

### 1.2 Format des réponses

```ts
// Succès
{ "data": <payload> }
// Erreur
{ "error": { "code": "TASK_NOT_FOUND", "message": "…", "details"?: <zod issues> } }
```

### 1.3 Codes d'erreur

| HTTP | `code` | Quand |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Corps/query invalide (issues zod en `details`) |
| 401 | `UNAUTHORIZED` | Session absente ou expirée |
| 403 | `FORBIDDEN` | Ressource d'un autre utilisateur (normalement masqué en 404 par la RLS) |
| 404 | `NOT_FOUND` (`PROJECT_NOT_FOUND`, `TASK_NOT_FOUND`, `MEMORY_NOT_FOUND`…) | Id inconnu ou soft-deleted |
| 409 | `ACTIVE_PROJECTS_LIMIT` | 4ᵉ projet `active` (trigger SQL + contrôle applicatif) |
| 409 | `ESSENTIAL_PRIORITY_TAKEN` | 2ᵉ tâche `essential` sur le même jour |
| 409 | `IDEMPOTENCY_CONFLICT` | Même `Idempotency-Key` avec un corps différent |
| 422 | `MEMORY_NOT_EDITABLE` | Tentative de modification d'une mémoire `user_editable = false` |
| 429 | `RATE_LIMITED`, `AI_QUOTA_EXCEEDED` | Limite de débit / plafond IA du palier gratuit |
| 500 | `INTERNAL` | Erreur inattendue (loggée, jamais détaillée au client) |
| 503 | `AI_UNAVAILABLE` | Claude API indisponible (le reste de l'app fonctionne) |

### 1.4 Idempotence

Tous les **POST créateurs** acceptent l'en-tête **`Idempotency-Key`** (uuid généré client, obligatoire pour `/api/decharge/commit` et recommandé pour `/api/tasks` et `/api/projects` — la PWA rejoue ses requêtes après coupure réseau) :

- Clé stockée 24 h (table `idempotency_keys(user_id, key, request_hash, response jsonb)` ou Upstash) ;
- Même clé + même corps → **rejeu de la réponse d'origine, aucune ré-exécution** ;
- Même clé + corps différent → `409 IDEMPOTENCY_CONFLICT`.

**Rappels idempotents côté système** : l'émission d'un rappel (push/email pour `tasks.remind_at`, bilans hebdo) est déclenchée par cron ; chaque envoi écrit un `events` de type `reminder_sent` avec clé naturelle `(task_id, remind_at)` — contrainte d'unicité → un rappel n'est **jamais envoyé deux fois** même si le cron rejoue.

### 1.5 Schémas zod partagés (`lib/schemas.ts`)

```ts
import { z } from "zod";

export const uuid = z.string().uuid();
export const isoDate = z.string().datetime({ offset: true });

export const projectStatus = z.enum(["active","secondary","waiting","idea","archived"]);
export const taskStatus    = z.enum(["todo","in_progress","done","postponed","blocked"]);
export const taskPriority  = z.enum(["essential","secondary","normal"]);
export const memoryLayer   = z.enum(["stable","evolutive","learning"]);
export const memoryStatus  = z.enum(["proposed","active","archived"]);
export const goalKind      = z.enum(["result","progression","alignment"]);
export const domain        = z.enum(["spirituality","family","health","learning","work","contribution","relations"]).nullable();
```

---

## 2. Conversation

### 2.1 `POST /api/conversation` — tour de conversation (streaming SSE)

Cœur du produit : chat + décharge mentale (même endpoint, la décharge est déclenchée par tool use).

**Requête**

```ts
const ConversationRequest = z.object({
  conversationId: uuid.optional(),        // absent → nouvelle conversation
  message: z.string().min(1).max(8000),
  kind: z.enum(["chat","decharge","review"]).default("chat"),
  clientContext: z.object({               // enrichit les règles de rappel mémoire
    screen: z.enum(["dashboard","project","conversation","memory"]).optional(),
    projectId: uuid.optional(),
    localTime: isoDate.optional(),
  }).optional(),
});
```

**Réponse** : `Content-Type: text/event-stream` (protocole data-stream du Vercel AI SDK). Événements :

| `event` | `data` | Rôle |
|---|---|---|
| `meta` | `{ conversationId, messageId }` | Premier événement — ids créés (le client peut reprendre en cas de coupure) |
| `text` | `{ delta: string }` | Tokens de la réponse (Sonnet) |
| `tool_call` | `{ name, input }` | Appel d'outil visible (ex. `structurer_decharge` en cours) |
| `tool_result` | `{ name, output }` | Résultat — pour `structurer_decharge` : la proposition structurée (§5) à afficher en cartes validables |
| `memory_proposal` | `{ memory: { id, layer, kind, content } }` | Mémoire proposée (statut `proposed`) — UI : mention discrète annulable |
| `error` | `{ code, message }` | Erreur en cours de stream (`AI_UNAVAILABLE`…) |
| `done` | `{ usage: { inputTokens, outputTokens } }` | Fin de tour |

Erreurs avant stream : `400`, `401`, `429 AI_QUOTA_EXCEEDED`.
Côté serveur : persistance `messages` (user + assistant + tool), rappel mémoire (MEMORY_SPEC §4.5), event `conversation_turn`.

### 2.2 `GET /api/conversation?limit=20&cursor=<uuid>` — liste

`data: { items: Array<{ id, title, kind, updatedAt }>, nextCursor: string | null }` — triée par `updated_at desc`, pagination par curseur.

### 2.3 `GET /api/conversation/:id` — historique complet

`data: { id, title, kind, messages: Array<{ id, role, content, toolCalls, createdAt }> }`. `404 NOT_FOUND` si inconnue.

### 2.4 `DELETE /api/conversation/:id`

Soft delete (`deleted_at`). Les mémoires issues de la conversation **survivent** (elles appartiennent à l'utilisateur, l'écran Mémoire garde la traçabilité). `data: { deleted: true }`.

---

## 3. Projets

### 3.1 `POST /api/projects`

```ts
const ProjectCreate = z.object({
  title: z.string().min(1).max(200),
  domain,
  vision: z.string().max(2000).optional(),
  objective: z.string().max(2000).optional(),
  status: projectStatus.default("idea"),
  dueAt: isoDate.optional(),
  nextAction: z.object({                 // création atomique de la 1ʳᵉ action datée (§3 : entonnoir)
    title: z.string().min(1).max(200),
    dueAt: isoDate.optional(),
    estimatedMinutes: z.number().int().positive().optional(),
  }).optional(),
});
```

`201` → `data: Project` (avec `nextActionTaskId` si `nextAction` fourni). Erreurs : `409 ACTIVE_PROJECTS_LIMIT` si `status: "active"` et 3 actifs déjà — le message UX propose de passer un projet en `secondary` (jamais un refus sec).

### 3.2 `GET /api/projects?status=active,secondary`

`data: { items: Project[] }` avec agrégats : `{ ...project, goals: Goal[], taskCounts: { todo, inProgress, done, blocked }, nextAction: Task | null }`.

### 3.3 `PATCH /api/projects/:id`

`ProjectCreate.partial()` + `capitalization: z.string().max(4000).optional()` (bilan de fin — passer en `archived` sans capitalisation déclenche une invitation UX, pas un blocage). `409 ACTIVE_PROJECTS_LIMIT` applicable. `data: Project`.

### 3.4 `DELETE /api/projects/:id`

Soft delete ; les tâches liées passent `project_id = null` conservées (choix anti-perte), sauf `?cascade=true` qui les soft-delete aussi. `data: { deleted: true, orphanedTasks: number }`.

---

## 4. Tâches (actions)

### 4.1 `POST /api/tasks`

```ts
const TaskCreate = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  projectId: uuid.optional(),
  goalId: uuid.optional(),
  domain,
  priority: taskPriority.default("normal"),
  estimatedMinutes: z.number().int().positive().optional(),
  scheduledAt: isoDate.optional(),
  dueAt: isoDate.optional(),
  remindAt: isoDate.optional(),
  context: z.string().max(500).optional(),
  people: z.array(z.string().max(100)).default([]),
});
```

`201` → `data: Task`. `409 ESSENTIAL_PRIORITY_TAKEN` si une tâche `essential` existe déjà sur le jour de `scheduledAt`/`dueAt` (fuseau du profil) — arbitrage §14 : 1 essentielle + 2 secondaires max.

### 4.2 `PATCH /api/tasks/:id`

`TaskCreate.partial()` + :

```ts
{
  status: taskStatus.optional(),
  learning: z.string().max(2000).optional(),      // feedback post-action (module 9)
  blockedReason: z.string().max(500).optional(),  // requis en UX si status → "blocked"
}
```

Effets serveur : `status → done` ⇒ `completed_at = now()`, event `task_completed` (+ `learning_captured` si champ rempli) ; `status → blocked` ⇒ event `task_blocked` (alimente la détection de blocage §7). `data: Task`.

### 4.3 `GET /api/tasks?status=todo,in_progress&projectId=&from=&to=`

`data: { items: Task[] }` triées par `priority` puis `due_at`.

### 4.4 `DELETE /api/tasks/:id`

Soft delete. `data: { deleted: true }`.

---

## 5. Décharge mentale — tool use `structurer_decharge`

Fonction centrale du MVP : texte libre → structuration proposée. Deux temps, l'utilisateur **valide toujours** avant écriture (libre arbitre §12).

### 5.1 Contrat du tool (défini via Vercel AI SDK, exécuté par Sonnet)

**Description prompt** : « Structure une décharge mentale en éléments actionnables. Propose, n'invente rien : chaque élément doit être rattachable à un passage du texte. En phase d'exploration (idées non mûres), préfère `decisions`/`idees` à une sur-structuration en tâches. »

**Entrée** (`input_schema`) :

```ts
const StructurerDechargeInput = z.object({
  texte: z.string().min(1),                     // le texte libre de l'utilisateur
  projets_existants: z.array(z.object({         // injecté par le serveur pour le rattachement
    id: uuid, title: z.string(), status: projectStatus,
  })),
});
```

**Sortie** (`tool_result` streamé au client, rien n'est écrit en base à ce stade) :

```ts
const StructurerDechargeOutput = z.object({
  projets: z.array(z.object({
    ref: z.string(),                            // clé locale "p1", "p2"… pour liaison tâches→projet
    titre: z.string(),
    domaine: domain,
    vision: z.string().nullable(),
    objectif: z.string().nullable(),
    statut_propose: projectStatus,              // "idea" par défaut, "active" si urgence exprimée
    projet_existant_id: uuid.nullable(),        // ≠ null → rattacher au lieu de créer
    extrait_source: z.string(),                 // passage du texte justifiant la proposition
  })),
  taches: z.array(z.object({
    ref: z.string(),
    titre: z.string(),
    projet_ref: z.string().nullable(),          // ref locale OU null (tâche libre)
    projet_existant_id: uuid.nullable(),
    priorite: taskPriority,
    duree_estimee_minutes: z.number().int().positive().nullable(),
    echeance: isoDate.nullable(),
    extrait_source: z.string(),
  })),
  decisions: z.array(z.object({                 // à trancher — restent conversationnelles au MVP
    ref: z.string(),
    intitule: z.string(),
    options: z.array(z.string()).default([]),
    extrait_source: z.string(),
  })),
  rappels: z.array(z.object({                   // deviendront des tasks légères avec remind_at
    ref: z.string(),
    titre: z.string(),
    date: isoDate,
    extrait_source: z.string(),
  })),
  reste: z.string().nullable(),                 // ce qui n'est pas structurable — reformulé avec bienveillance
});
```

### 5.2 `POST /api/decharge/commit` — validation utilisateur (idempotent, `Idempotency-Key` **obligatoire**)

Le client renvoie **uniquement les éléments acceptés** (éventuellement édités) :

```ts
const DechargeCommit = z.object({
  conversationId: uuid,
  accepted: z.object({
    projets: z.array(/* éléments StructurerDechargeOutput.projets édités */),
    taches: z.array(/* idem */),
    rappels: z.array(/* idem */),
  }),
});
```

Écriture **transactionnelle** : projets créés d'abord (résolution des `ref` → uuid réels), puis tâches et rappels rattachés ; events `decharge_done` + `project_created`/`task_created`. Les décisions non tranchées restent dans la conversation (relance douce ultérieure).

`201` → `data: { projects: Project[], tasks: Task[], reminders: Task[] }`. Erreurs : `409 ACTIVE_PROJECTS_LIMIT` (transaction annulée, rien n'est créé partiellement), `409 IDEMPOTENCY_CONFLICT`.

---

## 6. Dashboard

### 6.1 `GET /api/dashboard?date=2026-07-24` — la page unique du quotidien

Lecture seule, agrégée côté serveur (une requête client). `date` optionnelle (défaut : aujourd'hui dans le fuseau du profil).

```ts
const DashboardResponse = z.object({
  intention: z.object({                    // question du jour adaptée au profil
    question: z.string(),
    answeredAt: isoDate.nullable(),
  }),
  priorities: z.object({                   // arbitrage §14 : 1 + 2
    essential: TaskSchema.nullable(),
    secondary: z.array(TaskSchema).max(2),
  }),
  path: z.array(z.object({                 // chemin consolidé domaines/projets
    projectId: uuid, title: z.string(), domain,
    status: projectStatus, progress: z.number().min(0).max(100),
    nextAction: TaskSchema.nullable(),
  })),
  indices: z.object({                      // §14 : Clarté · Action · Alignement (0–100)
    clarity: z.number(),                   // part des projets actifs avec objectif + prochaine action datée
    action: z.number(),                    // complétion des priorités sur 7 jours glissants
    alignment: z.number(),                 // part de l'activité sur projets liés aux 3 valeurs/goals "alignment"
  }),
  eveningReview: z.object({                // mini-bilan du soir (accompli/appris/ajuster + lâcher-prise)
    dueAt: isoDate, completedAt: isoDate.nullable(),
  }),
});
```

`data: DashboardResponse`. Les indices sont calculés à la volée (DOMAIN_MODEL §6.5) et mis en cache 5 min par utilisateur.

### 6.2 `POST /api/dashboard/checkin`

```ts
z.object({
  moment: z.enum(["morning","evening"]),
  intentionAnswer: z.string().max(1000).optional(),      // matin
  review: z.object({                                     // soir
    accomplished: z.string().max(2000).optional(),
    learned: z.string().max(2000).optional(),
    toAdjust: z.string().max(2000).optional(),
    lettingGo: z.string().max(2000).optional(),          // « est-ce que je porte uniquement ce qui dépend de moi ? »
  }).optional(),
});
```

Écrit les events `checkin_morning`/`checkin_evening` (idempotent par clé naturelle `(user_id, moment, date)` : un second POST le même jour **met à jour** au lieu de dupliquer). `data: { recorded: true }`.

---

## 7. Mémoire

### 7.1 `GET /api/memory?layer=learning&status=active,proposed`

Écran Mémoire (module 4 : consulter). `data: { items: MemoryEntry[] }` au format MEMORY_SPEC §5 (jamais d'`embedding`), triées par couche puis `updated_at desc`. Inclut les `proposed` pour validation explicite en attente.

### 7.2 `PATCH /api/memory/:id`

```ts
const MemoryPatch = z.object({
  content: z.string().min(1).max(1000).optional(),   // → ré-embedding serveur
  layer: memoryLayer.optional(),
  status: memoryStatus.optional(),                   // accepter ("active") / archiver
  expiresAt: isoDate.nullable().optional(),
});
```

`422 MEMORY_NOT_EDITABLE` si `user_editable = false`. Event `memory_updated`. `data: MemoryEntry`.

### 7.3 `DELETE /api/memory/:id`

Soft delete immédiat (exclue du rappel dès le tour suivant), purge définitive ≤ 30 j (MEMORY_SPEC §4.7). `data: { deleted: true }`.

### 7.4 `POST /api/memory` — saisie manuelle

```ts
z.object({ layer: memoryLayer, kind: z.string().max(50), content: z.string().min(1).max(1000) })
```

`source = 'user_manual'`, `status = 'active'` d'emblée (l'utilisateur est la source). `201` → `data: MemoryEntry`.

---

## 8. Profil (support des écrans, hors liste minimale du brief)

- `GET /api/profile` → `data: { profile, values: Value[] }`.
- `PATCH /api/profile` → champs de `profiles` éditables (`firstName`, `language`, `timezone`, `vision`, `mission`, `spiritualDimension`, `preferences`) — le DISC n'est **pas** exposé en écriture directe.
- `PUT /api/profile/values` → remplace l'ensemble `{ cardinal: [max 3], secondary: [...] }` (validation `max(3)` côté zod + index SQL).

---

## 9. Récapitulatif des routes

| Méthode & route | Rôle | Codes notables |
|---|---|---|
| `POST /api/conversation` | Tour de chat / décharge (SSE) | 429, 503 |
| `GET /api/conversation` · `GET /api/conversation/:id` · `DELETE /api/conversation/:id` | Historique | 404 |
| `POST /api/projects` · `GET /api/projects` · `PATCH /api/projects/:id` · `DELETE /api/projects/:id` | Projets | 409 `ACTIVE_PROJECTS_LIMIT` |
| `POST /api/tasks` · `GET /api/tasks` · `PATCH /api/tasks/:id` · `DELETE /api/tasks/:id` | Actions | 409 `ESSENTIAL_PRIORITY_TAKEN` |
| `POST /api/decharge/commit` | Validation de la décharge (idempotent) | 409 ×2 |
| `GET /api/dashboard` · `POST /api/dashboard/checkin` | Boucle quotidienne | — |
| `GET /api/memory` · `POST /api/memory` · `PATCH /api/memory/:id` · `DELETE /api/memory/:id` | Écran Mémoire | 422 |
| `GET /api/profile` · `PATCH /api/profile` · `PUT /api/profile/values` | Profil évolutif | — |

Transverse : toutes les mutations émettent leurs `events` (source du dashboard admin et des indices) ; tous les handlers valident via zod (`safeParse` → `400 VALIDATION_ERROR` avec `details`).
