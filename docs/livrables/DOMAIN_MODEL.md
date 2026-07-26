# AMANA — DOMAIN_MODEL.md

> Modèle de données du MVP. Aligné sur `01_AMANA_COMPILATION.md` (§3, §4, §13, arbitrages §14) et `02_STACK.md` (Supabase Postgres + RLS + pgvector).
> Cible : Supabase Postgres 15+, extensions `pgcrypto` (UUID) et `vector` (pgvector).

---

## 1. Vue d'ensemble

```
auth.users (Supabase Auth)
   │ 1:1
   ├── profiles            (identité, langue, vision, DISC, préférences)
   │ 1:N
   ├── values              (3 valeurs cardinales + secondaires évolutives)
   ├── conversations ──< messages
   ├── memories            (couches stable/évolutive/apprentissage + embedding vector(1024))
   ├── projects ──< goals ──< tasks     (tasks peut aussi être orpheline ou liée directement au projet)
   ├── insights            (générés par l'IA, restitution progressive)
   └── events              (journal append-only : alimente progression + dashboard admin)
```

Principes transverses (issus du stack et de la charte §12) :

- **`user_id` sur toutes les tables** applicatives → RLS stricte par utilisateur.
- **Soft delete** : `deleted_at timestamptz` (anti-erreur) ; l'effacement RGPD réel = `DELETE` cascade depuis `auth.users`.
- **Minimisation** : aucune colonne santé/diagnostic ; le DISC est une couche d'adaptation invisible stockée dans `profiles`, jamais exposée comme étiquette.
- **Horodatage** : `created_at` / `updated_at` partout (trigger `set_updated_at`).
- **Multilingue dès l'architecture** : contenus utilisateur libres ; libellés systèmes = codes (enums), traduits côté front (next-intl).

---

## 2. Types énumérés

```sql
-- Statuts projets (§14 : 5 statuts canoniques)
create type project_status as enum ('active', 'secondary', 'waiting', 'idea', 'archived');
-- active = actif (max ~3) · secondary = secondaire (à maintenir) · waiting = en attente
-- idea = futur / boîte à idées · archived = abandonné-capitalisé

-- États d'une action (§3)
create type task_status as enum ('todo', 'in_progress', 'done', 'postponed', 'blocked');

-- Couches mémoire long terme (§4)
create type memory_layer as enum ('stable', 'evolutive', 'learning');

-- Cycle de vie d'une entrée mémoire (cf. MEMORY_SPEC.md)
create type memory_status as enum ('proposed', 'active', 'archived');

-- Origine d'une mémoire (§4 : acquisition progressive)
create type memory_source as enum ('onboarding', 'conversation', 'usage', 'feedback', 'user_manual');

-- Rôle d'un message de conversation
create type message_role as enum ('user', 'assistant', 'tool');

-- Priorité d'une tâche (arbitrage §14 : 1 essentielle + 2 secondaires)
create type task_priority as enum ('essential', 'secondary', 'normal');

-- Catégorie de KPI / objectif (§3 : signature AMANA)
create type goal_kind as enum ('result', 'progression', 'alignment');

-- Cycle de vie d'un insight (restitution progressive §4)
create type insight_status as enum ('new', 'shown', 'acknowledged', 'dismissed');
```

---

## 3. Entités

### 3.1 `users` (gérée par Supabase Auth)

Table `auth.users` fournie par Supabase (email, magic link, Google). **On n'y ajoute rien** ; tout attribut applicatif vit dans `profiles`. Cardinalité : `auth.users 1—1 profiles`, `1—N` vers toutes les autres tables.

### 3.2 `profiles` — profil évolutif (module 3 du MVP)

| Champ | Type Postgres | Contraintes | Commentaire |
|---|---|---|---|
| `user_id` | `uuid` | PK, FK → `auth.users(id)` on delete cascade | 1:1 avec le compte |
| `first_name` | `text` | not null | Friction minimale : seul champ obligatoire |
| `language` | `text` | not null default `'fr'` | Code BCP-47 |
| `timezone` | `text` | not null default `'Europe/Paris'` | Rappels & boucle quotidienne |
| `vision` | `text` | | Vision de vie (hiérarchie §3) |
| `mission` | `text` | | Synthèse narrative d'onboarding, ajustable |
| `disc` | `jsonb` | | `{natural, under_stress, high_stress}` — couche invisible, jamais affichée |
| `transformation_mode` | `text` | | « Comment cette personne progresse le mieux » |
| `spiritual_dimension` | `boolean` | not null default `false` | Dimension spirituelle activable, jamais imposée |
| `preferences` | `jsonb` | not null default `'{}'` | Style d'accompagnement, notifications, etc. |
| `onboarding_completed_at` | `timestamptz` | | null = onboarding en cours |
| `created_at` / `updated_at` | `timestamptz` | not null default `now()` | |

### 3.3 `values` — valeurs cardinales et secondaires

| Champ | Type | Contraintes | Commentaire |
|---|---|---|---|
| `id` | `uuid` | PK default `gen_random_uuid()` | |
| `user_id` | `uuid` | FK → `auth.users` cascade, not null | |
| `label` | `text` | not null | Libellé libre choisi par l'utilisateur |
| `is_cardinal` | `boolean` | not null default `false` | **Max 3 cardinales** (index partiel + contrôle applicatif) |
| `rank` | `smallint` | | Ordre d'affichage |
| `note` | `text` | | Ce que cette valeur signifie pour la personne |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | | Secondaires « évolutives » → soft delete |

Cardinalité : `profiles 1—N values`. Les objectifs d'alignement (`goals.kind = 'alignment'`) s'y réfèrent sémantiquement (pas de FK dure au MVP).

### 3.4 `conversations` et `messages`

`conversations` :

| Champ | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK cascade, not null |
| `title` | `text` | Généré par Haiku après le 1er échange |
| `kind` | `text` | not null default `'chat'` — `'chat'` \| `'decharge'` \| `'onboarding'` \| `'review'` |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | |

`messages` (`conversations 1—N messages`) :

| Champ | Type | Contraintes | Commentaire |
|---|---|---|---|
| `id` | `uuid` | PK |
| `conversation_id` | `uuid` | FK → `conversations` cascade, not null | |
| `user_id` | `uuid` | FK cascade, not null | Dénormalisé pour RLS directe |
| `role` | `message_role` | not null | |
| `content` | `text` | not null | |
| `tool_calls` | `jsonb` | | Appels tool use (ex. `structurer_decharge`) et leurs résultats |
| `token_count` | `integer` | | Suivi de coût (plafond utilisateur gratuit) |
| `created_at` | `timestamptz` | not null default `now()` | Immutable (pas d'`updated_at`) |

### 3.5 `memories` — la fonction fondatrice (§4)

| Champ | Type | Contraintes | Commentaire |
|---|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK cascade, not null | |
| `layer` | `memory_layer` | not null | `stable` (identité/valeurs/vision) · `evolutive` (projets/priorités/contexte) · `learning` (forces/blocages/méthodes) |
| `kind` | `text` | not null | Sous-type libre contrôlé : `identity`, `value`, `vision`, `project_context`, `priority`, `life_context`, `strength`, `blocker`, `method`, `preference`… |
| `content` | `text` | not null | La mémoire elle-même, une phrase autonome |
| `status` | `memory_status` | not null default `'proposed'` | `proposed` → `active` → `archived` |
| `source` | `memory_source` | not null | |
| `source_ref` | `uuid` | | `conversation_id` ou `message_id` d'origine (traçabilité, écran Mémoire) |
| `utility` | `smallint` | check between 1 and 5 | Filtre de pertinence §4 |
| `durability` | `smallint` | check between 1 and 5 | |
| `importance` | `smallint` | check between 1 and 5 | |
| `user_editable` | `boolean` | not null default `true` | Contrôle utilisateur obligatoire |
| `embedding` | `vector(1024)` | | Rappel sémantique uniquement (pas la source de vérité) |
| `expires_at` | `timestamptz` | | Optionnel, pour les mémoires à durabilité limitée |
| `last_recalled_at` | `timestamptz` | | Stat d'usage → consolidation/archivage |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | | Suppression par l'utilisateur = soft delete puis purge |

### 3.6 `projects` — projets simplifiés MVP (§13)

| Champ | Type | Contraintes | Commentaire |
|---|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK cascade, not null | |
| `title` | `text` | not null | |
| `domain` | `text` | | Domaine de vie (code : `family`, `health`, `work`, `spirituality`, `learning`, `contribution`, `relations`) |
| `vision` | `text` | | Pourquoi ce projet |
| `objective` | `text` | | Objectif principal (MVP : vision, objectif, prochaine action, échéance) |
| `status` | `project_status` | not null default `'idea'` | **Max ~3 `active`** : contrôle applicatif + garde-fou trigger (voir DDL) |
| `next_action_task_id` | `uuid` | FK → `tasks(id)` on delete set null | La « prochaine action » mise en avant |
| `due_at` | `timestamptz` | | Échéance du projet |
| `capitalization` | `text` | | Bilan de fin — « Capitalisation » (alias BDL, §14) |
| `resources_needed` | `jsonb` | default `'[]'` | Compétences, partenaires, financement, outils (§3) |
| `risks` | `jsonb` | default `'[]'` | Risques/obstacles anticipés |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | | |

Cardinalités : `projects 1—N goals`, `projects 1—N tasks` (tâche rattachable au projet sans passer par un objectif), `projects 0—1 next_action`.

### 3.7 `goals` — objectifs (KPI Résultat / Progression / Alignement)

| Champ | Type | Contraintes | Commentaire |
|---|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK cascade, not null | |
| `project_id` | `uuid` | FK → `projects` cascade, not null | |
| `title` | `text` | not null | Formulation SMART encouragée côté IA |
| `kind` | `goal_kind` | not null default `'result'` | `result` (quantitatif) · `progression` (compétences/habitudes) · `alignment` (valeurs/vision) |
| `target` | `text` | | Cible mesurable (texte libre au MVP) |
| `progress` | `smallint` | not null default `0`, check between 0 and 100 | |
| `due_at` | `timestamptz` | | |
| `achieved_at` | `timestamptz` | | |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | | |

### 3.8 `tasks` — actions (§3)

| Champ | Type | Contraintes | Commentaire |
|---|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK cascade, not null | |
| `project_id` | `uuid` | FK → `projects` on delete set null | Nullable : capture libre hors projet |
| `goal_id` | `uuid` | FK → `goals` on delete set null | |
| `title` | `text` | not null | |
| `description` | `text` | | |
| `domain` | `text` | | Hérite du projet si null |
| `status` | `task_status` | not null default `'todo'` | |
| `priority` | `task_priority` | not null default `'normal'` | `essential` : **1 max par jour** (contrôle applicatif) |
| `estimated_minutes` | `integer` | check > 0 | Durée estimée |
| `scheduled_at` | `timestamptz` | | Date/heure prévue |
| `due_at` | `timestamptz` | | Échéance |
| `remind_at` | `timestamptz` | | Rappel intelligent (les « rappels » de la décharge = tâches légères avec `remind_at`) |
| `context` | `text` | | Contexte d'exécution |
| `people` | `jsonb` | default `'[]'` | Personnes associées |
| `learning` | `text` | | Champ apprentissage (feedback post-action, module 9) |
| `blocked_reason` | `text` | | Analyse causale des blocages (§7) |
| `completed_at` | `timestamptz` | | |
| `created_at` / `updated_at` / `deleted_at` | `timestamptz` | | |

### 3.9 `insights` — restitutions progressives

| Champ | Type | Contraintes | Commentaire |
|---|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK cascade, not null | |
| `kind` | `text` | not null | `pattern`, `progress`, `alignment`, `suggestion`, `celebration` |
| `content` | `text` | not null | Ex. « J'ai remarqué que tu avances mieux quand… » |
| `evidence` | `jsonb` | default `'[]'` | ids de `memories`/`events` justifiant l'insight (transparence) |
| `status` | `insight_status` | not null default `'new'` | Montré progressivement, jamais imposé |
| `shown_at` | `timestamptz` | | |
| `created_at` / `deleted_at` | `timestamptz` | | |

### 3.10 `events` — journal append-only

| Champ | Type | Contraintes | Commentaire |
|---|---|---|---|
| `id` | `bigint` | PK generated always as identity | Volume élevé → identity plutôt qu'uuid |
| `user_id` | `uuid` | FK cascade, not null | Anonymisé côté analytics (PostHog) |
| `type` | `text` | not null | `project_created`, `task_completed`, `task_blocked`, `learning_captured`, `decharge_done`, `memory_created`, `checkin_morning`, `checkin_evening`, `review_weekly`… |
| `payload` | `jsonb` | not null default `'{}'` | Minimisé : ids + métadonnées, pas de contenu sensible |
| `occurred_at` | `timestamptz` | not null default `now()` | |

Append-only : pas d'`update`/`delete` par l'utilisateur (RLS : insert + select seulement) ; purge RGPD par cascade.

---

## 4. Index utiles

```sql
-- Accès par utilisateur (systématique)
create index on values (user_id) where deleted_at is null;
create index on conversations (user_id, updated_at desc) where deleted_at is null;
create index on messages (conversation_id, created_at);
create index on projects (user_id, status) where deleted_at is null;
create index on goals (project_id) where deleted_at is null;
create index on tasks (user_id, status, due_at) where deleted_at is null;
create index on tasks (user_id, scheduled_at) where deleted_at is null and status in ('todo','in_progress');
create index on tasks (user_id, remind_at) where remind_at is not null and status <> 'done';
create index on insights (user_id, status);
create index on events (user_id, occurred_at desc);
create index on events (type, occurred_at desc);          -- dashboard admin
create index on memories (user_id, layer, status) where deleted_at is null;

-- Rappel sémantique (pgvector, cosinus). HNSW = bon défaut Supabase.
create index memories_embedding_idx on memories
  using hnsw (embedding vector_cosine_ops);

-- Garde-fou : 3 valeurs cardinales max (complète le contrôle applicatif)
create unique index values_cardinal_rank_uidx
  on values (user_id, rank) where is_cardinal and deleted_at is null;
```

---

## 5. DDL SQL complet (Supabase)

```sql
-- ============================================================
-- AMANA MVP — schéma initial (à exécuter dans Supabase SQL Editor
-- ou via migrations supabase/migrations/)
-- ============================================================
create extension if not exists pgcrypto;
create extension if not exists vector;

-- ---------- Enums ----------
create type project_status as enum ('active','secondary','waiting','idea','archived');
create type task_status    as enum ('todo','in_progress','done','postponed','blocked');
create type memory_layer   as enum ('stable','evolutive','learning');
create type memory_status  as enum ('proposed','active','archived');
create type memory_source  as enum ('onboarding','conversation','usage','feedback','user_manual');
create type message_role   as enum ('user','assistant','tool');
create type task_priority  as enum ('essential','secondary','normal');
create type goal_kind      as enum ('result','progression','alignment');
create type insight_status as enum ('new','shown','acknowledged','dismissed');

-- ---------- Trigger updated_at ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- profiles ----------
create table public.profiles (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  first_name              text not null,
  language                text not null default 'fr',
  timezone                text not null default 'Europe/Paris',
  vision                  text,
  mission                 text,
  disc                    jsonb,
  transformation_mode     text,
  spiritual_dimension     boolean not null default false,
  preferences             jsonb not null default '{}',
  onboarding_completed_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- values ----------
create table public.values (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  is_cardinal boolean not null default false,
  rank        smallint,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create trigger trg_values_updated before update on public.values
  for each row execute function public.set_updated_at();

-- ---------- conversations / messages ----------
create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text,
  kind       text not null default 'chat'
             check (kind in ('chat','decharge','onboarding','review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger trg_conversations_updated before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            message_role not null,
  content         text not null,
  tool_calls      jsonb,
  token_count     integer,
  created_at      timestamptz not null default now()
);

-- ---------- memories ----------
create table public.memories (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  layer            memory_layer not null,
  kind             text not null,
  content          text not null,
  status           memory_status not null default 'proposed',
  source           memory_source not null,
  source_ref       uuid,
  utility          smallint check (utility between 1 and 5),
  durability       smallint check (durability between 1 and 5),
  importance       smallint check (importance between 1 and 5),
  user_editable    boolean not null default true,
  embedding        vector(1024),
  expires_at       timestamptz,
  last_recalled_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create trigger trg_memories_updated before update on public.memories
  for each row execute function public.set_updated_at();

-- ---------- projects ----------
create table public.projects (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  title               text not null,
  domain              text,
  vision              text,
  objective           text,
  status              project_status not null default 'idea',
  next_action_task_id uuid,           -- FK ajoutée après création de tasks
  due_at              timestamptz,
  capitalization      text,
  resources_needed    jsonb not null default '[]',
  risks               jsonb not null default '[]',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

-- Garde-fou « max 3 projets actifs » (le refus doux/UX reste applicatif)
create or replace function public.check_active_projects_limit()
returns trigger language plpgsql as $$
begin
  if new.status = 'active' and (
    select count(*) from public.projects
    where user_id = new.user_id and status = 'active'
      and deleted_at is null and id <> new.id
  ) >= 3 then
    raise exception 'ACTIVE_PROJECTS_LIMIT' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger trg_projects_active_limit
  before insert or update of status on public.projects
  for each row execute function public.check_active_projects_limit();

-- ---------- goals ----------
create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  kind        goal_kind not null default 'result',
  target      text,
  progress    smallint not null default 0 check (progress between 0 and 100),
  due_at      timestamptz,
  achieved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create trigger trg_goals_updated before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------- tasks ----------
create table public.tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  project_id        uuid references public.projects(id) on delete set null,
  goal_id           uuid references public.goals(id) on delete set null,
  title             text not null,
  description       text,
  domain            text,
  status            task_status not null default 'todo',
  priority          task_priority not null default 'normal',
  estimated_minutes integer check (estimated_minutes > 0),
  scheduled_at      timestamptz,
  due_at            timestamptz,
  remind_at         timestamptz,
  context           text,
  people            jsonb not null default '[]',
  learning          text,
  blocked_reason    text,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.projects
  add constraint projects_next_action_fk
  foreign key (next_action_task_id) references public.tasks(id) on delete set null;

-- ---------- insights ----------
create table public.insights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,
  content    text not null,
  evidence   jsonb not null default '[]',
  status     insight_status not null default 'new',
  shown_at   timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- events ----------
create table public.events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  payload     jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

-- ---------- Index ----------
create index on public.values (user_id) where deleted_at is null;
create unique index values_cardinal_rank_uidx
  on public.values (user_id, rank) where is_cardinal and deleted_at is null;
create index on public.conversations (user_id, updated_at desc) where deleted_at is null;
create index on public.messages (conversation_id, created_at);
create index on public.memories (user_id, layer, status) where deleted_at is null;
create index memories_embedding_idx on public.memories using hnsw (embedding vector_cosine_ops);
create index on public.projects (user_id, status) where deleted_at is null;
create index on public.goals (project_id) where deleted_at is null;
create index on public.tasks (user_id, status, due_at) where deleted_at is null;
create index on public.tasks (user_id, scheduled_at)
  where deleted_at is null and status in ('todo','in_progress');
create index on public.tasks (user_id, remind_at)
  where remind_at is not null and status <> 'done';
create index on public.insights (user_id, status);
create index on public.events (user_id, occurred_at desc);
create index on public.events (type, occurred_at desc);

-- ============================================================
-- Row Level Security : isolation stricte par user_id
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.values        enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;
alter table public.memories      enable row level security;
alter table public.projects      enable row level security;
alter table public.goals         enable row level security;
alter table public.tasks         enable row level security;
alter table public.insights      enable row level security;
alter table public.events        enable row level security;

-- profiles (clé = user_id)
create policy "profiles_select_own" on public.profiles
  for select using (user_id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (user_id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Modèle générique CRUD complet pour les tables possédées
create policy "values_all_own" on public.values
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "conversations_all_own" on public.conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "messages_all_own" on public.messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "memories_all_own" on public.memories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "projects_all_own" on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals_all_own" on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks_all_own" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "insights_all_own" on public.insights
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- events : append-only pour l'utilisateur (pas d'update/delete)
create policy "events_select_own" on public.events
  for select using (user_id = auth.uid());
create policy "events_insert_own" on public.events
  for insert with check (user_id = auth.uid());
-- (aucune policy update/delete → refusés ; purge RGPD par cascade auth.users)
```

> **Note dashboard admin (module 10)** : les requêtes admin passent par la clé `service_role` côté serveur (Route Handlers protégés par un rôle admin applicatif), jamais par le client — la RLS ci-dessus ne s'applique qu'aux sessions utilisateur. Les exports vers PostHog sont anonymisés (`user_id` pseudonymisé).

---

## 6. Décisions de modélisation (traçabilité)

1. **`vector(1024)` sur `memories`** : dimension imposée par le brief ; compatible avec les modèles d'embedding multilingues courants à 1024 dimensions. La dimension est figée par le type — changer de modèle d'embedding = migration + ré-embedding.
2. **Les « rappels » de la décharge mentale** ne sont pas une table dédiée : ce sont des `tasks` légères avec `remind_at` (et souvent sans projet). Une table `reminders` séparée pourra apparaître en V1 si les récurrences complexes l'exigent.
3. **Hiérarchie Vision → Missions → Domaines** (§14) : au MVP, Vision/Mission vivent dans `profiles`, les Domaines sont un code sur `projects`/`tasks`. Les niveaux supérieurs deviendront des tables en V1 (graphe de connaissance cible §4).
4. **Compétences suivies comme objets** (§3) : couvertes au MVP par `goals.kind = 'progression'` ; table `skills` différée en V1.
5. **Indices Clarté/Action/Alignement** (§14) : calculés à la volée depuis `events` + `tasks` + `goals` (pas de table de scores au MVP) — voir `GET /api/dashboard` dans API_SPEC.md.
