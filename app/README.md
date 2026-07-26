# AMANA — web app

Partenaire de progression adaptative : **Décharger → Clarifier → Avancer.**
PWA Next.js + Supabase + Claude API. Bi-idniLlah.

## Documents de référence

- [`../docs/01_AMANA_COMPILATION.md`](../docs/01_AMANA_COMPILATION.md) — référence produit unique (arbitrages en §14)
- [`../docs/02_STACK.md`](../docs/02_STACK.md) — choix techniques
- [`../docs/03_ROADMAP_MVP.md`](../docs/03_ROADMAP_MVP.md) — sprints
- [`../docs/livrables/`](../docs/livrables/) — les 10 specs MVP (scope, flows, écrans, données, mémoire, IA, dashboard, API, backlog, sprints)
- [`../design/amana-design-system.html`](../design/amana-design-system.html) — design system V3 (tokens repris dans `src/app/globals.css`)

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir les clés (Supabase, Anthropic…)
npm run dev
```

## Règles produit non négociables (rappel)

- Onboarding ≤ 10 min, jamais présenté comme un « test »
- 1 priorité essentielle + 2 secondaires max par jour ; ~3 projets actifs max
- Toute conversation se termine par une action concrète datée
- Ton jamais culpabilisant ; aucun vocabulaire anthropomorphique (« un outil n'a pas d'âme »)
- L'utilisateur contrôle totalement sa mémoire (consulter / modifier / supprimer)
- Un seul accent or par écran
