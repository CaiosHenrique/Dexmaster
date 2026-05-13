@AGENTS.md

# DexMaster

Pokémon living dex tracker + competitive meta platform built with Next.js 15, TypeScript, TailwindCSS, shadcn/ui, and Supabase.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Type check:** `npx tsc --noEmit`
- **Lint:** `npm run lint`

## Stack

- **Framework:** Next.js 16 (App Router, `src/` layout)
- **Language:** TypeScript strict mode
- **Styling:** TailwindCSS v4 + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + realtime)
- **APIs:** PokéAPI (Pokémon data), Smogon (competitive data)

## Project structure

```
src/
  app/           # App Router pages and layouts
  components/    # Shared UI components (shadcn + custom)
  lib/           # Supabase client, PokéAPI helpers, utilities
  types/         # Shared TypeScript types
```

## Key notes

- Dark mode only — glassmorphism design language
- All Pokémon base data fetched from PokéAPI and cached in Supabase
- User's living dex capture state stored per-user in `captures` table
- Supabase Row Level Security (RLS) must be enabled on all user tables
- Never expose service_role key to the client; use anon key + RLS only
