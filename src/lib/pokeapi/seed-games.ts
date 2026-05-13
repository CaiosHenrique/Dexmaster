import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type GameRow = Database["public"]["Tables"]["games"]["Insert"];

const GAMES: GameRow[] = [
  { id: 1,  name: "red-blue",                       display_name: "Red / Blue",                          generation: 1, platform: "Game Boy",        release_year: 1996, region: "Kanto"  },
  { id: 2,  name: "yellow",                          display_name: "Yellow",                              generation: 1, platform: "Game Boy",        release_year: 1998, region: "Kanto"  },
  { id: 3,  name: "gold-silver",                     display_name: "Gold / Silver",                       generation: 2, platform: "Game Boy Color",  release_year: 1999, region: "Johto"  },
  { id: 4,  name: "crystal",                         display_name: "Crystal",                             generation: 2, platform: "Game Boy Color",  release_year: 2000, region: "Johto"  },
  { id: 5,  name: "ruby-sapphire",                   display_name: "Ruby / Sapphire",                     generation: 3, platform: "GBA",             release_year: 2002, region: "Hoenn"  },
  { id: 6,  name: "firered-leafgreen",               display_name: "FireRed / LeafGreen",                 generation: 3, platform: "GBA",             release_year: 2004, region: "Kanto"  },
  { id: 7,  name: "emerald",                         display_name: "Emerald",                             generation: 3, platform: "GBA",             release_year: 2004, region: "Hoenn"  },
  { id: 8,  name: "diamond-pearl",                   display_name: "Diamond / Pearl",                     generation: 4, platform: "DS",              release_year: 2006, region: "Sinnoh" },
  { id: 9,  name: "platinum",                        display_name: "Platinum",                            generation: 4, platform: "DS",              release_year: 2008, region: "Sinnoh" },
  { id: 10, name: "heartgold-soulsilver",            display_name: "HeartGold / SoulSilver",              generation: 4, platform: "DS",              release_year: 2009, region: "Johto"  },
  { id: 11, name: "black-white",                     display_name: "Black / White",                       generation: 5, platform: "DS",              release_year: 2010, region: "Unova"  },
  { id: 12, name: "black-2-white-2",                 display_name: "Black 2 / White 2",                   generation: 5, platform: "DS",              release_year: 2012, region: "Unova"  },
  { id: 13, name: "x-y",                             display_name: "X / Y",                               generation: 6, platform: "3DS",             release_year: 2013, region: "Kalos"  },
  { id: 14, name: "omega-ruby-alpha-sapphire",       display_name: "Omega Ruby / Alpha Sapphire",         generation: 6, platform: "3DS",             release_year: 2014, region: "Hoenn"  },
  { id: 15, name: "sun-moon",                        display_name: "Sun / Moon",                          generation: 7, platform: "3DS",             release_year: 2016, region: "Alola"  },
  { id: 16, name: "ultra-sun-ultra-moon",            display_name: "Ultra Sun / Ultra Moon",              generation: 7, platform: "3DS",             release_year: 2017, region: "Alola"  },
  { id: 17, name: "lets-go-pikachu-eevee",           display_name: "Let's Go Pikachu / Let's Go Eevee",   generation: 7, platform: "Switch",          release_year: 2018, region: "Kanto"  },
  { id: 18, name: "sword-shield",                    display_name: "Sword / Shield",                      generation: 8, platform: "Switch",          release_year: 2019, region: "Galar"  },
  { id: 19, name: "brilliant-diamond-shining-pearl", display_name: "Brilliant Diamond / Shining Pearl",   generation: 8, platform: "Switch",          release_year: 2021, region: "Sinnoh" },
  { id: 20, name: "legends-arceus",                  display_name: "Legends: Arceus",                     generation: 8, platform: "Switch",          release_year: 2022, region: "Hisui"  },
  { id: 21, name: "scarlet-violet",                  display_name: "Scarlet / Violet",                    generation: 9, platform: "Switch",          release_year: 2022, region: "Paldea" },
];

const EXPANSIONS = [
  { game_id: 18, name: "isle-of-armor",   display_name: "Isle of Armor",  release_year: 2020, is_dlc: true },
  { game_id: 18, name: "crown-tundra",    display_name: "Crown Tundra",   release_year: 2020, is_dlc: true },
  { game_id: 21, name: "the-teal-mask",   display_name: "The Teal Mask",  release_year: 2023, is_dlc: true },
  { game_id: 21, name: "the-indigo-disk", display_name: "The Indigo Disk",release_year: 2023, is_dlc: true },
];

export async function seedGames(supabase: SupabaseClient<Database>) {
  const { error: gamesErr } = await supabase
    .from("games")
    .upsert(GAMES, { onConflict: "id" });
  if (gamesErr) throw new Error(`seed games: ${gamesErr.message}`);

  const { error: expErr } = await supabase
    .from("game_expansions")
    .upsert(EXPANSIONS, { onConflict: "name" });
  if (expErr) throw new Error(`seed expansions: ${expErr.message}`);

  return { games: GAMES.length, expansions: EXPANSIONS.length };
}
