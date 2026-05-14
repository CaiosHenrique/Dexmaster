"use client";

import { useState, useEffect, useMemo, useTransition, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/TopBar";
import { DexSelector } from "@/components/pokemon/DexSelector";
import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { TypeFilter, type StatusFilter } from "@/components/pokemon/TypeFilter";
import { PokemonCardSkeleton } from "@/components/ui-custom/SkeletonCard";
import { DexProgress } from "@/components/ui-custom/DexProgress";
import { CollectionBar } from "@/components/pokemon/CollectionBar";
import { bulkSetOwnership } from "@/app/actions/ownership";
import {
  DEX_CONFIG_BY_NAME,
  DEFAULT_DEX,
  type DexName,
} from "@/lib/dex-constants";
import type { PokemonType } from "@/components/ui-custom/TypeBadge";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GridEntry {
  dexNumber: number;
  speciesId: number;
  slug: string;
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

  const { data: rawEntries } = await supabase
    .from("dex_entries")
    .select(
      `dex_number,
       pokemon_species (
         id, name, display_name,
         pokemon_forms ( id, sprite_default, types, is_default )
       )`
    )
    .eq("dex_id", dexRow.id)
    .order("dex_number");

  const entries: GridEntry[] = [];
  for (const row of rawEntries ?? []) {
    const species = row.pokemon_species as unknown as {
      id: number;
      name: string;
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
      slug: species.name,
      displayName: species.display_name,
      formId: defaultForm.id,
      types: defaultForm.types ?? [],
      spriteUrl: defaultForm.sprite_default ?? null,
    });
  }

  const ownedSet = new Set<number>();
  const { data: { user } } = await supabase.auth.getUser();
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<PokemonType | null>(null);
  const [collectionMode, setCollectionMode] = useState(false);
  const [queued, setQueued] = useState<Set<number>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  // Drag-paint state
  const [isDragging, setIsDragging] = useState(false);
  const [dragAddMode, setDragAddMode] = useState<"add" | "remove">("add");
  // Shift-click range select
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // Keep stable refs for keyboard handler (avoids stale closure)
  const filteredRef = useRef<GridEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setQueued(new Set());
    setLastClickedIndex(null);

    loadDex(activeDex).then(({ entries: e, ownedFormIds: owned }) => {
      if (cancelled) return;
      setEntries(e);
      setOwnedFormIds(owned);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [activeDex]);

  // End drag on global mouseup (handles releasing outside grid)
  useEffect(() => {
    if (!isDragging) return;
    const onUp = () => setIsDragging(false);
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [isDragging]);

  const filtered = useMemo(() => {
    let list = entries;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.displayName.toLowerCase().includes(q) ||
          String(e.dexNumber).padStart(4, "0").includes(q)
      );
    }

    if (statusFilter === "owned") {
      list = list.filter((e) => ownedFormIds.has(e.formId));
    } else if (statusFilter === "missing") {
      list = list.filter((e) => !ownedFormIds.has(e.formId));
    }

    if (typeFilter) {
      list = list.filter((e) => e.types.includes(typeFilter));
    }

    filteredRef.current = list;
    return list;
  }, [entries, search, statusFilter, typeFilter, ownedFormIds]);

  const ownedCount = useMemo(
    () => entries.filter((e) => ownedFormIds.has(e.formId)).length,
    [entries, ownedFormIds]
  );

  const filterCounts = useMemo(
    () => ({
      all: entries.length,
      owned: ownedCount,
      missing: entries.length - ownedCount,
    }),
    [entries.length, ownedCount]
  );

  // How many queued are already owned (for bar's remove action)
  const ownedInSelection = useMemo(
    () => Array.from(queued).filter((id) => ownedFormIds.has(id)).length,
    [queued, ownedFormIds]
  );

  // ── Keyboard shortcuts (only when collection mode is on) ────────────────────
  useEffect(() => {
    if (!collectionMode) return;

    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Escape") {
        setCollectionMode(false);
        setQueued(new Set());
        setIsDragging(false);
        setLastClickedIndex(null);
      } else if ((e.key === "a" || e.key === "A") && !e.ctrlKey && !e.metaKey) {
        setQueued(new Set(filteredRef.current.map((entry) => entry.formId)));
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collectionMode]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  // Single-card toggle outside collection mode
  function handleToggle(formId: number, nowOwned: boolean) {
    setOwnedFormIds((prev) => {
      const next = new Set(prev);
      if (nowOwned) next.add(formId);
      else next.delete(formId);
      return next;
    });
    // Use bulkSetOwnership(1 id) — upsert/delete with no prior read
    startTransition(() => { bulkSetOwnership([formId], nowOwned); });
  }

  // Card mousedown in collection mode: shift-range or drag-paint start
  function handleCardMouseDown(formId: number, index: number, shiftKey: boolean) {
    if (shiftKey && lastClickedIndex !== null) {
      // Range select: add all between lastClickedIndex and index
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const rangeIds = filteredRef.current.slice(start, end + 1).map((e) => e.formId);
      setQueued((prev) => {
        const next = new Set(prev);
        rangeIds.forEach((id) => next.add(id));
        return next;
      });
      return;
    }

    // Drag-paint: toggle first card and remember mode (add or remove)
    const wasQueued = queued.has(formId);
    setDragAddMode(wasQueued ? "remove" : "add");
    setIsDragging(true);
    setQueued((prev) => {
      const next = new Set(prev);
      if (wasQueued) next.delete(formId);
      else next.add(formId);
      return next;
    });
    setLastClickedIndex(index);
  }

  // Card mouseenter in collection mode: continue drag-paint
  function handleCardMouseEnter(formId: number, _index: number) {
    if (!isDragging) return;
    setQueued((prev) => {
      // Skip if already in correct state (avoids unnecessary re-renders)
      const alreadyCorrect =
        (dragAddMode === "add" && prev.has(formId)) ||
        (dragAddMode === "remove" && !prev.has(formId));
      if (alreadyCorrect) return prev;
      const next = new Set(prev);
      if (dragAddMode === "add") next.add(formId);
      else next.delete(formId);
      return next;
    });
  }

  // Apply queued selection: mark owned or remove from collection
  async function applyCollection(markOwned: boolean) {
    if (isApplying) return;
    const ids = markOwned
      ? Array.from(queued).filter((id) => !ownedFormIds.has(id))
      : Array.from(queued).filter((id) => ownedFormIds.has(id));
    if (ids.length === 0) {
      setQueued(new Set());
      return;
    }
    setIsApplying(true);
    setOwnedFormIds((prev) => {
      const next = new Set(prev);
      if (markOwned) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });
    setQueued(new Set()); // clear queue but stay in collection mode
    await bulkSetOwnership(ids, markOwned);
    setIsApplying(false);
  }

  function exitCollectionMode() {
    setCollectionMode(false);
    setQueued(new Set());
    setIsDragging(false);
    setLastClickedIndex(null);
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
          if (collectionMode) exitCollectionMode();
          else setCollectionMode(true);
        }}
      />

      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-6 py-4">
        <DexSelector activeDex={activeDex} />

        {!isEmpty && !loading && (
          <>
            <div className="rounded-xl border border-white/6 bg-dex-surface px-5 py-3">
              <DexProgress
                owned={ownedCount}
                total={entries.length}
                label={`${dexConfig.shortName} Dex`}
              />
            </div>

            <TypeFilter
              status={statusFilter}
              type={typeFilter}
              onStatusChange={setStatusFilter}
              onTypeChange={setTypeFilter}
              counts={filterCounts}
            />
          </>
        )}

        {loading ? (
          <SkeletonGrid />
        ) : isEmpty ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <NoResults
            onClear={() => {
              setSearch("");
              setStatusFilter("all");
              setTypeFilter(null);
            }}
          />
        ) : (
          <div className="scrollbar-dex flex-1 overflow-y-auto">
            <div
              className={cn(
                "grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2 pb-6",
                isDragging && "no-select"
              )}
            >
              {filtered.map((entry, i) => (
                <PokemonCard
                  key={entry.formId}
                  index={i}
                  pokemon={{
                    id: entry.dexNumber,
                    formId: entry.formId,
                    slug: entry.slug,
                    displayName: entry.displayName,
                    spriteUrl: entry.spriteUrl,
                    types: entry.types,
                    isOwned: ownedFormIds.has(entry.formId),
                  }}
                  collectionMode={collectionMode}
                  isQueued={queued.has(entry.formId)}
                  onToggleOwned={collectionMode ? undefined : handleToggle}
                  onCardMouseDown={collectionMode ? handleCardMouseDown : undefined}
                  onCardMouseEnter={collectionMode ? handleCardMouseEnter : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating collection bar — rendered outside scroll container */}
      <CollectionBar
        visible={collectionMode}
        count={queued.size}
        ownedInSelection={ownedInSelection}
        isApplying={isApplying}
        onMarkOwned={() => applyCollection(true)}
        onUnmark={() => applyCollection(false)}
        onSelectAll={() => setQueued(new Set(filteredRef.current.map((e) => e.formId)))}
        onClear={() => setQueued(new Set())}
        onExit={exitCollectionMode}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2">
        {Array.from({ length: 32 }).map((_, i) => (
          <PokemonCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="font-pixel text-[8px] tracking-wider text-muted-foreground/40">NO RESULTS</p>
      <p className="text-sm text-muted-foreground">No Pokémon match your current filters.</p>
      <button
        onClick={onClear}
        className="mt-1 text-xs text-dex-accent transition-colors hover:underline"
      >
        Clear all filters
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-dex-elevated ring-1 ring-white/6">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-muted-foreground/30">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
          <path d="M2 20h36M14 20a6 6 0 0 1 12 0 6 6 0 0 1-12 0Z" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="20" cy="20" r="3" fill="currentColor" />
        </svg>
      </div>
      <div className="space-y-1.5">
        <p className="font-pixel text-[8px] tracking-wider text-dex-accent">DATABASE EMPTY</p>
        <p className="text-sm text-muted-foreground">Run the seed script to populate Pokémon data.</p>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground/50">
          POST /api/seed {"{ step: 'games' }"} → {"{ step: 'species' }"} → {"{ step: 'pokedexes' }"}
        </p>
      </div>
    </div>
  );
}
