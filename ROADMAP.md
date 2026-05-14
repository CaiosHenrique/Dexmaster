# Roadmap — dex.gg

## Current State (V0 → V1, May 2026)

The core loop is functional:

- Auth (Supabase OAuth)
- Pokédex grid with 15 dexes, bulk collection mode, drag-paint + shift-select
- Trophy Room collection showcase with highlights + owned grid
- Trainer Hub dashboard with per-game dex progress + recent catches
- Team Builder UI scaffold (type coverage, weakness analysis)
- Competitive meta UI scaffold (mock Smogon data)
- Achievements UI scaffold (placeholder progress, rarity system)
- Pokémon detail page per species

---

## V1 — Core Experience Polish

**Goal:** Make every existing feature feel completely finished. No new feature surface.

### Ownership
- [ ] Shiny toggle per-card on the Pokédex grid (click sparkle on owned cards)
- [ ] Alpha / Gigantamax ownership flags in the detail page form switcher
- [ ] Undo for bulk ownership operations (toast + undo button, 5s window)

### Team Builder
- [ ] Pokémon search modal — search species by name, pick form, add to slot
- [ ] Role picker dropdown in each slot
- [ ] Held item search / free-text field
- [ ] Persist teams to Supabase (`teams` table with JSON slot data)
- [ ] Multiple teams list + create new flow

### Trophy Room
- [ ] Sort by type / generation / legendary / mythical
- [ ] Collection stats card (type distribution, generation breakdown)

### Detail Page
- [ ] Form switcher (all alternate forms with sprites + types)
- [ ] Per-form ownership toggle
- [ ] Evolution chain display
- [ ] "Found in" section — which regional dexes include this species

### Dashboard
- [ ] "Still Hunting" chips link to `/pokedex?dex=X&status=missing`
- [ ] Handle zero-owned state gracefully (empty state CTA)

---

## V2 — Real Competitive Data

**Goal:** Replace all mock Smogon data with live usage stats.

### Smogon Integration
- [ ] `/api/smogon/sync` cron — pull from Smogon's public JSON exports
- [ ] Store in `smogon_stats`: `(month, tier, species_name, usage_pct, rank, role)`
- [ ] Competitive page reads from DB; tier tabs switch the query

### Team Builder Meta Awareness
- [ ] Show Smogon viability rank on each filled team slot
- [ ] "Popular sets for this Pokémon" panel (items/abilities from Smogon data)
- [ ] Suggested Partners panel — top partners by Smogon team co-usage

### Threat Analysis
- [ ] Given a team, show which top-OU Pokémon threaten it most

---

## V3 — Achievements Engine

**Goal:** Make achievements unlock based on real DB state, not placeholder values.

### Unlock Logic
- [ ] `achievements` table: `(user_id, achievement_id, unlocked_at)`
- [ ] Supabase Edge Function or DB trigger: check conditions after bulk saves
- [ ] Unlock conditions:
  - `first-catch`: `COUNT(ownerships) >= 1`
  - `dex10 / dex100`: owned count thresholds
  - `kanto-dex`: all 151 Kanto default form_ids owned
  - `national-dex`: all 1025 National default form_ids owned
  - `shiny-N`: shiny ownership count >= N
  - `eeveelutions`: all 9 Eeveelution form_ids owned

### Achievement UI
- [ ] Unlock toast (slide-up with rarity border glow)
- [ ] Unlock animation keyframe on the achievement card
- [ ] Shareable achievement card image (Vercel OG)

---

## V4 — Social + Profiles

**Goal:** Community layer — trainers comparing and sharing collections.

### Public Profiles
- [ ] `/trainer/[username]` — public dex stats + featured Pokémon
- [ ] Privacy settings: public / friends / private

### Leaderboards
- [ ] National dex completion % leaderboard
- [ ] Shiny count leaderboard

### Team Sharing
- [ ] Share team via URL (DB-stored link)
- [ ] Pokémon Showdown paste import/export

---

## Technical Debt

- [ ] Replace manual `types/database.ts` with `supabase gen types typescript`
- [ ] E2E tests for the ownership flow (Playwright)
- [ ] Rate-limit seed endpoints (currently open to any authenticated user)
- [ ] CDN for sprites (currently raw PokéAPI GitHub URLs)
- [ ] Stale-while-revalidate for Pokédex data (currently always fresh-fetches on mount)

---

## Non-Goals

- Pokémon GO integration
- Battle simulation or damage calculator
- Move set / EV optimization beyond role tags
- Price tracking or trading features
- Video or streaming content
