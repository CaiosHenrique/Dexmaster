const POKEAPI_BASE = "https://pokeapi.co/api/v2";

export async function fetchPokeAPI<T>(path: string): Promise<T> {
  const url = `${POKEAPI_BASE}${path}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`PokéAPI ${path} → ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// Fires at most `concurrency` requests at a time — avoids hammering PokéAPI
export async function batchFetch<T>(
  paths: string[],
  concurrency = 10,
  onProgress?: (done: number, total: number) => void
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < paths.length; i += concurrency) {
    const batch = paths.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map((p) => fetchPokeAPI<T>(p)));
    for (const s of settled) {
      if (s.status === "fulfilled") results.push(s.value);
      else console.warn("PokéAPI fetch failed:", (s as PromiseRejectedResult).reason);
    }
    onProgress?.(Math.min(i + concurrency, paths.length), paths.length);
  }
  return results;
}

export function extractIdFromUrl(url: string): number {
  return parseInt(url.replace(/\/$/, "").split("/").pop()!, 10);
}

// ── PokéAPI response shapes ───────────────────────────────────────────────────

export interface PokeAPIResource {
  name: string;
  url: string;
}

export interface PokeAPIList {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokeAPIResource[];
}

export interface PokeAPISpecies {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  generation: { name: string };
  evolution_chain: { url: string };
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  color: { name: string } | null;
  shape: { name: string } | null;
  varieties: Array<{ is_default: boolean; pokemon: PokeAPIResource }>;
}

export interface PokeAPIPokemon {
  id: number;
  name: string;
  is_default: boolean;
  height: number;
  weight: number;
  types: Array<{ slot: number; type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  abilities: Array<{ ability: { name: string }; is_hidden: boolean }>;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    other: {
      "official-artwork": {
        front_default: string | null;
      };
    };
  };
}

export interface PokeAPIPokedex {
  id: number;
  name: string;
  pokemon_entries: Array<{
    entry_number: number;
    pokemon_species: PokeAPIResource;
  }>;
}
