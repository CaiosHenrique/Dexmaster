"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/TopBar";
import { DexSelector } from "@/components/pokemon/DexSelector";
import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { DexProgress } from "@/components/ui-custom/DexProgress";
import { toggleOwnership, bulkSetOwnership } from "@/app/actions/ownership";
import {
  DEX_CONFIG_BY_NAME,
  DEFAULT_DEX,
  type DexName,
} from "@/lib/dex-constants";
import { CheckSquare } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GridEntry {
  dexNumber: number;
  speciesId: number;
  displayName: string;
  formId: number;
  types: string[];
  spriteUrl: string | null;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadDex(dexName: string) {
  const supabase = createClient();

  const { data: dexRow } = await supabase
    .from("pokedexes")
    .select("id")
    .eq("name", dexName)
    .maybeSingle();

  if (!dexRow) return { entries: [], ownedFormIds: new Set<number>() };

  // Fetch dex entries with species + forms via PostgREST embedding
  const { data: rawEntries } = await supabase
    .from("dex_entries")
    .select(
      `dex_number,
       pokemon_species (
         id, display_name,
         pokemon_forms ( id, sprite_default, types, is_default )
       )`
    )
    .eq("dex_id", dexRow.id)
    .order("dex_number");

  const entries: GridEntry[] = [];
  for (const row of rawEntries ?? []) {
    const species = row.pokemon_species as unknown as {
      id: number;
      display_name: string;
      pokemon_forms: Array<{
        id: number;
        sprite_default: string | null;
        types: string[];
        is_default: boolean;
      }>;
    } | null;
    if (!species) continue;
    const defaultForm = species.pokemon_forms.find((f) => f.is_default);
    if (!defaultForm) continue;
    entries.push({
      dexNumber: row.dex_number,
      speciesId: species.id,
      displayName: species.display_name,
      formId: defaultForm.id,
      types: defaultForm.types ?? [],
      spriteUrl: defaultForm.sprite_default ?? null,
    });
  }

  // Fetch current user's ownerships
  const ownedSet = new Set<number>();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: owned } = await supabase
      .from("ownerships")
      .select("form_id")
      .eq("user_id", user.id)
      .eq("is_shiny", false)
      .eq("is_alpha", false)
      .eq("is_gigantamax", false);
    owned?.forEach((o) => ownedSet.add(o.form_id));
  }

  return { entries, ownedFormIds: ownedSet };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PokedexPage() {
  const searchParams = useSearchParams();
  const activeDex = (searchParams.get("dex") ?? DEFAULT_DEX) as DexName;
  const dexConfig = DEX_CONFIG_BY_NAME[activeDex] ?? DEX_CONFIG_BY_NAME[DEFAULT_DEX];

  const [entries, setEntries] = useState<GridEntry[]>([]);
  const [ownedFormIds, setOwnedFormIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [collectionMode, setCollectionMode] = useState(false);
  const [queued, setQueued] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setQueued(new Set());

    loadDex(activeDex).then(({ entries: e, ownedFormIds: owned }) => {
      if (cancelled) return;
      setEntries(e);
      setOwnedFormIds(owned);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeDex]);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.displayName.toLowerCase().includes(q) ||
        String(e.dexNumber).padStart(4, "0").includes(q)
    );
  }, [entries, search]);

  const ownedCount = useMemo(
    () => entries.filter((e) => ownedFormIds.has(e.formId)).length,
    [entries, ownedFormIds]
  );

  function handleToggle(formId: number, nowOwned: boolean) {
    setOwnedFormIds((prev) => {
      const next = new Set(prev);
      if (nowOwned) next.add(formId);
      else next.delete(formId);
      return next;
    });
    startTransition(() => {
      toggleOwnership(formId);
    });
  }

  function handleQueueToggle(formId: number) {
    setQueued((prev) => {
      const next = new Set(prev);
      if (next.has(formId)) next.delete(formId);
      else next.add(formId);
      return next;
    });
  }

  async function applyCollection() {
    const ids = Array.from(queued);
    if (ids.length === 0) return;
    setOwnedFormIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setQueued(new Set());
    setCollectionMode(false);
    await bulkSetOwnership(ids, true);
  }

  const isEmpty = !loading && entries.length === 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar
        title={dexConfig.displayName}
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        collectionMode={collectionMode}
        onToggleCollectionMode={() => {
          setCollectionMode((m) => !m);
          setQueued(new Set());
        }}
      />

      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6 py-5">
        <DexSelector activeDex={activeDex} />

        {!isEmpty && !loading && (
          <div className="rounded-xl border border-white/6 bg-dex-surface px-5 py-3">
            <DexProgress
              owned={ownedCount}
              total={entries.length}
              label={`${dexConfig.shortName} Dex`}
            />
          </div>
        )}

        {collectionMode && queued.size > 0 && (
          <button
            onClick={applyCollection}
            className="flex items-center justify-center gap-2 rounded-lg bg-dex-owned/15 py-2.5 text-sm font-medium text-dex-owned ring-1 ring-dex-owned/30 transition-all hover:bg-dex-owned/20"
          >
            <CheckSquare size={15} />
            Mark {queued.size} Pokémon as Owned
          </button>
        )}

        {loading ? (
          <LoadingState />
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <div className="scrollbar-dex flex-1 overflow-y-auto">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2 pb-6">
              {filtered.map((entry) => (
                <PokemonCard
                  key={entry.formId}
                  pokemon={{
                    id: entry.dexNumber,
                    name: entry.displayName,
                    displayName: entry.displayName,
                    spriteUrl: entry.spriteUrl,
                    types: entry.types,
                    isOwned: ownedFormIds.has(entry.formId),
                  }}
                  collectionMode={collectionMode}
                  isQueued={queued.has(entry.formId)}
                  onToggleOwned={
                    collectionMode
                      ? (id) => handleQueueToggle(id)
                      : handleToggle
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dex-elevated border-t-dex-accent" />
        <span className="font-pixel text-[8px] tracking-wider">LOADING...</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-dex-elevated ring-1 ring-white/6">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          className="text-muted-foreground/30"
        >
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
          <path
            d="M2 20h36M14 20a6 6 0 0 1 12 0 6 6 0 0 1-12 0Z"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <circle cx="20" cy="20" r="3" fill="currentColor" />
        </svg>
      </div>
      <div className="space-y-1.5">
        <p className="font-pixel text-[8px] tracking-wider text-dex-accent">
          DATABASE EMPTY
        </p>
        <p className="text-sm text-muted-foreground">
          Run the seed script to populate Pokémon data.
        </p>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground/50">
          POST /api/seed {"{ step: 'games' }"} → {"{ step: 'species' }"} → {"{ step: 'pokedexes' }"}
        </p>
      </div>
    </div>
  );
}
