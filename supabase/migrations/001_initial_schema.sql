-- ============================================================
-- DexMaster — Initial Schema
-- Run in Supabase Dashboard > SQL Editor, or via psql
-- ============================================================

-- ──────────────────────────────────────────────
-- CORE STATIC DATA (public read, no client write)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pokemon_species (
  id                  BIGINT PRIMARY KEY,        -- PokéAPI species ID (1–1025+)
  name                TEXT NOT NULL UNIQUE,       -- "pikachu"
  display_name        TEXT NOT NULL,              -- "Pikachu"
  generation          SMALLINT NOT NULL,          -- 1–9
  evolution_chain_id  BIGINT,
  is_legendary        BOOL NOT NULL DEFAULT false,
  is_mythical         BOOL NOT NULL DEFAULT false,
  is_baby             BOOL NOT NULL DEFAULT false,
  color               TEXT,
  shape               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pokemon_forms (
  id                      BIGINT PRIMARY KEY,     -- PokéAPI pokemon ID (≠ species ID for forms)
  species_id              BIGINT NOT NULL REFERENCES pokemon_species (id) ON DELETE CASCADE,
  name                    TEXT NOT NULL UNIQUE,   -- "raichu-alola"
  display_name            TEXT NOT NULL,          -- "Alolan Raichu"
  form_category           TEXT NOT NULL,
    -- 'base'       → default form (shown in main grid)
    -- 'regional'   → Alolan, Galarian, Hisuian, Paldean (counts for completion)
    -- 'mega'       → Mega evolution (optional collectible)
    -- 'gigantamax' → Gigantamax form (optional collectible)
    -- 'paradox'    → Paradox Pokémon treated as distinct species in the grid
    -- 'alpha'      → Hisui alpha variant (optional collectible)
    -- 'primal'     → Primal Kyogre/Groudon (optional collectible)
    -- 'cosmetic'   → Vivillon patterns, Flabébé colors, gender differences
    -- 'special'    → Event-only transformations
  is_default              BOOL NOT NULL DEFAULT false,
  counts_for_completion   BOOL NOT NULL DEFAULT false,
    -- true  → base, regional, paradox
    -- false → mega, gigantamax, alpha, primal, cosmetic, special
  types                   TEXT[] NOT NULL,        -- ARRAY['electric','psychic']
  base_stats              JSONB NOT NULL,         -- {hp,atk,def,spa,spd,spe,total}
  abilities               JSONB NOT NULL,         -- [{name,is_hidden}]
  sprite_default          TEXT,
  sprite_shiny            TEXT,
  artwork_url             TEXT,
  height                  INT,                    -- decimetres
  weight                  INT,                    -- hectograms
  gender_rate             SMALLINT,               -- -1=genderless 0=always-male 8=always-female
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evolution_steps (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chain_id          BIGINT NOT NULL,
  from_species_id   BIGINT REFERENCES pokemon_species (id),  -- NULL = chain root
  to_species_id     BIGINT NOT NULL REFERENCES pokemon_species (id),
  min_level         SMALLINT,
  trigger           TEXT,    -- 'level-up' | 'use-item' | 'trade' | 'shed' | 'other'
  trigger_item      TEXT,
  conditions        JSONB    -- {time, friendship, held_item, location, ...}
);

CREATE TABLE IF NOT EXISTS games (
  id            SMALLINT PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,   -- "scarlet-violet"
  display_name  TEXT NOT NULL,          -- "Scarlet / Violet"
  generation    SMALLINT NOT NULL,
  platform      TEXT,                   -- "Switch" | "3DS" | "DS" | "GBA" | ...
  release_year  SMALLINT,
  region        TEXT                    -- "Paldea" | "Galar" | "Hisui" | "Kalos" | ...
);

CREATE TABLE IF NOT EXISTS locations (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id       SMALLINT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  display_name  TEXT NOT NULL
);

-- Where a form CAN be obtained (static availability — seeded, not user-generated)
CREATE TABLE IF NOT EXISTS pokemon_availability (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  form_id               BIGINT NOT NULL REFERENCES pokemon_forms (id) ON DELETE CASCADE,
  game_id               SMALLINT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  location_id           BIGINT REFERENCES locations (id),
  method                TEXT NOT NULL,
    -- 'wild' | 'egg' | 'gift' | 'trade' | 'evolve' | 'event' | 'raid' | 'transfer'
  conditions            JSONB,    -- {time:'night', weather:'rain', chance:15}
  notes                 TEXT,
  is_version_exclusive  BOOL NOT NULL DEFAULT false,
  exclusive_version     TEXT      -- 'scarlet' | 'violet' | 'sword' | 'shield' | ...
);

-- ──────────────────────────────────────────────
-- COMPETITIVE DATA (seeded from Smogon — V3)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS competitive_sets (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  form_id         BIGINT NOT NULL REFERENCES pokemon_forms (id) ON DELETE CASCADE,
  format          TEXT NOT NULL,    -- 'gen9ou' | 'gen9vgc' | 'gen9uu' | ...
  tier            TEXT,             -- 'OU' | 'UU' | 'RU' | 'NU' | 'Uber' | 'AG'
  usage_percent   DECIMAL(5,2),
  nature          TEXT,
  ability         TEXT,
  item            TEXT,
  moves           TEXT[],           -- Array of 4 move names
  ev_spread       JSONB,            -- {hp:0,atk:252,def:4,spa:0,spd:0,spe:252}
  description     TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- USER DATA (RLS enforced — user_id = auth.uid())
-- ──────────────────────────────────────────────

-- The Living Dex: what the user has obtained
CREATE TABLE IF NOT EXISTS ownerships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  form_id           BIGINT NOT NULL REFERENCES pokemon_forms (id) ON DELETE CASCADE,
  -- Variant flags — each combination is a distinct collectible
  is_shiny          BOOL NOT NULL DEFAULT false,
  is_alpha          BOOL NOT NULL DEFAULT false,
  is_gigantamax     BOOL NOT NULL DEFAULT false,
  -- Capture metadata (does NOT affect global owned status — informational only)
  obtained_game_id  SMALLINT REFERENCES games (id),
  obtained_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  method            TEXT,    -- mirrors pokemon_availability.method
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A user can hold one record per variant combination per form
  -- Allows tracking regular + shiny as separate entries
  UNIQUE (user_id, form_id, is_shiny, is_alpha, is_gigantamax)
);

-- User's game library (drives Completion Planner in V2)
CREATE TABLE IF NOT EXISTS user_games (
  user_id   UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  game_id   SMALLINT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, game_id)
);

-- ──────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_forms_species     ON pokemon_forms (species_id);
CREATE INDEX IF NOT EXISTS idx_forms_completion  ON pokemon_forms (counts_for_completion) WHERE counts_for_completion = true;
CREATE INDEX IF NOT EXISTS idx_forms_default     ON pokemon_forms (is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_forms_category    ON pokemon_forms (form_category);
CREATE INDEX IF NOT EXISTS idx_evol_chain        ON evolution_steps (chain_id);
CREATE INDEX IF NOT EXISTS idx_evol_to           ON evolution_steps (to_species_id);
CREATE INDEX IF NOT EXISTS idx_avail_form        ON pokemon_availability (form_id);
CREATE INDEX IF NOT EXISTS idx_avail_game        ON pokemon_availability (game_id);
CREATE INDEX IF NOT EXISTS idx_competitive_form  ON competitive_sets (form_id, format);
CREATE INDEX IF NOT EXISTS idx_ownerships_user   ON ownerships (user_id);
CREATE INDEX IF NOT EXISTS idx_ownerships_form   ON ownerships (user_id, form_id);

-- ──────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────

ALTER TABLE pokemon_species      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon_forms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_steps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE games                ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_sets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownerships           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games           ENABLE ROW LEVEL SECURITY;

-- Static data: public read, no writes from client
CREATE POLICY "public_read_species"       ON pokemon_species      FOR SELECT USING (true);
CREATE POLICY "public_read_forms"         ON pokemon_forms        FOR SELECT USING (true);
CREATE POLICY "public_read_evolutions"    ON evolution_steps      FOR SELECT USING (true);
CREATE POLICY "public_read_games"         ON games                FOR SELECT USING (true);
CREATE POLICY "public_read_locations"     ON locations            FOR SELECT USING (true);
CREATE POLICY "public_read_availability"  ON pokemon_availability FOR SELECT USING (true);
CREATE POLICY "public_read_competitive"   ON competitive_sets     FOR SELECT USING (true);

-- Ownerships: full CRUD scoped to auth.uid()
CREATE POLICY "own_ownerships_select" ON ownerships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_ownerships_insert" ON ownerships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_ownerships_update" ON ownerships FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_ownerships_delete" ON ownerships FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_user_games_select" ON user_games FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_user_games_insert" ON user_games FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_user_games_delete" ON user_games FOR DELETE USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- COMPLETION ENGINE — RPC FUNCTIONS
-- Called via supabase.rpc('get_dex_completion', { p_user_id })
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_dex_completion(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  national_owned  BIGINT;
  national_total  BIGINT;
  form_owned      BIGINT;
  form_total      BIGINT;
  shiny_owned     BIGINT;
  alpha_owned     BIGINT;
  alpha_total     BIGINT;
BEGIN
  -- National Dex: default form (non-shiny) owned, counted per species
  SELECT COUNT(DISTINCT f.species_id) INTO national_owned
  FROM ownerships o
  JOIN pokemon_forms f ON f.id = o.form_id
  WHERE o.user_id = p_user_id AND f.is_default = true AND o.is_shiny = false;

  SELECT COUNT(*) INTO national_total FROM pokemon_species;

  -- Form Dex: all completion-required forms (regional + base), non-shiny
  SELECT COUNT(*) INTO form_owned
  FROM ownerships o
  JOIN pokemon_forms f ON f.id = o.form_id
  WHERE o.user_id = p_user_id AND f.counts_for_completion = true AND o.is_shiny = false;

  SELECT COUNT(*) INTO form_total FROM pokemon_forms WHERE counts_for_completion = true;

  -- Shiny Dex: default form owned as shiny, per species
  SELECT COUNT(DISTINCT f.species_id) INTO shiny_owned
  FROM ownerships o
  JOIN pokemon_forms f ON f.id = o.form_id
  WHERE o.user_id = p_user_id AND f.is_default = true AND o.is_shiny = true;

  -- Alpha Dex: alpha-flagged ownerships
  SELECT COUNT(*) INTO alpha_owned
  FROM ownerships WHERE user_id = p_user_id AND is_alpha = true;

  SELECT COUNT(*) INTO alpha_total FROM pokemon_forms WHERE form_category = 'alpha';

  RETURN json_build_object(
    'national_dex', json_build_object('owned', national_owned, 'total', national_total),
    'form_dex',     json_build_object('owned', form_owned,     'total', form_total),
    'shiny_dex',    json_build_object('owned', shiny_owned,    'total', national_total),
    'alpha_dex',    json_build_object('owned', alpha_owned,    'total', alpha_total)
  );
END;
$$;

-- Per-generation breakdown for the dashboard
CREATE OR REPLACE FUNCTION get_generation_completion(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
  SELECT json_agg(row ORDER BY row.generation)
  INTO result
  FROM (
    SELECT
      s.generation,
      COUNT(o.id)  AS owned,
      COUNT(s.id)  AS total
    FROM pokemon_species s
    LEFT JOIN pokemon_forms f  ON f.species_id = s.id AND f.is_default = true
    LEFT JOIN ownerships o     ON o.form_id = f.id
      AND o.user_id = p_user_id AND o.is_shiny = false
    GROUP BY s.generation
  ) row;

  RETURN result;
END;
$$;
