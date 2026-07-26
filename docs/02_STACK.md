# AMANA — Stack technique proposée

> Critères issus du blueprint : PWA mobile-first installable, multilingue dès l'architecture, mémoire IA structurée, dashboard admin dès le MVP, RGPD/minimisation des données, et une équipe réduite qui doit livrer vite sans dette d'infrastructure.

## Décision en une ligne

**Next.js (PWA) + Supabase (Postgres/Auth/pgvector) + Claude API via Vercel AI SDK, hébergé sur Vercel + Supabase en région UE.**

## Détail par couche

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework front | **Next.js 15 (App Router) + TypeScript** | PWA de référence, rendu serveur pour la rapidité mobile, un seul langage front/back, écosystème massif |
| PWA | **Serwist** (service worker) + manifest | Installable iOS/Android, offline partiel (dashboard, actions), notifications push web |
| UI | **Tailwind CSS v4 + shadcn/ui** thémé avec les tokens AMANA | Vitesse de dev, accessibilité de base, design system appliqué via variables CSS (voir `design/amana-design-system.html`) |
| i18n | **next-intl** | Multilingue exigé dès l'architecture ; FR au lancement, structure de clés dès le jour 1 |
| Backend | **Next.js Server Actions / Route Handlers** | Pas de second serveur à opérer au MVP ; la logique IA vit côté serveur (clés API jamais exposées) |
| Base de données | **Supabase Postgres + Row Level Security** | Relationnel (User/Project/Task/Memory/Event), RLS = isolation stricte des données par utilisateur, région UE (RGPD) |
| Auth | **Supabase Auth** (email magic link + Google) | Friction minimale exigée par le module 1 ; sessions gérées |
| Mémoire IA | **Tables structurées + pgvector** (embeddings) | La mémoire AMANA est *structurée* (couches stable/évolutive/apprentissage §4 de la compilation) — le vectoriel ne sert qu'au rappel sémantique, pas de vector DB séparée à payer/opérer |
| Moteur IA | **Claude API** — `claude-sonnet-5` (conversation, décharge mentale) + `claude-haiku-4-5` (classification, extraction, titres) | Qualité conversationnelle en français, *tool use* pour structurer la décharge mentale en projets/tâches/décisions/rappels, coûts maîtrisés en routant les tâches simples vers Haiku |
| Orchestration IA | **Vercel AI SDK** | Streaming des réponses, tool calling typé, indépendance vis-à-vis du fournisseur si besoin futur |
| Événements & analytics | **PostHog Cloud EU** | Funnels d'activation, cohortes, rétention exigés par le dashboard admin ; auto-hébergeable plus tard |
| Dashboard admin | Page interne Next.js (données Supabase) + PostHog embarqué | Le module 10 exige des filtres métier (DISC, domaine…) que PostHog seul ne connaît pas |
| Emails | **Resend** + React Email | Magic links, bilans hebdo |
| Paiements (post-MVP) | **Stripe** | Freemium → Premium |
| Hébergement | **Vercel** (front+API) + **Supabase** (données) — région UE | Zéro ops, déploiement continu, coût quasi nul au MVP |
| Qualité | ESLint + Prettier + Vitest + Playwright (parcours critiques) | Les 10 parcours du brief deviennent des tests E2E |

## Schéma de données initial (aligné sur DOMAIN_MODEL du brief)

```
users ─── profiles (valeurs, vision, DISC, préférences, langue)
   │
   ├── conversations ── messages
   ├── memories (layer: stable|evolutive|learning ; source ; user_editable ; embedding vector)
   ├── projects ── goals ── tasks (status, due_at, priority, learning)
   ├── events (type, payload, at)  ← alimente progression + admin
   └── insights (générés par l'IA, montrés progressivement)
```

Règles transverses : RLS sur toutes les tables ; suppression en cascade à la demande de l'utilisateur (droit à l'effacement) ; champ `deleted_at` pour l'anti-erreur ; anonymisation des events côté analytics.

## Estimation de coûts mensuels au MVP (ordre de grandeur)

- Vercel Hobby/Pro : 0–20 €
- Supabase Free/Pro : 0–25 €
- Claude API : variable — ~0,01 à 0,05 € par session de décharge mentale avec le routage Sonnet/Haiku ; prévoir un plafond par utilisateur gratuit
- PostHog : gratuit au volume MVP
- **Total : < 100 €/mois** jusqu'à plusieurs centaines d'utilisateurs actifs.

## Ce que ce choix évite volontairement

- Pas de microservices, pas de Kubernetes, pas de backend séparé (Nest/Fastify) : rien ne le justifie au MVP.
- Pas de vector DB dédiée (Pinecone…) : pgvector suffit largement.
- Pas de framework mobile natif : la PWA est le choix explicite du blueprint ; le natif reste une option V2+ si les notifications iOS deviennent limitantes.
- Pas de multi-agents au MVP : un agent conversationnel + mémoire structurée + tool use couvre le périmètre (§13 de la compilation).
