"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/TopBar";
import { TypeBadge, type PokemonType } from "@/components/ui-custom/TypeBadge";
import { cn } from "@/lib/utils";
import { Sparkles, Check, ArrowUpRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OwnedEntry {
  ownershipId: number;
  formId: number;
  speciesName: string;
  displayName: string;
  spriteUrl: string | null;
  types: string[];
  isShiny: boolean;
  dexNumber: number;
}

type SortOption = "recent" | "dex" | "name";

// ── Type → accent color ───────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  normal: "#9CA3AF", fire: "#F97316", water: "#3B82F6", electric: "#EAB308",
  grass: "#22C55E", ice: "#67E8F9", fighting: "#DC2626", poison: "#A855F7",
  ground: "#D97706", flying: "#818CF8", psychic: "#EC4899", bug: "#84CC16",
  rock: "#78716C", ghost: "#6D28D9", dragon: "#4F46E5", dark: "#475569",
  steel: "#94A3B8", fairy: "#F9A8D4",
};

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadCollection(): Promise<OwnedEntry[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("ownerships")
    .select(
      `id, form_id, is_shiny,
       pokemon_forms (
         id, sprite_default, sprite_shiny, types,
         pokemon_species ( id, name, display_name )
       )`
    )
    .eq("user_id", user.id)
    .eq("is_alpha", false)
    .eq("is_gigantamax", false)
    .order("id", { ascending: false });

  const entries: OwnedEntry[] = [];
  for (const row of data ?? []) {
    const form = row.pokemon_forms as unknown as {
      id: number;
      sprite_default: string | null;
      sprite_shiny: string | null;
      types: string[];
      pokemon_species: { id: number; name: string; display_name: string } | null;
    } | null;
    if (!form?.pokemon_species) continue;
    entries.push({
      ownershipId: row.id as unknown as number,
      formId: form.id,
      speciesName: form.pokemon_species.name,
      displayName: form.pokemon_species.display_name,
      spriteUrl: row.is_shiny
        ? (form.sprite_shiny ?? form.sprite_default)
        : form.sprite_default,
      types: form.types ?? [],
      isShiny: row.is_shiny,
      dexNumber: form.pokemon_species.id,
    });
  }
  return entries;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CollectionPage() {
  const [entries, setEntries] = useState<OwnedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [shinyFilter, setShinyFilter] = useState<"all" | "shiny" | "normal">("all");
  const [sort, setSort] = useState<SortOption>("recent");

  useEffect(() => {
    loadCollection().then((e) => {
      setEntries(e);
      setLoading(false);
    });
  }, []);

  // Top 3 highlights: shinies first (most recent), then regulars
  const highlights = useMemo(() => {
    const shinies = entries.filter((e) => e.isShiny);
    const regular = entries.filter((e) => !e.isShiny);
    return [...shinies, ...regular].slice(0, 3);
  }, [entries]);

  const sorted = useMemo(() => {
    const copy = [...entries];
    if (sort === "dex") copy.sort((a, b) => a.dexNumber - b.dexNumber);
    else if (sort === "name") copy.sort((a, b) => a.displayName.localeCompare(b.displayName));
    // "recent" is already ordered from the query (id DESC)
    return copy;
  }, [entries, sort]);

  const filtered = useMemo(() => {
    return sorted.filter((e) => {
      if (search.trim() && !e.displayName.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (shinyFilter === "shiny" && !e.isShiny) return false;
      if (shinyFilter === "normal" && e.isShiny) return false;
      return true;
    });
  }, [sorted, search, shinyFilter]);

  const shinyCount = useMemo(() => entries.filter((e) => e.isShiny).length, [entries]);
  const isFiltering = search.trim() !== "" || shinyFilter !== "all";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar
        title="Trophy Room"
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="scrollbar-dex flex-1 overflow-y-auto">
        <div className="space-y-6 px-6 py-4">

          {/* ── Stats + Controls ─────────────────────────────────────────── */}
          {!loading && entries.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/6 bg-dex-surface px-4 py-2.5">
                <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/50">OWNED</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-dex-owned">{entries.length}</p>
              </div>
              {shinyCount > 0 && (
                <div className="rounded-xl border border-white/6 bg-dex-surface px-4 py-2.5">
                  <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/50">SHINY</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-yellow-400" />
                    <p className="text-lg font-bold tabular-nums text-yellow-400">{shinyCount}</p>
                  </div>
                </div>
              )}

              <div className="ml-auto flex flex-wrap items-center gap-2">
                {/* Shiny filter */}
                <div className="flex items-center gap-1 rounded-xl border border-white/6 bg-dex-surface p-1">
                  {(["all", "normal", "shiny"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setShinyFilter(v)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[11px] font-medium capitalize transition-all",
                        shinyFilter === v
                          ? "bg-dex-elevated text-foreground"
                          : "text-muted-foreground/50 hover:text-muted-foreground/80"
                      )}
                    >
                      {v === "shiny" ? "✨ Shiny" : v === "normal" ? "Normal" : "All"}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-1 rounded-xl border border-white/6 bg-dex-surface p-1">
                  {(["recent", "dex", "name"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setSort(v)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all",
                        sort === v
                          ? "bg-dex-elevated text-foreground"
                          : "text-muted-foreground/50 hover:text-muted-foreground/80"
                      )}
                    >
                      {v === "recent" ? "Recent" : v === "dex" ? "Dex #" : "Name"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <LoadingState />
          ) : entries.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* ── Featured Highlights ──────────────────────────────────── */}
              {!isFiltering && highlights.length > 0 && (
                <section>
                  <p className="mb-3 font-pixel text-[7px] tracking-wider text-muted-foreground/40">
                    FEATURED
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {highlights.map((entry) => (
                      <HighlightCard key={`${entry.formId}-${entry.isShiny}`} entry={entry} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── All captured ─────────────────────────────────────────── */}
              <section>
                {!isFiltering && (
                  <p className="mb-3 font-pixel text-[7px] tracking-wider text-muted-foreground/40">
                    ALL CAPTURED
                  </p>
                )}

                {filtered.length === 0 ? (
                  <NoResults onClear={() => { setSearch(""); setShinyFilter("all"); }} />
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2 pb-6">
                    {filtered.map((entry) => (
                      <CollectionCard key={`${entry.formId}-${entry.isShiny}`} entry={entry} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HighlightCard({ entry }: { entry: OwnedEntry }) {
  const [imgError, setImgError] = useState(false);
  const accentColor = entry.isShiny
    ? "#EAB308"
    : (TYPE_COLORS[entry.types[0]?.toLowerCase() ?? ""] ?? "#9CA3AF");
  const dexNumber = `#${String(entry.dexNumber).padStart(4, "0")}`;

  return (
    <Link href={`/pokemon/${entry.speciesName}`} className="group block">
      <div
        className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02]"
        style={{
          borderColor: `${accentColor}35`,
          backgroundColor: `${accentColor}08`,
          boxShadow: entry.isShiny
            ? `0 0 24px ${accentColor}18`
            : `0 0 16px ${accentColor}10`,
        }}
      >
        {entry.isShiny && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/5 via-transparent to-amber-300/5" />
        )}

        <span className="self-start font-pixel text-[7px] text-muted-foreground/40">
          {dexNumber}
        </span>

        <div
          className="flex h-24 w-24 items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{
            filter: entry.isShiny
              ? `drop-shadow(0 0 14px ${accentColor}70)`
              : `drop-shadow(0 0 8px ${accentColor}40)`,
          }}
        >
          {entry.spriteUrl && !imgError ? (
            <Image
              src={entry.spriteUrl}
              alt={entry.displayName}
              width={96}
              height={96}
              className="object-contain"
              style={{ imageRendering: "pixelated" }}
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dex-elevated ring-1 ring-white/5">
              <svg width="30" height="30" viewBox="0 0 28 28" fill="none" className="text-muted-foreground/20">
                <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2" />
                <path d="M2 14h24M10 14a4 4 0 0 1 8 0 4 4 0 0 1-8 0Z" stroke="currentColor" strokeWidth="2" />
                <circle cx="14" cy="14" r="2" fill="currentColor" />
              </svg>
            </div>
          )}
        </div>

        <span className="text-center text-sm font-semibold leading-tight text-foreground">
          {entry.displayName}
        </span>

        <div className="flex gap-1">
          {entry.types.slice(0, 2).map((t) => (
            <TypeBadge key={t} type={t as PokemonType} size="xs" />
          ))}
        </div>

        {entry.isShiny && (
          <div
            className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full px-2 py-0.5 font-pixel text-[8px]"
            style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
          >
            <Sparkles size={8} />
            SHINY
          </div>
        )}

        <div className="absolute bottom-2.5 right-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <ArrowUpRight size={13} className="text-muted-foreground/30" />
        </div>
      </div>
    </Link>
  );
}

function CollectionCard({ entry }: { entry: OwnedEntry }) {
  const [imgError, setImgError] = useState(false);
  const dexNumber = `#${String(entry.dexNumber).padStart(4, "0")}`;

  return (
    <Link href={`/pokemon/${entry.speciesName}`} className="group block">
      <div
        className={cn(
          "relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200",
          entry.isShiny
            ? "border-yellow-400/25 bg-dex-surface hover:border-yellow-400/40 hover:bg-dex-elevated"
            : "border-dex-owned/25 bg-dex-surface hover:border-dex-owned/40 hover:bg-dex-elevated"
        )}
        style={entry.isShiny ? { boxShadow: "0 0 8px rgba(234,179,8,0.08)" } : undefined}
      >
        <span className="self-start font-pixel text-[7px] text-muted-foreground/50">
          {dexNumber}
        </span>

        <div
          className={cn(
            "relative flex h-16 w-16 items-center justify-center transition-transform duration-300 group-hover:scale-110",
            entry.isShiny
              ? "group-hover:drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]"
              : "group-hover:drop-shadow-[0_0_10px_var(--dex-owned-glow)]"
          )}
        >
          {entry.spriteUrl && !imgError ? (
            <Image
              src={entry.spriteUrl}
              alt={entry.displayName}
              width={64}
              height={64}
              className="object-contain"
              style={{ imageRendering: "pixelated" }}
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dex-elevated ring-1 ring-white/5">
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none" className="text-muted-foreground/20">
                <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2" />
                <path d="M2 14h24M10 14a4 4 0 0 1 8 0 4 4 0 0 1-8 0Z" stroke="currentColor" strokeWidth="2" />
                <circle cx="14" cy="14" r="2" fill="currentColor" />
              </svg>
            </div>
          )}
        </div>

        <span className="text-center text-[11px] font-medium leading-tight text-foreground">
          {entry.displayName}
        </span>

        <div className="flex flex-wrap justify-center gap-1">
          {entry.types.length > 0 ? (
            entry.types.slice(0, 2).map((t) => (
              <TypeBadge key={t} type={t as PokemonType} size="xs" />
            ))
          ) : (
            <div className="h-3.5 w-10 rounded bg-dex-elevated/50" />
          )}
        </div>

        <div
          className={cn(
            "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full",
            entry.isShiny
              ? "bg-yellow-400/20 ring-1 ring-yellow-400/30"
              : "bg-dex-owned/20 ring-1 ring-dex-owned/30"
          )}
        >
          {entry.isShiny ? (
            <Sparkles size={9} className="text-yellow-400" />
          ) : (
            <Check size={10} className="text-dex-owned" strokeWidth={3} />
          )}
        </div>

        {entry.isShiny && (
          <div className="absolute left-1.5 top-1.5">
            <Sparkles size={10} className="text-yellow-400/70" />
          </div>
        )}
      </div>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[220px] animate-shimmer rounded-2xl border border-white/5 bg-dex-surface"
          />
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="h-[152px] animate-shimmer rounded-xl border border-white/5 bg-dex-surface"
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-dex-elevated ring-1 ring-white/6">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-muted-foreground/20">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
          <path d="M2 20h36M14 20a6 6 0 0 1 12 0 6 6 0 0 1-12 0Z" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="20" cy="20" r="3" fill="currentColor" />
        </svg>
      </div>
      <div className="space-y-1.5">
        <p className="font-pixel text-[8px] tracking-wider text-dex-accent">TROPHY ROOM EMPTY</p>
        <p className="text-sm text-muted-foreground">Start your collection from the Pokédex grid.</p>
        <Link
          href="/pokedex"
          className="mt-2 inline-block text-xs text-dex-accent transition-colors hover:underline"
        >
          Go to Pokédex →
        </Link>
      </div>
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="font-pixel text-[8px] tracking-wider text-muted-foreground/40">NO RESULTS</p>
      <p className="text-sm text-muted-foreground">No Pokémon match your filters.</p>
      <button
        onClick={onClear}
        className="mt-1 text-xs text-dex-accent transition-colors hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}
