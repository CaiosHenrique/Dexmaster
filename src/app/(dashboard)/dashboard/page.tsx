"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/TopBar";
import { TypeBadge, type PokemonType } from "@/components/ui-custom/TypeBadge";
import { cn } from "@/lib/utils";
import type { DexName } from "@/lib/dex-constants";

// ── Game registry ─────────────────────────────────────────────────────────────

interface GameEntry {
  label: string;
  sublabel?: string;
  dex: DexName;
  color: string;
  generation: number;
}

const GAMES: GameEntry[] = [
  { label: "Scarlet & Violet", dex: "paldea",          color: "#DC2626", generation: 9 },
  { label: "Teal Mask",        sublabel: "DLC", dex: "kitakami",        color: "#D97706", generation: 9 },
  { label: "Indigo Disk",      sublabel: "DLC", dex: "blueberry",       color: "#A855F7", generation: 9 },
  { label: "Legends: Arceus",  dex: "hisui",            color: "#EAB308", generation: 8 },
  { label: "Sword & Shield",   dex: "galar",            color: "#06B6D4", generation: 8 },
  { label: "Isle of Armor",    sublabel: "DLC", dex: "isle-of-armor",   color: "#10B981", generation: 8 },
  { label: "Crown Tundra",     sublabel: "DLC", dex: "crown-tundra",    color: "#60A5FA", generation: 8 },
  { label: "BDSP",             dex: "extended-sinnoh",  color: "#8B5CF6", generation: 4 },
  { label: "USUM",             dex: "updated-alola",    color: "#F97316", generation: 7 },
  { label: "X & Y",            dex: "kalos-central",    color: "#EC4899", generation: 6 },
  { label: "BW2",              dex: "updated-unova",    color: "#94A3B8", generation: 5 },
  { label: "ORAS",             dex: "updated-hoenn",    color: "#3B82F6", generation: 3 },
  { label: "HGSS",             dex: "updated-johto",    color: "#F59E0B", generation: 2 },
  { label: "FRLG",             dex: "kanto",            color: "#EF4444", generation: 1 },
  { label: "National",         dex: "national",         color: "#7C3AED", generation: 0 },
];

const STORAGE_KEY = "dex.gg:selectedGame";
const DEFAULT_GAME = GAMES[0];

// ── Types ─────────────────────────────────────────────────────────────────────

interface DexStats {
  total: number;
  owned: number;
  topMissing: { displayName: string; spriteUrl: string | null }[];
}

interface NotableCatch {
  formId: number;
  displayName: string;
  spriteUrl: string | null;
  types: string[];
  isShiny: boolean;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadDexStats(dexName: string): Promise<DexStats> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, owned: 0, topMissing: [] };

  const { data: dexRow } = await supabase
    .from("pokedexes")
    .select("id")
    .eq("name", dexName)
    .maybeSingle();

  if (!dexRow) return { total: 0, owned: 0, topMissing: [] };

  const { data: rawEntries } = await supabase
    .from("dex_entries")
    .select(
      `dex_number,
       pokemon_species (
         display_name,
         pokemon_forms ( id, sprite_default, is_default )
       )`
    )
    .eq("dex_id", dexRow.id)
    .order("dex_number");

  type RawForm = { id: number; sprite_default: string | null; is_default: boolean };
  type RawSpecies = { display_name: string; pokemon_forms: RawForm[] };

  const formEntries: { formId: number; displayName: string; spriteUrl: string | null }[] = [];
  for (const row of rawEntries ?? []) {
    const species = row.pokemon_species as unknown as RawSpecies | null;
    if (!species) continue;
    const def = species.pokemon_forms.find((f) => f.is_default);
    if (!def) continue;
    formEntries.push({
      formId: def.id,
      displayName: species.display_name,
      spriteUrl: def.sprite_default,
    });
  }

  if (formEntries.length === 0) return { total: 0, owned: 0, topMissing: [] };

  const formIds = formEntries.map((e) => e.formId);
  const { data: ownedRows } = await supabase
    .from("ownerships")
    .select("form_id")
    .eq("user_id", user.id)
    .eq("is_shiny", false)
    .eq("is_alpha", false)
    .eq("is_gigantamax", false)
    .in("form_id", formIds);

  const ownedSet = new Set((ownedRows ?? []).map((o) => o.form_id));
  const ownedCount = formEntries.filter((e) => ownedSet.has(e.formId)).length;
  const topMissing = formEntries
    .filter((e) => !ownedSet.has(e.formId))
    .slice(0, 6)
    .map((e) => ({ displayName: e.displayName, spriteUrl: e.spriteUrl }));

  return { total: formEntries.length, owned: ownedCount, topMissing };
}

async function loadNotableCatches(limit = 8): Promise<NotableCatch[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("ownerships")
    .select(
      `id, form_id, is_shiny,
       pokemon_forms (
         id, sprite_default, sprite_shiny, types,
         pokemon_species ( display_name )
       )`
    )
    .eq("user_id", user.id)
    .eq("is_alpha", false)
    .eq("is_gigantamax", false)
    .order("id", { ascending: false })
    .limit(limit);

  type RawSpecies = { display_name: string };
  type RawForm = { id: number; sprite_default: string | null; sprite_shiny: string | null; types: string[]; pokemon_species: RawSpecies | null };

  const catches: NotableCatch[] = [];
  for (const row of data ?? []) {
    const form = row.pokemon_forms as unknown as RawForm | null;
    if (!form?.pokemon_species) continue;
    catches.push({
      formId: form.id,
      displayName: form.pokemon_species.display_name,
      spriteUrl: row.is_shiny ? (form.sprite_shiny ?? form.sprite_default) : form.sprite_default,
      types: form.types ?? [],
      isShiny: row.is_shiny,
    });
  }
  return catches;
}

async function loadTotalOwned(): Promise<number> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("ownerships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_shiny", false)
    .eq("is_alpha", false)
    .eq("is_gigantamax", false);
  return count ?? 0;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [selectedGame, setSelectedGame] = useState<GameEntry>(DEFAULT_GAME);
  const [stats, setStats] = useState<DexStats | null>(null);
  const [catches, setCatches] = useState<NotableCatch[]>([]);
  const [totalOwned, setTotalOwned] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Restore selected game from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = GAMES.find((g) => g.dex === stored);
      if (found) setSelectedGame(found);
    }
    loadTotalOwned().then(setTotalOwned);
    loadNotableCatches().then(setCatches);
  }, []);

  // Reload dex stats whenever selected game changes
  const selectGame = useCallback((game: GameEntry) => {
    setSelectedGame(game);
    localStorage.setItem(STORAGE_KEY, game.dex);
    setStats(null);
    setStatsLoading(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    loadDexStats(selectedGame.dex).then((s) => {
      if (!cancelled) { setStats(s); setStatsLoading(false); }
    });
    return () => { cancelled = true; };
  }, [selectedGame]);

  const pct = stats && stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar title="Trainer Hub" />

      <div className="scrollbar-dex flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6 space-y-6">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-pixel text-[8px] tracking-widest text-dex-accent">TRAINER JOURNAL</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground">My Collection</h1>
            </div>
            {totalOwned !== null && (
              <div className="text-right">
                <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/50">TOTAL OWNED</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-dex-owned">{totalOwned}</p>
              </div>
            )}
          </div>

          {/* ── Game Selector ───────────────────────────────────────────────── */}
          <div>
            <p className="mb-2.5 font-pixel text-[7px] tracking-wider text-muted-foreground/40">SELECT GAME</p>
            <div className="no-select scrollbar-dex -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {GAMES.map((game) => {
                const active = selectedGame.dex === game.dex;
                return (
                  <button
                    key={game.dex}
                    onClick={() => selectGame(game)}
                    className={cn(
                      "flex shrink-0 flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200",
                      active
                        ? "border-transparent text-foreground"
                        : "border-white/6 bg-dex-surface text-muted-foreground/60 hover:border-white/10 hover:bg-dex-elevated hover:text-muted-foreground/90"
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: `${game.color}20`,
                            borderColor: `${game.color}50`,
                            boxShadow: `0 0 12px ${game.color}25`,
                          }
                        : undefined
                    }
                  >
                    <span className="whitespace-nowrap text-xs font-medium leading-tight">
                      {game.label}
                    </span>
                    {game.sublabel && (
                      <span className="mt-0.5 font-pixel text-[7px] tracking-wider"
                        style={{ color: active ? game.color : undefined }}>
                        {game.sublabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Progress Card ───────────────────────────────────────────────── */}
          <div
            className="rounded-2xl border p-5 transition-all duration-300"
            style={{
              borderColor: `${selectedGame.color}30`,
              backgroundColor: `${selectedGame.color}08`,
            }}
          >
            <div className="mb-1 flex items-start justify-between gap-4">
              <div>
                <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/50">
                  {selectedGame.label.toUpperCase()} DEX
                </p>
                <div className="mt-1 flex items-end gap-2">
                  {statsLoading ? (
                    <div className="h-9 w-24 animate-shimmer rounded-lg bg-dex-elevated" />
                  ) : (
                    <p className="text-3xl font-bold tabular-nums text-foreground">
                      {stats?.owned ?? 0}
                      <span className="ml-1.5 text-base font-normal text-muted-foreground/40">
                        / {stats?.total ?? "—"}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              {!statsLoading && stats && stats.total > 0 && (
                <span
                  className="font-pixel text-[10px] font-bold"
                  style={{ color: selectedGame.color }}
                >
                  {pct}%
                </span>
              )}
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-dex-elevated">
              {!statsLoading && stats && stats.total > 0 && (
                <div
                  className="h-full rounded-full animate-progress-fill transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: selectedGame.color,
                    boxShadow: `0 0 8px ${selectedGame.color}60`,
                  }}
                />
              )}
            </div>

            {!statsLoading && stats && (
              <p className="mt-2.5 text-[11px] text-muted-foreground/40">
                {stats.total === 0
                  ? "Dex not yet seeded — run the seed script to populate."
                  : stats.owned === stats.total
                  ? "🎉 Dex complete!"
                  : `${stats.total - stats.owned} Pokémon remaining in ${selectedGame.label}`}
              </p>
            )}
          </div>

          {/* ── Missing Pokémon ─────────────────────────────────────────────── */}
          {!statsLoading && stats && stats.topMissing.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/40">
                  STILL HUNTING
                </p>
                <Link
                  href={`/pokedex?dex=${selectedGame.dex}&status=missing`}
                  className="text-[11px] text-dex-accent transition-colors hover:underline"
                >
                  View all →
                </Link>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {stats.topMissing.map((p, i) => (
                  <MissingChip key={i} displayName={p.displayName} spriteUrl={p.spriteUrl} />
                ))}
              </div>
            </div>
          )}

          {/* ── Notable Catches ─────────────────────────────────────────────── */}
          {catches.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/40">
                  RECENT CATCHES
                </p>
                <Link
                  href="/collection"
                  className="text-[11px] text-dex-accent transition-colors hover:underline"
                >
                  View collection →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {catches.slice(0, 4).map((c) => (
                  <CatchCard key={`${c.formId}-${c.isShiny}`} catch_={c} />
                ))}
              </div>
            </div>
          )}

          {/* ── Empty state (no catches yet) ──────────────────────────────── */}
          {catches.length === 0 && totalOwned === 0 && (
            <div className="rounded-2xl border border-white/6 bg-dex-surface/50 px-6 py-10 text-center">
              <p className="font-pixel text-[8px] tracking-wider text-dex-accent">BEGIN YOUR JOURNEY</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Mark your first Pokémon as owned from the Pokédex grid.
              </p>
              <Link
                href="/pokedex"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-dex-accent/15 px-4 py-2 text-sm font-medium text-dex-accent ring-1 ring-dex-accent/30 transition-all hover:bg-dex-accent/20"
              >
                Open Pokédex →
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MissingChip({
  displayName,
  spriteUrl,
}: {
  displayName: string;
  spriteUrl: string | null;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/6 bg-dex-surface px-3 py-2">
      {spriteUrl ? (
        <Image
          src={spriteUrl}
          alt={displayName}
          width={28}
          height={28}
          className="object-contain opacity-40"
          style={{ imageRendering: "pixelated", filter: "grayscale(0.8) brightness(0.5)" }}
          unoptimized
        />
      ) : (
        <div className="h-7 w-7 rounded-full bg-dex-elevated opacity-40" />
      )}
      <span className="whitespace-nowrap text-[11px] text-muted-foreground/60">{displayName}</span>
    </div>
  );
}

function CatchCard({ catch_: c }: { catch_: NotableCatch }) {
  const [imgError, setImgError] = useState(false);
  const primaryType = c.types[0] as PokemonType | undefined;

  return (
    <Link href="#" className="group block">
      <div
        className={cn(
          "relative flex flex-col items-center gap-2 rounded-xl border border-dex-owned/20 p-3",
          "bg-dex-surface transition-all duration-200",
          "hover:border-dex-owned/40 hover:bg-dex-elevated"
        )}
      >
        {/* Sprite */}
        <div className="relative flex h-16 w-16 items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_var(--dex-owned-glow)]">
          {c.spriteUrl && !imgError ? (
            <Image
              src={c.spriteUrl}
              alt={c.displayName}
              width={64}
              height={64}
              className="object-contain"
              style={{ imageRendering: "pixelated" }}
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-dex-elevated" />
          )}
        </div>

        <span className="text-center text-[11px] font-medium leading-tight text-foreground">
          {c.displayName}
        </span>

        {primaryType && (
          <TypeBadge type={primaryType} size="xs" />
        )}

        {/* Shiny indicator */}
        {c.isShiny && (
          <div className="absolute right-1.5 top-1.5 text-[10px]">✨</div>
        )}

        {/* Owned dot */}
        <div className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-dex-owned" />
      </div>
    </Link>
  );
}
