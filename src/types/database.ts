export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums / Unions ───────────────────────────────────────────────────────────

export type FormCategory =
  | "base"
  | "regional"
  | "mega"
  | "gigantamax"
  | "paradox"
  | "alpha"
  | "primal"
  | "cosmetic"
  | "special";

export type AvailabilityMethod =
  | "wild"
  | "egg"
  | "gift"
  | "trade"
  | "evolve"
  | "event"
  | "raid"
  | "transfer";

export type EvolutionTrigger =
  | "level-up"
  | "use-item"
  | "trade"
  | "shed"
  | "other";

// ─── JSONB shape types ────────────────────────────────────────────────────────

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  total: number;
}

export interface PokemonAbility {
  name: string;
  is_hidden: boolean;
}

export interface EvSpread {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

// ─── Database shape ───────────────────────────────────────────────────────────
// Insert/Update types are written inline (not via Omit<Database[...]["Row"]>)
// to avoid circular self-references that cause TypeScript to resolve to never.

export interface Database {
  public: {
    Tables: {
      pokemon_species: {
        Row: {
          id: number;
          name: string;
          display_name: string;
          generation: number;
          evolution_chain_id: number | null;
          is_legendary: boolean;
          is_mythical: boolean;
          is_baby: boolean;
          color: string | null;
          shape: string | null;
          created_at: string;
        };
        Insert: {
          id: number;
          name: string;
          display_name: string;
          generation: number;
          evolution_chain_id?: number | null;
          is_legendary?: boolean;
          is_mythical?: boolean;
          is_baby?: boolean;
          color?: string | null;
          shape?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          display_name?: string;
          generation?: number;
          evolution_chain_id?: number | null;
          is_legendary?: boolean;
          is_mythical?: boolean;
          is_baby?: boolean;
          color?: string | null;
          shape?: string | null;
          created_at?: string;
        };
      };
      pokemon_forms: {
        Row: {
          id: number;
          species_id: number;
          name: string;
          display_name: string;
          form_category: FormCategory;
          is_default: boolean;
          counts_for_completion: boolean;
          types: string[];
          base_stats: BaseStats;
          abilities: PokemonAbility[];
          sprite_default: string | null;
          sprite_shiny: string | null;
          artwork_url: string | null;
          height: number | null;
          weight: number | null;
          gender_rate: number | null;
          created_at: string;
        };
        Insert: {
          id: number;
          species_id: number;
          name: string;
          display_name: string;
          form_category: FormCategory;
          is_default?: boolean;
          counts_for_completion?: boolean;
          types: string[];
          base_stats: BaseStats;
          abilities: PokemonAbility[];
          sprite_default?: string | null;
          sprite_shiny?: string | null;
          artwork_url?: string | null;
          height?: number | null;
          weight?: number | null;
          gender_rate?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          species_id?: number;
          name?: string;
          display_name?: string;
          form_category?: FormCategory;
          is_default?: boolean;
          counts_for_completion?: boolean;
          types?: string[];
          base_stats?: BaseStats;
          abilities?: PokemonAbility[];
          sprite_default?: string | null;
          sprite_shiny?: string | null;
          artwork_url?: string | null;
          height?: number | null;
          weight?: number | null;
          gender_rate?: number | null;
          created_at?: string;
        };
      };
      evolution_steps: {
        Row: {
          id: number;
          chain_id: number;
          from_species_id: number | null;
          to_species_id: number;
          min_level: number | null;
          trigger: EvolutionTrigger | null;
          trigger_item: string | null;
          conditions: Json | null;
        };
        Insert: {
          id?: number;
          chain_id: number;
          from_species_id?: number | null;
          to_species_id: number;
          min_level?: number | null;
          trigger?: EvolutionTrigger | null;
          trigger_item?: string | null;
          conditions?: Json | null;
        };
        Update: {
          id?: number;
          chain_id?: number;
          from_species_id?: number | null;
          to_species_id?: number;
          min_level?: number | null;
          trigger?: EvolutionTrigger | null;
          trigger_item?: string | null;
          conditions?: Json | null;
        };
      };
      games: {
        Row: {
          id: number;
          name: string;
          display_name: string;
          generation: number;
          platform: string | null;
          release_year: number | null;
          region: string | null;
        };
        Insert: {
          id: number;
          name: string;
          display_name: string;
          generation: number;
          platform?: string | null;
          release_year?: number | null;
          region?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          display_name?: string;
          generation?: number;
          platform?: string | null;
          release_year?: number | null;
          region?: string | null;
        };
      };
      locations: {
        Row: {
          id: number;
          game_id: number;
          name: string;
          display_name: string;
        };
        Insert: {
          id?: number;
          game_id: number;
          name: string;
          display_name: string;
        };
        Update: {
          id?: number;
          game_id?: number;
          name?: string;
          display_name?: string;
        };
      };
      pokemon_availability: {
        Row: {
          id: number;
          form_id: number;
          game_id: number;
          location_id: number | null;
          method: AvailabilityMethod;
          conditions: Json | null;
          notes: string | null;
          is_version_exclusive: boolean;
          exclusive_version: string | null;
        };
        Insert: {
          id?: number;
          form_id: number;
          game_id: number;
          location_id?: number | null;
          method: AvailabilityMethod;
          conditions?: Json | null;
          notes?: string | null;
          is_version_exclusive?: boolean;
          exclusive_version?: string | null;
        };
        Update: {
          id?: number;
          form_id?: number;
          game_id?: number;
          location_id?: number | null;
          method?: AvailabilityMethod;
          conditions?: Json | null;
          notes?: string | null;
          is_version_exclusive?: boolean;
          exclusive_version?: string | null;
        };
      };
      competitive_sets: {
        Row: {
          id: number;
          form_id: number;
          format: string;
          tier: string | null;
          usage_percent: number | null;
          nature: string | null;
          ability: string | null;
          item: string | null;
          moves: string[] | null;
          ev_spread: EvSpread | null;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          form_id: number;
          format: string;
          tier?: string | null;
          usage_percent?: number | null;
          nature?: string | null;
          ability?: string | null;
          item?: string | null;
          moves?: string[] | null;
          ev_spread?: EvSpread | null;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          form_id?: number;
          format?: string;
          tier?: string | null;
          usage_percent?: number | null;
          nature?: string | null;
          ability?: string | null;
          item?: string | null;
          moves?: string[] | null;
          ev_spread?: EvSpread | null;
          description?: string | null;
          updated_at?: string;
        };
      };
      ownerships: {
        Row: {
          id: string;
          user_id: string;
          form_id: number;
          is_shiny: boolean;
          is_alpha: boolean;
          is_gigantamax: boolean;
          obtained_game_id: number | null;
          obtained_at: string;
          method: AvailabilityMethod | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          form_id: number;
          is_shiny?: boolean;
          is_alpha?: boolean;
          is_gigantamax?: boolean;
          obtained_game_id?: number | null;
          obtained_at?: string;
          method?: AvailabilityMethod | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          form_id?: number;
          is_shiny?: boolean;
          is_alpha?: boolean;
          is_gigantamax?: boolean;
          obtained_game_id?: number | null;
          obtained_at?: string;
          method?: AvailabilityMethod | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      user_games: {
        Row: { user_id: string; game_id: number };
        Insert: { user_id: string; game_id: number };
        Update: { user_id?: string; game_id?: number };
      };
      game_expansions: {
        Row: {
          id: number;
          game_id: number;
          name: string;
          display_name: string;
          release_year: number | null;
          is_dlc: boolean;
        };
        Insert: {
          id?: number;
          game_id: number;
          name: string;
          display_name: string;
          release_year?: number | null;
          is_dlc?: boolean;
        };
        Update: {
          id?: number;
          game_id?: number;
          name?: string;
          display_name?: string;
          release_year?: number | null;
          is_dlc?: boolean;
        };
      };
      pokedexes: {
        Row: {
          id: number;
          pokeapi_dex_id: number;
          name: string;
          display_name: string;
          short_name: string;
          region: string | null;
          game_id: number | null;
          expansion_id: number | null;
          is_national: boolean;
          sort_order: number;
        };
        Insert: {
          id?: number;
          pokeapi_dex_id: number;
          name: string;
          display_name: string;
          short_name: string;
          region?: string | null;
          game_id?: number | null;
          expansion_id?: number | null;
          is_national?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: number;
          pokeapi_dex_id?: number;
          name?: string;
          display_name?: string;
          short_name?: string;
          region?: string | null;
          game_id?: number | null;
          expansion_id?: number | null;
          is_national?: boolean;
          sort_order?: number;
        };
      };
      dex_entries: {
        Row: {
          id: number;
          dex_id: number;
          species_id: number;
          dex_number: number;
        };
        Insert: {
          id?: number;
          dex_id: number;
          species_id: number;
          dex_number: number;
        };
        Update: {
          id?: number;
          dex_id?: number;
          species_id?: number;
          dex_number?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_dex_completion: {
        Args: { p_user_id: string };
        Returns: {
          national_dex: { owned: number; total: number };
          form_dex: { owned: number; total: number };
          shiny_dex: { owned: number; total: number };
          alpha_dex: { owned: number; total: number };
        };
      };
      get_generation_completion: {
        Args: { p_user_id: string };
        Returns: Array<{ generation: number; owned: number; total: number }>;
      };
    };
    Enums: Record<string, never>;
  };
}

// ─── Convenience row aliases ──────────────────────────────────────────────────

export type Species = Database["public"]["Tables"]["pokemon_species"]["Row"];
export type PokemonForm = Database["public"]["Tables"]["pokemon_forms"]["Row"];
export type EvolutionStep = Database["public"]["Tables"]["evolution_steps"]["Row"];
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type Availability = Database["public"]["Tables"]["pokemon_availability"]["Row"];
export type CompetitiveSet = Database["public"]["Tables"]["competitive_sets"]["Row"];
export type Ownership = Database["public"]["Tables"]["ownerships"]["Row"];
export type UserGame = Database["public"]["Tables"]["user_games"]["Row"];
export type GameExpansion = Database["public"]["Tables"]["game_expansions"]["Row"];
export type Pokedex = Database["public"]["Tables"]["pokedexes"]["Row"];
export type DexEntry = Database["public"]["Tables"]["dex_entries"]["Row"];

// ─── Composite types used across the app ─────────────────────────────────────

export interface PokemonWithForms extends Species {
  forms: PokemonForm[];
  default_form: PokemonForm;
}

export interface DexCompletion {
  national_dex: { owned: number; total: number };
  form_dex: { owned: number; total: number };
  shiny_dex: { owned: number; total: number };
  alpha_dex: { owned: number; total: number };
}

export interface GenerationCompletion {
  generation: number;
  owned: number;
  total: number;
}
