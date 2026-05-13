-- ============================================================
-- DexMaster — Pokédex Selector System
-- Migration 002: game_expansions, pokedexes, dex_entries
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- DLC expansions attached to a base game
CREATE TABLE IF NOT EXISTS game_expansions (
  id            SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id       SMALLINT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  name          TEXT NOT NULL UNIQUE,    -- "isle-of-armor"
  display_name  TEXT NOT NULL,           -- "Isle of Armor"
  release_year  SMALLINT,
  is_dlc        BOOL NOT NULL DEFAULT true
);

-- Named Pokédex regions (national, kanto, galar, hisui, …)
CREATE TABLE IF NOT EXISTS pokedexes (
  id              SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pokeapi_dex_id  SMALLINT NOT NULL UNIQUE,  -- PokéAPI /api/v2/pokedex/{id}
  name            TEXT NOT NULL UNIQUE,       -- "kanto", "hisui", "national"
  display_name    TEXT NOT NULL,              -- "Kanto Pokédex"
  short_name      TEXT NOT NULL,              -- "Kanto", "Nat"
  region          TEXT,
  game_id         SMALLINT REFERENCES games (id),
  expansion_id    SMALLINT REFERENCES game_expansions (id),
  is_national     BOOL NOT NULL DEFAULT false,
  sort_order      SMALLINT NOT NULL DEFAULT 99
);

-- Which species appear in which dex, and at what regional number
CREATE TABLE IF NOT EXISTS dex_entries (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dex_id      SMALLINT NOT NULL REFERENCES pokedexes (id) ON DELETE CASCADE,
  species_id  BIGINT NOT NULL REFERENCES pokemon_species (id) ON DELETE CASCADE,
  dex_number  SMALLINT NOT NULL,
  UNIQUE (dex_id, species_id),
  UNIQUE (dex_id, dex_number)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_expansions_game     ON game_expansions (game_id);
CREATE INDEX IF NOT EXISTS idx_pokedexes_game      ON pokedexes (game_id);
CREATE INDEX IF NOT EXISTS idx_pokedexes_sort      ON pokedexes (sort_order);
CREATE INDEX IF NOT EXISTS idx_dex_entries_dex     ON dex_entries (dex_id);
CREATE INDEX IF NOT EXISTS idx_dex_entries_species ON dex_entries (species_id);
CREATE INDEX IF NOT EXISTS idx_dex_entries_order   ON dex_entries (dex_id, dex_number);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE game_expansions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokedexes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE dex_entries      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_expansions"   ON game_expansions  FOR SELECT USING (true);
CREATE POLICY "public_read_pokedexes"    ON pokedexes        FOR SELECT USING (true);
CREATE POLICY "public_read_dex_entries"  ON dex_entries      FOR SELECT USING (true);
