import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { DEX_CONFIGS } from "@/lib/dex-constants";
import { fetchPokeAPI, extractIdFromUrl } from "./client";
import type { PokeAPIPokedex } from "./client";

export async function seedPokedexes(supabase: SupabaseClient<Database>) {
  const results = { dexes: 0, entries: 0, errors: 0 };

  for (const config of DEX_CONFIGS) {
    // Upsert the pokedex row and get back its generated id
    const { data: dexRow, error: dexErr } = await supabase
      .from("pokedexes")
      .upsert(
        {
          pokeapi_dex_id: config.pokeapiDexId,
          name: config.name,
          display_name: config.displayName,
          short_name: config.shortName,
          region: config.region,
          game_id: config.gameId,
          expansion_id: null,
          is_national: config.isNational,
          sort_order: config.sortOrder,
        },
        { onConflict: "name" }
      )
      .select("id")
      .single();

    if (dexErr || !dexRow) {
      results.errors++;
      console.error(`dex "${config.name}":`, dexErr?.message);
      continue;
    }
    results.dexes++;

    // Fetch entries from PokéAPI
    console.log(`  fetching /pokedex/${config.pokeapiDexId} (${config.name})…`);
    let pokeapiDex: PokeAPIPokedex;
    try {
      pokeapiDex = await fetchPokeAPI<PokeAPIPokedex>(`/pokedex/${config.pokeapiDexId}`);
    } catch (e) {
      results.errors++;
      console.error(`PokéAPI dex ${config.pokeapiDexId}:`, e);
      continue;
    }

    const entries = pokeapiDex.pokemon_entries.map((e) => ({
      dex_id: dexRow.id as number,
      species_id: extractIdFromUrl(e.pokemon_species.url),
      dex_number: e.entry_number,
    }));

    // Insert in batches of 200 to stay within Supabase request limits
    const BATCH = 200;
    for (let i = 0; i < entries.length; i += BATCH) {
      const batch = entries.slice(i, i + BATCH);
      const { error: entryErr } = await supabase
        .from("dex_entries")
        .upsert(batch, { onConflict: "dex_id,species_id" });
      if (entryErr) {
        results.errors++;
        console.error(`dex_entries batch (${config.name} @${i}):`, entryErr.message);
      } else {
        results.entries += batch.length;
      }
    }
  }

  return results;
}
