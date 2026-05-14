# Project Context — dex.gg

## What This Is

dex.gg is a premium Pokémon living-dex tracker and competitive companion platform. It lets trainers register which Pokémon they own, track completion across every regional dex, showcase their collection, and plan competitive teams with meta insight.

The product sits at the intersection of:
- **Completionist tracking** — living dex, form-by-form completion across 15 regional dexes
- **Collector identity** — trophy room, shiny showcase, rarity achievements
- **Competitive utility** — team builder with type coverage, meta snapshot per tier

## Why It Exists

Most Pokémon tracking tools are spreadsheets or basic checklist apps. dex.gg aims to be the "premium trainer journal" — the tool a serious player actually wants open on their second monitor. The bar is set against apps like OP.GG and Mobalytics, not Google Sheets.

## Target User

- Dedicated players who care about living dex completion
- Shiny hunters who want to log and showcase rare finds
- Competitive players who want team analysis alongside their collection
- Nostalgic players who grew up with the DS era and want a tool that feels like a premium in-game Pokédex

## Design Philosophy

**Nostalgic but premium.** DS-era Pokémon aesthetics (pixel fonts, game-like status rings) layered over a modern glassmorphism dark UI. Feels like opening your trainer journal from a premium save file.

**Completionist fantasy.** Every interaction reinforces progress. Marking a Pokémon as owned feels like catching it. The grid fills in visibly. Progress bars inch forward with satisfying animations.

**Opinionated information hierarchy:**
- Dashboard (Trainer Hub) — journey overview, game selector, dex progress, recent catches
- Pokédex — browse and mark ownership across 15 dexes
- Trophy Room — showcase owned Pokémon, highlights, shiny display
- Team Builder — 6-slot team with coverage and weakness analysis
- Competitive — meta snapshot per tier (mock data until Smogon integration)
- Achievements — milestone tracking with Xbox-style rarity system

## Core Rules

1. **Dark mode only.** No light mode. The entire design system assumes dark backgrounds.
2. **Completion % never counts shinies.** Shinies are optional collectibles tracked separately.
3. **Default species only in the completion grid.** The Pokédex shows one entry per species. Regional/alternate forms are tracked in the DB but don't inflate completion numbers.
4. **Form-level ownership.** The DB stores `form_id` (not species id), enabling per-form tracking of Galarian, Hisuian, Gigantamax, and alternate forms.
5. **No service_role key on the client.** Supabase Row Level Security handles all user data isolation. Only the anon key is exposed to the browser.
6. **Optimistic UI.** Ownership changes are reflected immediately in the UI; server persistence happens in the background via `startTransition`.

## Current State (May 2026)

| Feature | Status |
|---|---|
| Auth (Supabase OAuth) | Complete |
| DB schema + seed pipeline | Complete |
| Pokédex grid (15 dexes, filters, collection mode) | Complete |
| Bulk ownership (drag-paint, shift-select, keyboard shortcuts) | Complete |
| Trophy Room collection page | Complete |
| Trainer Hub dashboard | Complete |
| Pokémon detail page | Complete |
| Team Builder | UI scaffold |
| Competitive meta | UI scaffold (mock data) |
| Achievements | UI scaffold (placeholder progress) |
| Smogon data integration | Not started |
| Pokémon search modal for team builder | Not started |
| Real achievement unlock logic | Not started |
