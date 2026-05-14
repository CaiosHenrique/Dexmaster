"use client";

import { useState, useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";
import { Lock, Star, Medal, BookOpen, Gem, Crown, Shield, Package } from "lucide-react";

// ── Achievement data ───────────────────────────────────────────────────────────

type Rarity   = "common" | "uncommon" | "rare" | "epic" | "legendary";
type Category = "collection" | "dex" | "shiny" | "special";

interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  category: Category;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  total?: number;
  hidden?: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  // Unlocked
  { id: "first",   name: "First Steps",       description: "Register your first Pokémon",             rarity: "common",    category: "collection", Icon: Star,    unlocked: true,  unlockedAt: "2026-05-13" },
  { id: "dex10",   name: "Budding Trainer",    description: "Own 10 Pokémon",                          rarity: "common",    category: "collection", Icon: Package, unlocked: true,  unlockedAt: "2026-05-13" },
  // In-progress
  { id: "dex100",  name: "Century Collector",  description: "Own 100 Pokémon",                         rarity: "uncommon",  category: "collection", Icon: Package, unlocked: false, progress: 45,  total: 100  },
  { id: "starters",name: "Starter Pack",       description: "Own all starter Pokémon",                 rarity: "uncommon",  category: "collection", Icon: Shield,  unlocked: false, progress: 3,   total: 9    },
  { id: "kanto",   name: "Kanto Champion",     description: "Complete the Kanto Pokédex (151)",        rarity: "rare",      category: "dex",        Icon: Medal,   unlocked: false, progress: 45,  total: 151  },
  { id: "eevee",   name: "Eeveelution Set",    description: "Own all 9 Eeveelutions",                  rarity: "rare",      category: "collection", Icon: Star,    unlocked: false, progress: 2,   total: 9    },
  { id: "nat",     name: "Living Legend",      description: "Complete the National Pokédex (1025)",    rarity: "legendary", category: "dex",        Icon: Crown,   unlocked: false, progress: 45,  total: 1025 },
  // Locked
  { id: "johto",   name: "Johto Master",       description: "Complete the Johto Pokédex",              rarity: "rare",      category: "dex",        Icon: Medal,   unlocked: false },
  { id: "shiny1",  name: "Golden Find",        description: "Register your first Shiny Pokémon",       rarity: "uncommon",  category: "shiny",      Icon: Gem,     unlocked: false },
  { id: "paldea",  name: "Paldea Legend",      description: "Complete the Paldea Pokédex (400)",       rarity: "epic",      category: "dex",        Icon: BookOpen,unlocked: false },
  { id: "legends", name: "Mythic Collection",  description: "Register all Legendary Pokémon",          rarity: "epic",      category: "collection", Icon: Crown,   unlocked: false, progress: 0,   total: 59   },
  { id: "shiny25", name: "Shiny Obsession",    description: "Collect 25 Shiny Pokémon",                rarity: "epic",      category: "shiny",      Icon: Gem,     unlocked: false, progress: 0,   total: 25   },
  { id: "shiny100",name: "Shiny Grandmaster",  description: "Collect 100 Shiny Pokémon",               rarity: "legendary", category: "shiny",      Icon: Gem,     unlocked: false, progress: 0,   total: 100  },
  // Hidden
  { id: "h1", name: "???", description: "A secret challenge awaits the most dedicated trainers.", rarity: "epic",      category: "special", Icon: Lock, unlocked: false, hidden: true },
  { id: "h2", name: "???", description: "Only legends know the path to this achievement.",        rarity: "legendary", category: "special", Icon: Lock, unlocked: false, hidden: true },
];

// ── Rarity config ─────────────────────────────────────────────────────────────

const RARITY: Record<Rarity, { label: string; border: string; bg: string; text: string; bar: string; glow?: string }> = {
  common:    { label: "Common",    border: "border-white/10",      bg: "bg-white/2",      text: "text-muted-foreground/50", bar: "bg-white/30" },
  uncommon:  { label: "Uncommon",  border: "border-green-500/30",  bg: "bg-green-500/5",  text: "text-green-400/80",       bar: "bg-green-400/60" },
  rare:      { label: "Rare",      border: "border-blue-500/35",   bg: "bg-blue-500/6",   text: "text-blue-400",           bar: "bg-blue-400/60" },
  epic:      { label: "Epic",      border: "border-purple-500/40", bg: "bg-purple-500/8", text: "text-purple-400",         bar: "bg-purple-400/60", glow: "shadow-[0_0_16px_rgba(168,85,247,0.12)]" },
  legendary: { label: "Legendary", border: "border-yellow-400/45", bg: "bg-yellow-400/8", text: "text-yellow-400",         bar: "bg-yellow-400/70", glow: "shadow-[0_0_20px_rgba(234,179,8,0.18)]" },
};

const ICON_BG: Record<Rarity, string> = {
  common:    "bg-dex-elevated ring-white/8",
  uncommon:  "bg-green-500/10 ring-green-500/20",
  rare:      "bg-blue-500/10 ring-blue-500/20",
  epic:      "bg-purple-500/10 ring-purple-500/25",
  legendary: "bg-yellow-400/10 ring-yellow-400/25",
};

const CATEGORY_LABELS: Record<Category, string> = {
  collection: "Collection",
  dex: "Pokédex",
  shiny: "Shiny",
  special: "Hidden",
};

const FILTER_TABS = ["all", "dex", "collection", "shiny", "special"] as const;
type Filter = (typeof FILTER_TABS)[number];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AchievementsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const displayed = useMemo(
    () => ACHIEVEMENTS.filter((a) => filter === "all" || a.category === filter),
    [filter]
  );

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlocked).length;
  const totalCount    = ACHIEVEMENTS.length;

  const rarityCounts = useMemo(() => {
    const counts = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 } as Record<Rarity, number>;
    ACHIEVEMENTS.filter((a) => a.unlocked).forEach((a) => counts[a.rarity]++);
    return counts;
  }, []);

  const recentUnlocks = useMemo(
    () => ACHIEVEMENTS.filter((a) => a.unlocked && a.unlockedAt).slice(0, 4),
    []
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar title="Achievements" />

      <div className="scrollbar-dex flex-1 overflow-y-auto">
        <div className="space-y-6 px-6 py-4">

          {/* ── Stats strip ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/6 bg-dex-surface px-4 py-2.5">
              <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/50">UNLOCKED</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-dex-accent">
                {unlockedCount}
                <span className="ml-1 text-sm font-normal text-muted-foreground/40">/ {totalCount}</span>
              </p>
            </div>

            {(["legendary", "epic", "rare", "uncommon"] as const).map((r) =>
              rarityCounts[r] > 0 ? (
                <div key={r} className={cn("rounded-xl border px-3 py-2.5", RARITY[r].border, RARITY[r].bg, RARITY[r].glow)}>
                  <p className="font-pixel text-[6px] uppercase tracking-wider text-muted-foreground/30">
                    {RARITY[r].label}
                  </p>
                  <p className={cn("mt-0.5 text-base font-bold tabular-nums", RARITY[r].text)}>
                    {rarityCounts[r]}
                  </p>
                </div>
              ) : null
            )}

            <div className="ml-auto min-w-[140px]">
              <div className="mb-1 flex justify-between">
                <span className="font-pixel text-[7px] text-muted-foreground/30">COMPLETION</span>
                <span className="font-pixel text-[7px] text-dex-accent">
                  {Math.round((unlockedCount / totalCount) * 100)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-dex-elevated">
                <div
                  className="h-full rounded-full bg-dex-accent/70 transition-all duration-700"
                  style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── Recent unlocks ────────────────────────────────────────────── */}
          {recentUnlocks.length > 0 && (
            <section>
              <p className="mb-3 font-pixel text-[7px] tracking-wider text-muted-foreground/40">
                RECENTLY UNLOCKED
              </p>
              <div className="grid grid-cols-4 gap-3">
                {recentUnlocks.map((a) => (
                  <RecentBadge key={a.id} achievement={a} />
                ))}
              </div>
            </section>
          )}

          {/* ── Category filter ──────────────────────────────────────────── */}
          <div className="flex items-center gap-1 rounded-xl border border-white/6 bg-dex-surface p-1">
            {FILTER_TABS.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-[11px] font-medium capitalize transition-all",
                  filter === cat
                    ? "bg-dex-elevated text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground/80"
                )}
              >
                {cat === "all" ? "All" : CATEGORY_LABELS[cat as Category]}
              </button>
            ))}
          </div>

          {/* ── Achievement grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 pb-6">
            {displayed.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RecentBadge({ achievement: a }: { achievement: Achievement }) {
  const style = RARITY[a.rarity];
  const { Icon } = a;
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-xl border p-3 text-center", style.border, style.bg, style.glow)}>
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", ICON_BG[a.rarity])}>
        <Icon size={18} className={style.text} />
      </div>
      <p className="text-[10px] font-semibold leading-tight text-foreground">{a.name}</p>
      {a.unlockedAt && (
        <p className="font-pixel text-[6px] text-muted-foreground/30">{a.unlockedAt}</p>
      )}
    </div>
  );
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const style = RARITY[a.rarity];
  const { Icon } = a;
  const hasProgress = typeof a.progress === "number" && typeof a.total === "number";
  const progressPct = hasProgress ? (a.progress! / a.total!) * 100 : 0;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-200",
        style.border, style.bg, style.glow,
        a.unlocked ? "hover:brightness-110" : !hasProgress && "opacity-55"
      )}
    >
      {/* Rarity label + check */}
      <div className="flex items-center justify-between">
        <span className={cn("font-pixel text-[7px] uppercase tracking-wider", style.text)}>
          {style.label}
        </span>
        {a.unlocked && (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-dex-owned/20 ring-1 ring-dex-owned/30">
            <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-dex-owned" />
            </svg>
          </div>
        )}
      </div>

      {/* Icon */}
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl ring-1", ICON_BG[a.rarity])}>
        {a.hidden && !a.unlocked ? (
          <Lock size={20} className="text-muted-foreground/20" />
        ) : (
          <Icon size={20} className={a.unlocked ? style.text : "text-muted-foreground/30"} />
        )}
      </div>

      {/* Name + description */}
      <div>
        <p className={cn("text-[13px] font-semibold leading-tight", a.unlocked ? "text-foreground" : "text-muted-foreground/60")}>
          {a.name}
        </p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/40">
          {a.description}
        </p>
      </div>

      {/* Progress bar */}
      {hasProgress && !a.unlocked && (
        <div>
          <div className="mb-1 flex justify-between">
            <span className="font-pixel text-[7px] text-muted-foreground/30">PROGRESS</span>
            <span className="font-pixel text-[7px] text-muted-foreground/40 tabular-nums">
              {a.progress!.toLocaleString()}/{a.total!.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-dex-elevated">
            <div
              className={cn("h-full rounded-full transition-all duration-700", style.bar)}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Unlock date */}
      {a.unlocked && a.unlockedAt && (
        <p className="font-pixel text-[7px] text-muted-foreground/25">Unlocked {a.unlockedAt}</p>
      )}

      {/* Legendary shimmer */}
      {a.rarity === "legendary" && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/5 via-transparent to-amber-300/5" />
      )}
    </div>
  );
}
