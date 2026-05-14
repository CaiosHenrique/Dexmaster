# Architecture — dex.gg

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, `src/` layout) |
| Language | TypeScript (strict mode) |
| Styling | TailwindCSS v4 + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Row Level Security) |
| Pokémon data | PokéAPI → seeded into Supabase via `/api/seed` |
| Competitive data | Smogon (planned; currently mock in UI) |

## Directory Structure

```
src/
  app/
    (auth)/               # Unauthenticated routes (login, register)
    (dashboard)/          # All authenticated routes — wrapped by layout.tsx
      layout.tsx          # Auth guard + Sidebar rendering
      dashboard/          # Trainer Hub
      pokedex/            # Pokédex grid
      collection/         # Trophy Room
      team/               # Team Builder
      competitive/        # Competitive meta
      achievements/       # Achievement milestones
      pokemon/[name]/     # Species detail page
    actions/
      ownership.ts        # Server Action: bulkSetOwnership
    api/seed/             # Seeding pipeline endpoints
  components/
    layout/
      Sidebar.tsx         # Nav + user footer
      TopBar.tsx          # Page header, search, collection mode toggle
    pokemon/
      PokemonCard.tsx     # Grid card with owned state + collection mode
      CollectionBar.tsx   # Floating bulk-action bar
      DexSelector.tsx     # Horizontal dex tabs
      TypeFilter.tsx      # Status/type filter bar
    ui-custom/
      TypeBadge.tsx       # 18-type colored badges
      DexProgress.tsx     # Progress bar
      SkeletonCard.tsx    # Loading skeleton
  lib/
    supabase/client.ts    # Browser client (anon key + RLS)
    supabase/server.ts    # Server client (for Server Actions)
    dex-constants.ts      # 15 dex definitions
    utils.ts              # cn() helper
  types/database.ts       # Supabase type definitions
```

## Route Architecture

`(dashboard)/layout.tsx` wraps every authenticated page. It:
1. Validates the Supabase session — unauthenticated users redirect to `/login`
2. Renders `<Sidebar>` + the page content side-by-side

## Data Flow

### Pokédex Page

```
Page load
  loadDex(activeDex)
    → supabase: pokedexes (get id by name)
    → supabase: dex_entries (all species for dex, ordered by dex_number)
    → supabase: ownerships (owned form_ids for user)
  → State: entries[], ownedFormIds Set<number>

User clicks card
  handleToggle(formId, nowOwned)
    → Optimistic: setOwnedFormIds immediately
    → startTransition: bulkSetOwnership([formId], nowOwned)

Bulk apply (collection mode)
  applyCollection(markOwned)
    → Optimistic: update ownedFormIds
    → bulkSetOwnership(queuedIds, markOwned)
```

### Server Action: `bulkSetOwnership`

Located at `src/app/actions/ownership.ts`.

- `owned = true` → upsert rows into `ownerships` with `is_shiny=false, is_alpha=false, is_gigantamax=false`
- `owned = false` → delete matching rows
- User identity comes from the server-side session (never trusted from the client)

## Key Decisions

### formId vs dexNumber

`PokemonCard.id` = dex display number (e.g., `25` for Pikachu). `PokemonCard.formId` = `pokemon_forms.id` primary key used for all DB operations. Every callback, server action, and owned-state lookup must use `formId`. Mixing these up caused a critical early bug where ownership was written to wrong DB rows.

### Optimistic UI

Ownership changes update React state immediately; the server action runs in `startTransition`. This keeps the click-to-mark interaction feeling instant even on slow connections.

### Collection Mode

A client overlay transforming the grid into a bulk-registration tool with three input methods:
- **Click** — toggles single card in queue
- **Drag-paint** — `mouseDown` starts drag; `mouseEnter` extends selection
- **Shift-click** — range-selects using `lastClickedIndex` + `filteredRef` (stable ref avoids stale closures in event handlers)

After applying, the mode stays active (queue clears, selection remains possible). Users exit explicitly via Esc or the Exit button.

### Dex Constants

`src/lib/dex-constants.ts` is the single source of truth for all 15 supported dexes. Every UI that shows dex names, colors, or shortNames reads from this file. Adding a new dex requires only one array entry here.

### Supabase Client Split

- **Browser**: `createClient()` from `@/lib/supabase/client` — anon key, all writes gated by RLS policies
- **Server Actions / Server Components**: server client from `@/lib/supabase/server` — reads the auth cookie and gets the real user
- **Never**: expose the service_role key to any client-side code
