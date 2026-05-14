"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { TypeBadge, type PokemonType } from "@/components/ui-custom/TypeBadge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Users, BarChart3, Flame } from "lucide-react";

// ── Mock meta data ─────────────────────────────────────────────────────────────

type Trend = "up" | "down" | "stable";

interface MetaPokemon {
  rank: number;
  name: string;
  types: string[];
  usage: number;
  trend: Trend;
  role: string;
  trendDelta: string;
}

interface TrendingPick {
  name: string;
  types: string[];
  change: string;
  direction: "up" | "down";
}

const TIERS = ["OU", "Ubers", "UU", "RU", "NU"] as const;
type Tier = (typeof TIERS)[number];

const META_DATA: Record<Tier, MetaPokemon[]> = {
  OU: [
    { rank:  1, name: "Great Tusk",    types: ["fighting","ground"],  usage: 34.2, trend: "up",     role: "Hazard Removal",     trendDelta: "+2.1%" },
    { rank:  2, name: "Gholdengo",     types: ["steel","ghost"],      usage: 31.8, trend: "stable", role: "Wallbreaker",        trendDelta: "—" },
    { rank:  3, name: "Dragapult",     types: ["dragon","ghost"],     usage: 28.4, trend: "up",     role: "Speed Control",      trendDelta: "+1.4%" },
    { rank:  4, name: "Iron Moth",     types: ["fire","poison"],      usage: 25.1, trend: "up",     role: "Sweeper",            trendDelta: "+3.2%" },
    { rank:  5, name: "Ting-Lu",       types: ["dark","ground"],      usage: 23.7, trend: "down",   role: "Sp. Def Wall",       trendDelta: "−1.8%" },
    { rank:  6, name: "Kingambit",     types: ["dark","steel"],       usage: 22.3, trend: "stable", role: "Late-Game Cleaner",  trendDelta: "—" },
    { rank:  7, name: "Garganacl",     types: ["rock"],               usage: 21.6, trend: "up",     role: "Stall Core",         trendDelta: "+0.9%" },
    { rank:  8, name: "Volcarona",     types: ["bug","fire"],         usage: 19.4, trend: "stable", role: "Setup Sweeper",      trendDelta: "—" },
    { rank:  9, name: "Iron Bundle",   types: ["ice","water"],        usage: 17.8, trend: "down",   role: "Offensive Pivot",    trendDelta: "−2.3%" },
    { rank: 10, name: "Zamazenta",     types: ["fighting"],           usage: 16.2, trend: "up",     role: "Defensive Pivot",    trendDelta: "+1.1%" },
  ],
  Ubers: [
    { rank:  1, name: "Miraidon",      types: ["electric","dragon"],  usage: 41.3, trend: "up",     role: "Restricted Attacker", trendDelta: "+3.5%" },
    { rank:  2, name: "Koraidon",      types: ["fighting","dragon"],  usage: 38.7, trend: "stable", role: "Restricted Attacker", trendDelta: "—" },
    { rank:  3, name: "Calyrex-Ice",   types: ["psychic","ice"],      usage: 22.1, trend: "down",   role: "Setup Sweeper",       trendDelta: "−2.1%" },
    { rank:  4, name: "Zacian-C",      types: ["fairy","steel"],      usage: 18.9, trend: "stable", role: "Speed Control",       trendDelta: "—" },
    { rank:  5, name: "Yveltal",       types: ["dark","flying"],      usage: 16.3, trend: "up",     role: "Defog + Pivot",       trendDelta: "+1.9%" },
  ],
  UU: [
    { rank:  1, name: "Roaring Moon",  types: ["dragon","dark"],      usage: 28.3, trend: "up",     role: "Setup Sweeper",      trendDelta: "+4.2%" },
    { rank:  2, name: "Palafin-Hero",  types: ["water"],              usage: 24.6, trend: "up",     role: "Wallbreaker",        trendDelta: "+6.1%" },
    { rank:  3, name: "Meowscarada",   types: ["grass","dark"],       usage: 21.2, trend: "stable", role: "Hazard Lead",        trendDelta: "—" },
    { rank:  4, name: "Slowking-G",    types: ["poison","psychic"],   usage: 18.7, trend: "down",   role: "Regenerator Pivot",  trendDelta: "−1.4%" },
    { rank:  5, name: "Cobalion",      types: ["steel","fighting"],   usage: 16.4, trend: "stable", role: "Hazard Setter",      trendDelta: "—" },
  ],
  RU: [
    { rank:  1, name: "Typhlosion-H",  types: ["fire","ghost"],       usage: 22.4, trend: "up",     role: "Sweeper",            trendDelta: "+3.1%" },
    { rank:  2, name: "Scizor",        types: ["bug","steel"],        usage: 20.1, trend: "stable", role: "Wallbreaker",        trendDelta: "—" },
    { rank:  3, name: "Mudsdale",      types: ["ground"],             usage: 18.3, trend: "up",     role: "Physical Wall",      trendDelta: "+1.8%" },
  ],
  NU: [
    { rank:  1, name: "Arcanine-H",    types: ["fire","rock"],        usage: 19.8, trend: "up",     role: "Pivot",              trendDelta: "+2.7%" },
    { rank:  2, name: "Decidueye",     types: ["grass","ghost"],      usage: 17.2, trend: "stable", role: "Hazard Lead",        trendDelta: "—" },
    { rank:  3, name: "Feraligatr",    types: ["water"],              usage: 15.6, trend: "up",     role: "DD Sweeper",         trendDelta: "+1.2%" },
  ],
};

const TRENDING: TrendingPick[] = [
  { name: "Flutter Mane",  types: ["ghost","fairy"],    change: "+5.2%", direction: "up"   },
  { name: "Iron Valiant",  types: ["fairy","fighting"], change: "+3.7%", direction: "up"   },
  { name: "Palafin-Hero",  types: ["water"],            change: "+6.1%", direction: "up"   },
  { name: "Roaring Moon",  types: ["dragon","dark"],    change: "+4.2%", direction: "up"   },
  { name: "Calyrex-Ice",   types: ["psychic","ice"],    change: "−2.1%", direction: "down" },
  { name: "Iron Bundle",   types: ["ice","water"],      change: "−2.3%", direction: "down" },
];

const TIER_STATS: Record<Tier, { sample: string; topUsage: string; format: string }> = {
  OU:    { sample: "89.3k", topUsage: "34.2%", format: "Standard OU"   },
  Ubers: { sample: "12.4k", topUsage: "41.3%", format: "Ubers"         },
  UU:    { sample: "34.7k", topUsage: "28.3%", format: "Underused"     },
  RU:    { sample: "18.2k", topUsage: "22.4%", format: "Rarelyused"    },
  NU:    { sample: "11.8k", topUsage: "19.8%", format: "Neverused"     },
};

const RANK_COLORS = ["#EAB308", "#94A3B8", "#CD7F32"] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompetitivePage() {
  const [activeTier, setActiveTier] = useState<Tier>("OU");

  const pokemonList = META_DATA[activeTier];
  const tierStats   = TIER_STATS[activeTier];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar title="Competitive" />

      <div className="scrollbar-dex flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-5 px-6 py-4">

          {/* ── Meta header ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-pixel text-[8px] tracking-widest text-dex-accent">META ANALYSIS</p>
              <h2 className="mt-0.5 text-xl font-bold text-foreground">{tierStats.format}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/40">BATTLES ANALYZED</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{tierStats.sample}</p>
              </div>
              <div className="rounded-xl border border-dex-accent/20 bg-dex-accent/8 px-3 py-1.5 text-center">
                <p className="font-pixel text-[6px] text-muted-foreground/40">SEASON</p>
                <p className="font-pixel text-[9px] font-bold text-dex-accent">S23</p>
              </div>
            </div>
          </div>

          {/* ── Stat strip ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={<BarChart3 size={14} className="text-dex-accent" />} label="TOP USAGE"    value={tierStats.topUsage} />
            <StatCard icon={<Users      size={14} className="text-dex-accent" />} label="SAMPLE SIZE" value={tierStats.sample}   />
            <StatCard icon={<Flame      size={14} className="text-orange-400" />} label="META HEALTH" value="Balanced"           />
          </div>

          {/* ── Tier tabs ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 rounded-xl border border-white/6 bg-dex-surface p-1">
            {TIERS.map((tier) => (
              <button
                key={tier}
                onClick={() => setActiveTier(tier)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-[11px] font-medium transition-all",
                  activeTier === tier
                    ? "bg-dex-elevated text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground/80"
                )}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* ── Ranked list ──────────────────────────────────────────────── */}
          <div className="overflow-hidden rounded-2xl border border-white/6">
            <div className="border-b border-white/6 bg-dex-surface/80 px-4 py-2">
              <div className="grid grid-cols-[2rem_1fr_auto_5rem] items-center gap-4">
                {["#", "Pokémon", "Usage", ""].map((h, i) => (
                  <span key={i} className="font-pixel text-[8px] uppercase tracking-wider text-muted-foreground/30">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="divide-y divide-white/4 bg-dex-surface">
              {pokemonList.map((pokemon) => (
                <RankedRow key={pokemon.rank} pokemon={pokemon} />
              ))}
            </div>
          </div>

          {/* ── Trending ─────────────────────────────────────────────────── */}
          <div>
            <p className="mb-3 font-pixel text-[7px] tracking-wider text-muted-foreground/40">
              TRENDING THIS WEEK
            </p>
            <div className="grid grid-cols-3 gap-3">
              {TRENDING.map((pick) => (
                <TrendingCard key={pick.name} pick={pick} />
              ))}
            </div>
          </div>

          {/* ── Popular teams stub ───────────────────────────────────────── */}
          <div className="mb-6 rounded-2xl border border-dashed border-white/6 bg-dex-surface/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/30">
                POPULAR TEAMS
              </p>
              <span className="rounded-full border border-dex-accent/20 px-2 py-0.5 font-pixel text-[6px] text-dex-accent/40">
                COMING SOON
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground/25">
              High-ladder team compositions and archetype breakdowns will appear here.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/6 bg-dex-surface px-4 py-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/50">{label}</p>
      </div>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function RankedRow({ pokemon }: { pokemon: MetaPokemon }) {
  const rankColor =
    pokemon.rank === 1 ? RANK_COLORS[0]
    : pokemon.rank === 2 ? RANK_COLORS[1]
    : pokemon.rank === 3 ? RANK_COLORS[2]
    : undefined;

  const TrendIcon =
    pokemon.trend === "up" ? TrendingUp
    : pokemon.trend === "down" ? TrendingDown
    : Minus;

  const trendColor =
    pokemon.trend === "up" ? "text-green-400"
    : pokemon.trend === "down" ? "text-red-400"
    : "text-muted-foreground/30";

  return (
    <div className="group grid grid-cols-[2rem_1fr_auto_5rem] items-center gap-4 px-4 py-3 transition-colors hover:bg-dex-elevated">
      {/* Rank */}
      <span
        className="font-pixel text-[9px] font-bold tabular-nums"
        style={{ color: rankColor ?? "hsl(var(--muted-foreground))" }}
      >
        {String(pokemon.rank).padStart(2, "0")}
      </span>

      {/* Name + types + role */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dex-elevated ring-1 ring-white/8">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none" className="text-muted-foreground/20">
            <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2" />
            <path d="M2 14h24M10 14a4 4 0 0 1 8 0 4 4 0 0 1-8 0Z" stroke="currentColor" strokeWidth="2" />
            <circle cx="14" cy="14" r="2" fill="currentColor" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground">{pokemon.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            {pokemon.types.map((t) => (
              <TypeBadge key={t} type={t as PokemonType} size="xs" />
            ))}
            <span className="ml-1 truncate text-[10px] text-muted-foreground/40">{pokemon.role}</span>
          </div>
        </div>
      </div>

      {/* Usage bar + percent */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-dex-elevated">
          <div
            className="h-full rounded-full bg-dex-accent/60 transition-all duration-500"
            style={{ width: `${(pokemon.usage / 45) * 100}%` }}
          />
        </div>
        <span className="w-10 text-right text-[11px] font-medium tabular-nums text-muted-foreground">
          {pokemon.usage}%
        </span>
      </div>

      {/* Trend */}
      <div className={cn("flex items-center justify-end gap-1", trendColor)}>
        <TrendIcon size={12} />
        <span className="font-pixel text-[8px] tabular-nums">{pokemon.trendDelta}</span>
      </div>
    </div>
  );
}

function TrendingCard({ pick }: { pick: TrendingPick }) {
  const isUp = pick.direction === "up";
  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-all duration-200",
        isUp
          ? "border-green-500/20 bg-green-500/5 hover:border-green-500/30"
          : "border-red-500/20 bg-red-500/5 hover:border-red-500/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-foreground">{pick.name}</p>
          <div className="mt-1 flex gap-1">
            {pick.types.map((t) => (
              <TypeBadge key={t} type={t as PokemonType} size="xs" />
            ))}
          </div>
        </div>
        <span className={cn("shrink-0 font-pixel text-[9px] font-bold tabular-nums", isUp ? "text-green-400" : "text-red-400")}>
          {pick.change}
        </span>
      </div>
    </div>
  );
}
