import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FormCategory } from "@/types/database";
import { batchFetch, extractIdFromUrl } from "./client";
import type { PokeAPISpecies, PokeAPIPokemon } from "./client";

const GEN_MAP: Record<string, number> = {
  "generation-i": 1, "generation-ii": 2, "generation-iii": 3,
  "generation-iv": 4, "generation-v": 5, "generation-vi": 6,
  "generation-vii": 7, "generation-viii": 8, "generation-ix": 9,
};

// Species whose alternate forms are cosmetic (palette swaps, size differences, etc.)
const COSMETIC_SPECIES = new Set([
  "unown", "spinda", "castform", "burmy", "wormadam", "cherrim",
  "shellos", "gastrodon", "rotom", "giratina", "shaymin", "arceus",
  "basculin", "deerling", "sawsbuck", "tornadus", "thundurus",
  "landorus", "kyurem", "keldeo", "meloetta", "genesect", "vivillon",
  "flabebe", "floette", "florges", "furfrou", "meowstic", "aegislash",
  "pumpkaboo", "gourgeist", "zygarde", "hoopa", "magearna", "silvally",
  "minior", "mimikyu", "necrozma", "cramorant", "morpeko", "eiscue",
  "indeedee", "urshifu", "calyrex", "enamorus", "oricorio", "lycanroc",
  "wishiwashi",
]);

function classifyForm(pokemonName: string, speciesName: string, isDefault: boolean): FormCategory {
  const n = pokemonName.toLowerCase();
  if (n.includes("-alola"))  return "regional";
  if (n.includes("-galar"))  return "regional";
  if (n.includes("-hisui"))  return "regional";
  if (n.includes("-paldea")) return "regional";
  if (n.includes("-mega"))   return "mega";
  if (n.includes("-gmax"))   return "gigantamax";
  if (n.includes("-primal")) return "primal";
  if (!isDefault && n.endsWith("-alpha")) return "alpha";
  if (isDefault) return "base";
  if (COSMETIC_SPECIES.has(speciesName)) return "cosmetic";
  return "special";
}

function countsForCompletion(cat: FormCategory): boolean {
  return cat === "base" || cat === "regional" || cat === "paradox";
}

function extractStats(stats: PokeAPIPokemon["stats"]) {
  const keyMap: Record<string, string> = {
    "hp": "hp", "attack": "atk", "defense": "def",
    "special-attack": "spa", "special-defense": "spd", "speed": "spe",
  };
  const out: Record<string, number> = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, total: 0 };
  for (const s of stats) {
    const key = keyMap[s.stat.name];
    if (key) out[key] = s.base_stat;
  }
  out.total = out.hp + out.atk + out.def + out.spa + out.spd + out.spe;
  return out;
}

function toTitleCase(s: string): string {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export async function seedSpecies(
  supabase: SupabaseClient<Database>,
  { startId = 1, endId = 1025, concurrency = 20 } = {}
) {
  const results = { species: 0, forms: 0, errors: 0 };

  const speciesPaths = Array.from(
    { length: endId - startId + 1 },
    (_, i) => `/pokemon-species/${startId + i}`
  );

  console.log(`Fetching species ${startId}–${endId}…`);
  const allSpecies = await batchFetch<PokeAPISpecies>(
    speciesPaths,
    concurrency,
    (done, total) => console.log(`  species ${done}/${total}`)
  );

  for (const species of allSpecies) {
    const englishName =
      species.names.find((n) => n.language.name === "en")?.name ?? toTitleCase(species.name);

    const { error: speciesErr } = await supabase.from("pokemon_species").upsert(
      {
        id: species.id,
        name: species.name,
        display_name: englishName,
        generation: GEN_MAP[species.generation.name] ?? 1,
        evolution_chain_id: extractIdFromUrl(species.evolution_chain.url),
        is_legendary: species.is_legendary,
        is_mythical: species.is_mythical,
        is_baby: species.is_baby,
        color: species.color?.name ?? null,
        shape: species.shape?.name ?? null,
      },
      { onConflict: "id" }
    );
    if (speciesErr) {
      results.errors++;
      console.error(`species ${species.id}:`, speciesErr.message);
      continue;
    }
    results.species++;

    // Fetch every variety (default + all alternate forms)
    const formPaths = species.varieties.map((v) => `/pokemon/${extractIdFromUrl(v.pokemon.url)}`);
    const pokemonList = await batchFetch<PokeAPIPokemon>(formPaths, 10);

    for (const poke of pokemonList) {
      const variety = species.varieties.find((v) => v.pokemon.name === poke.name);
      const isDefault = variety?.is_default ?? poke.is_default;
      const category = classifyForm(poke.name, species.name, isDefault);

      const { error: formErr } = await supabase.from("pokemon_forms").upsert(
        {
          id: poke.id,
          species_id: species.id,
          name: poke.name,
          display_name: isDefault ? englishName : toTitleCase(poke.name),
          form_category: category,
          is_default: isDefault,
          counts_for_completion: countsForCompletion(category),
          types: poke.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
          base_stats: extractStats(poke.stats),
          abilities: poke.abilities.map((a) => ({ name: a.ability.name, is_hidden: a.is_hidden })),
          sprite_default: poke.sprites.front_default ?? null,
          sprite_shiny: poke.sprites.front_shiny ?? null,
          artwork_url: poke.sprites.other["official-artwork"]?.front_default ?? null,
          height: poke.height,
          weight: poke.weight,
          gender_rate: null,
        },
        { onConflict: "id" }
      );
      if (formErr) { results.errors++; console.error(`form ${poke.id}:`, formErr.message); }
      else results.forms++;
    }
  }

  return results;
}
