// Static metadata for all supported Pokédexes.
// Single source of truth shared by seed scripts and frontend UI.

export type DexName =
  | "national"
  | "kanto"
  | "updated-johto"
  | "updated-hoenn"
  | "extended-sinnoh"
  | "updated-unova"
  | "kalos-central"
  | "updated-alola"
  | "galar"
  | "isle-of-armor"
  | "crown-tundra"
  | "hisui"
  | "paldea"
  | "kitakami"
  | "blueberry";

export interface DexConfig {
  pokeapiDexId: number;   // PokéAPI /api/v2/pokedex/{id}
  name: DexName;
  displayName: string;    // "Kanto Pokédex"
  shortName: string;      // "Kanto"
  region: string;
  generation: number;     // 0 = all generations (national)
  gameId: number | null;  // FK to games.id in seed-games.ts
  isNational: boolean;
  isDlc: boolean;
  sortOrder: number;
  color: string;          // hex accent for UI theming
}

// gameId values reference the IDs hardcoded in seed-games.ts:
//   6=FireRed/LeafGreen, 10=HGSS, 14=ORAS, 19=BDSP, 12=B2W2,
//   13=XY, 16=USUM, 18=SwSh, 20=PLA, 21=SV
export const DEX_CONFIGS: DexConfig[] = [
  {
    pokeapiDexId: 1,
    name: "national",
    displayName: "National Dex",
    shortName: "National",
    region: "All Regions",
    generation: 0,
    gameId: null,
    isNational: true,
    isDlc: false,
    sortOrder: 0,
    color: "#7C3AED",
  },
  {
    pokeapiDexId: 2,
    name: "kanto",
    displayName: "Kanto Pokédex",
    shortName: "Kanto",
    region: "Kanto",
    generation: 1,
    gameId: 6,
    isNational: false,
    isDlc: false,
    sortOrder: 1,
    color: "#EF4444",
  },
  {
    pokeapiDexId: 7,
    name: "updated-johto",
    displayName: "Johto Pokédex",
    shortName: "Johto",
    region: "Johto",
    generation: 2,
    gameId: 10,
    isNational: false,
    isDlc: false,
    sortOrder: 2,
    color: "#F59E0B",
  },
  {
    pokeapiDexId: 15,
    name: "updated-hoenn",
    displayName: "Hoenn Pokédex",
    shortName: "Hoenn",
    region: "Hoenn",
    generation: 3,
    gameId: 14,
    isNational: false,
    isDlc: false,
    sortOrder: 3,
    color: "#3B82F6",
  },
  {
    pokeapiDexId: 6,
    name: "extended-sinnoh",
    displayName: "Sinnoh Pokédex",
    shortName: "Sinnoh",
    region: "Sinnoh",
    generation: 4,
    gameId: 19,
    isNational: false,
    isDlc: false,
    sortOrder: 4,
    color: "#8B5CF6",
  },
  {
    pokeapiDexId: 9,
    name: "updated-unova",
    displayName: "Unova Pokédex",
    shortName: "Unova",
    region: "Unova",
    generation: 5,
    gameId: 12,
    isNational: false,
    isDlc: false,
    sortOrder: 5,
    color: "#94A3B8",
  },
  {
    pokeapiDexId: 12,
    name: "kalos-central",
    displayName: "Kalos Pokédex",
    shortName: "Kalos",
    region: "Kalos",
    generation: 6,
    gameId: 13,
    isNational: false,
    isDlc: false,
    sortOrder: 6,
    color: "#EC4899",
  },
  {
    pokeapiDexId: 21,
    name: "updated-alola",
    displayName: "Alola Pokédex",
    shortName: "Alola",
    region: "Alola",
    generation: 7,
    gameId: 16,
    isNational: false,
    isDlc: false,
    sortOrder: 7,
    color: "#F97316",
  },
  {
    pokeapiDexId: 27,
    name: "galar",
    displayName: "Galar Pokédex",
    shortName: "Galar",
    region: "Galar",
    generation: 8,
    gameId: 18,
    isNational: false,
    isDlc: false,
    sortOrder: 8,
    color: "#06B6D4",
  },
  {
    pokeapiDexId: 28,
    name: "isle-of-armor",
    displayName: "Isle of Armor",
    shortName: "Isle of Armor",
    region: "Galar",
    generation: 8,
    gameId: 18,
    isNational: false,
    isDlc: true,
    sortOrder: 9,
    color: "#10B981",
  },
  {
    pokeapiDexId: 29,
    name: "crown-tundra",
    displayName: "Crown Tundra",
    shortName: "Crown Tundra",
    region: "Galar",
    generation: 8,
    gameId: 18,
    isNational: false,
    isDlc: true,
    sortOrder: 10,
    color: "#60A5FA",
  },
  {
    pokeapiDexId: 30,
    name: "hisui",
    displayName: "Hisui Pokédex",
    shortName: "Hisui",
    region: "Hisui",
    generation: 8,
    gameId: 20,
    isNational: false,
    isDlc: false,
    sortOrder: 11,
    color: "#EAB308",
  },
  {
    pokeapiDexId: 31,
    name: "paldea",
    displayName: "Paldea Pokédex",
    shortName: "Paldea",
    region: "Paldea",
    generation: 9,
    gameId: 21,
    isNational: false,
    isDlc: false,
    sortOrder: 12,
    color: "#DC2626",
  },
  {
    pokeapiDexId: 32,
    name: "kitakami",
    displayName: "Kitakami Pokédex",
    shortName: "Kitakami",
    region: "Paldea",
    generation: 9,
    gameId: 21,
    isNational: false,
    isDlc: true,
    sortOrder: 13,
    color: "#D97706",
  },
  {
    pokeapiDexId: 33,
    name: "blueberry",
    displayName: "Blueberry Pokédex",
    shortName: "Blueberry",
    region: "Paldea",
    generation: 9,
    gameId: 21,
    isNational: false,
    isDlc: true,
    sortOrder: 14,
    color: "#A855F7",
  },
];

export const DEX_CONFIG_BY_NAME = Object.fromEntries(
  DEX_CONFIGS.map((d) => [d.name, d])
) as Record<DexName, DexConfig>;

export const DEFAULT_DEX: DexName = "national";
