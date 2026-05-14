# Database — dex.gg

## Platform

Supabase (PostgreSQL). Row Level Security (RLS) is enabled on all user-facing tables. The anon key is used from the browser; the service_role key is only used server-side during seeding.

## Schema

### `pokemon_species`
Canonical Pokémon species data. One row per species (1025 total in Gen 9).

| Column | Type | Notes |
|---|---|---|
| id | int PK | Matches National Pokédex number |
| name | text UNIQUE | URL slug: `"bulbasaur"`, `"pikachu-gmax"` |
| display_name | text | Human label: `"Bulbasaur"` |
| generation | int | 1–9 |
| is_legendary | bool | |
| is_mythical | bool | |
| is_baby | bool | |
| base_stats | jsonb | `{hp, atk, def, sp_atk, sp_def, spd}` |

### `pokemon_forms`
All forms of a species (default + regional + mega + gmax + alternate).

| Column | Type | Notes |
|---|---|---|
| id | int PK | Used for all ownership operations |
| species_id | int FK | → `pokemon_species.id` |
| name | text | `"charizard-mega-x"` |
| sprite_default | text | URL |
| sprite_shiny | text | URL (may be null) |
| types | text[] | `["fire", "flying"]` |
| is_default | bool | True for the canonical form shown in the grid |
| is_mega | bool | |
| is_gmax | bool | |
| is_regional | bool | Galarian, Hisuian, Paldean forms |

### `pokedexes`
One row per supported regional dex.

| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| name | text UNIQUE | `"paldea"`, `"national"`, `"kanto"` |
| display_name | text | `"Paldea Pokédex"` |
| game | text | `"Scarlet & Violet"` |
| generation | int | |

### `dex_entries`
Maps species to their position in a specific dex.

| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| dex_id | int FK | → `pokedexes.id` |
| species_id | int FK | → `pokemon_species.id` |
| dex_number | int | 1-based position in the regional dex |
| | UNIQUE(dex_id, dex_number) | |

### `ownerships`
Core user-data table. One row per owned form variant per user.

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | Serial — higher = more recently registered |
| user_id | uuid FK | → `auth.users.id` |
| form_id | int FK | → `pokemon_forms.id` |
| is_shiny | bool | Default false |
| is_alpha | bool | Default false (Legends: Arceus) |
| is_gigantamax | bool | Default false |
| created_at | timestamptz | |
| | UNIQUE(user_id, form_id, is_shiny, is_alpha, is_gigantamax) | Prevents duplicates |

## Ownership Model

The unique key `(user_id, form_id, is_shiny, is_alpha, is_gigantamax)` lets the same form appear multiple times for different variants:

| form_id | is_shiny | is_alpha | is_gigantamax | Meaning |
|---|---|---|---|---|
| 35 | false | false | false | Normal Pikachu |
| 35 | true  | false | false | Shiny Pikachu |
| 36 | false | false | false | Pikachu-Alolan |

**Completion % rule**: only rows with `is_shiny=false, is_alpha=false, is_gigantamax=false` count toward dex completion. Shinies/alphas are collectibles.

## Key Relationships

```
pokemon_species 1──* pokemon_forms   (all forms of a species)
pokemon_species 1──* dex_entries     (which dexes include this species)
pokedexes       1──* dex_entries     (all entries in a dex)
pokemon_forms   1──* ownerships      (all users who own this form)
auth.users      1──* ownerships      (all forms a user owns)
```

## RLS Policies

- `ownerships`: SELECT/INSERT/DELETE where `auth.uid() = user_id`
- `pokemon_*`, `pokedexes`, `dex_entries`: SELECT for any authenticated user; writes via service_role only

## Seeding Pipeline

```
POST /api/seed { "step": "games" }      # Inserts pokedexes rows
POST /api/seed { "step": "species" }    # Fetches from PokéAPI → pokemon_species + pokemon_forms
POST /api/seed { "step": "pokedexes" } # Builds dex_entries for all 15 dexes
```

Run in order. Species seeding is the slow step (1025 PokéAPI calls, batched).

## Query Patterns

### Load dex grid

```ts
// Get default form per species, ordered by dex position
const { data } = await supabase
  .from("dex_entries")
  .select(`dex_number, pokemon_species(
    id, name, display_name,
    pokemon_forms(id, sprite_default, types, is_default)
  )`)
  .eq("dex_id", dexId)
  .order("dex_number");
```

### Bulk upsert ownership

```ts
await supabase.from("ownerships").upsert(
  formIds.map((form_id) => ({ user_id, form_id, is_shiny: false, is_alpha: false, is_gigantamax: false })),
  { onConflict: "user_id,form_id,is_shiny,is_alpha,is_gigantamax" }
);
```

### Bulk delete ownership

```ts
await supabase.from("ownerships")
  .delete()
  .eq("user_id", userId).in("form_id", formIds)
  .eq("is_shiny", false).eq("is_alpha", false).eq("is_gigantamax", false);
```

## Type Notes

Supabase returns `ownerships.id` (bigint) as a `string` in some SDK versions. Use `row.id as unknown as number` when you need a numeric sort key. All other id columns are standard integers.
