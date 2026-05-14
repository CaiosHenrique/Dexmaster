"use client";

import { useState, useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { TypeBadge, type PokemonType } from "@/components/ui-custom/TypeBadge";
import { cn } from "@/lib/utils";
import { Plus, X, Zap, AlertTriangle, FileText } from "lucide-react";

// ── Type chart data ────────────────────────────────────────────────────────────

const ALL_TYPES = [
  "normal","fire","water","electric","grass","ice",
  "fighting","poison","ground","flying","psychic","bug",
  "rock","ghost","dragon","dark","steel","fairy",
] as const;

type PokeType = (typeof ALL_TYPES)[number];

const SUPER_EFFECTIVE: Record<PokeType, PokeType[]> = {
  normal: [], fire: ["bug","grass","ice","steel"], water: ["fire","ground","rock"],
  electric: ["flying","water"], grass: ["ground","rock","water"],
  ice: ["dragon","flying","grass","ground"], fighting: ["dark","ice","normal","rock","steel"],
  poison: ["fairy","grass"], ground: ["electric","fire","poison","rock","steel"],
  flying: ["bug","fighting","grass"], psychic: ["fighting","poison"],
  bug: ["dark","grass","psychic"], rock: ["bug","fire","flying","ice"],
  ghost: ["ghost","psychic"], dragon: ["dragon"], dark: ["ghost","psychic"],
  steel: ["fairy","ice","rock"], fairy: ["dark","dragon","fighting"],
};

const WEAK_TO: Record<PokeType, PokeType[]> = {
  normal: ["fighting"], fire: ["ground","rock","water"], water: ["electric","grass"],
  electric: ["ground"], grass: ["bug","fire","flying","ice","poison"],
  ice: ["fighting","fire","rock","steel"], fighting: ["fairy","flying","psychic"],
  poison: ["ground","psychic"], ground: ["grass","ice","water"],
  flying: ["electric","ice","rock"], psychic: ["bug","dark","ghost"],
  bug: ["fire","flying","rock"], rock: ["fighting","grass","ground","steel","water"],
  ghost: ["dark","ghost"], dragon: ["dragon","fairy","ice"],
  dark: ["bug","fairy","fighting"], steel: ["fighting","fire","ground"],
  fairy: ["poison","steel"],
};

// ── Role definitions ───────────────────────────────────────────────────────────

type RoleTag = "sweeper" | "tank" | "support" | "setup" | "pivot" | "hazard";

interface TeamMember {
  displayName: string;
  types: PokeType[];
  role: RoleTag;
  item: string;
}

const ROLES: Record<RoleTag, { label: string; color: string }> = {
  sweeper: { label: "Sweeper",  color: "#F97316" },
  tank:    { label: "Tank",     color: "#3B82F6" },
  support: { label: "Support",  color: "#22C55E" },
  setup:   { label: "Setup",    color: "#A855F7" },
  pivot:   { label: "Pivot",    color: "#06B6D4" },
  hazard:  { label: "Hazards",  color: "#EF4444" },
};

// Two pre-filled slots to showcase the filled-slot UI
const DEFAULT_TEAM: (TeamMember | null)[] = [
  { displayName: "Charizard", types: ["fire","flying"],   role: "sweeper", item: "Choice Specs" },
  { displayName: "Garchomp",  types: ["dragon","ground"], role: "pivot",   item: "Rocky Helmet" },
  null, null, null, null,
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function computeCoverage(team: (TeamMember | null)[]): Set<PokeType> {
  const covered = new Set<PokeType>();
  for (const slot of team) {
    if (!slot) continue;
    for (const type of slot.types)
      for (const target of SUPER_EFFECTIVE[type]) covered.add(target);
  }
  return covered;
}

function computeWeaknesses(team: (TeamMember | null)[]): Map<PokeType, number> {
  const counts = new Map<PokeType, number>();
  for (const slot of team) {
    if (!slot) continue;
    const slotWeak = new Set<PokeType>();
    for (const type of slot.types)
      for (const threat of WEAK_TO[type]) slotWeak.add(threat);
    for (const threat of slotWeak)
      counts.set(threat, (counts.get(threat) ?? 0) + 1);
  }
  return counts;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [team, setTeam] = useState<(TeamMember | null)[]>(DEFAULT_TEAM);
  const [teamName, setTeamName] = useState("My Team");
  const [notes, setNotes] = useState("");

  const coverage    = useMemo(() => computeCoverage(team),   [team]);
  const weakMap     = useMemo(() => computeWeaknesses(team), [team]);
  const filledCount = team.filter(Boolean).length;

  const weakList = useMemo(
    () =>
      [...weakMap.entries()]
        .filter(([, c]) => c > 0)
        .sort((a, b) => b[1] - a[1]),
    [weakMap]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar title="Team Builder" />

      <div className="scrollbar-dex flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-6 py-4">

          {/* ── Team header row ──────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="flex-1 rounded-xl border border-white/8 bg-dex-surface px-4 py-2.5 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-dex-accent/40 focus:ring-1 focus:ring-dex-accent/20 transition-all"
              placeholder="Team name..."
            />
            <span className="font-pixel text-[8px] text-muted-foreground/30 tabular-nums">
              {filledCount}/6
            </span>
            <button className="rounded-xl border border-white/8 bg-dex-surface px-4 py-2.5 text-[11px] font-medium text-muted-foreground/50 transition-all hover:border-white/15 hover:text-muted-foreground/80">
              Export
            </button>
            <button className="rounded-xl bg-dex-accent/15 px-4 py-2.5 text-[11px] font-medium text-dex-accent ring-1 ring-dex-accent/30 transition-all hover:bg-dex-accent/20">
              Save Team
            </button>
          </div>

          {/* ── 6 Pokémon slots ──────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            {team.map((slot, i) =>
              slot ? (
                <FilledSlot
                  key={i}
                  slot={slot}
                  slotIndex={i}
                  onRemove={() =>
                    setTeam((prev) => {
                      const next = [...prev];
                      next[i] = null;
                      return next;
                    })
                  }
                />
              ) : (
                <EmptySlot key={i} slotIndex={i} />
              )
            )}
          </div>

          {/* ── Analysis row ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">

            {/* Offensive coverage */}
            <div className="rounded-2xl border border-white/6 bg-dex-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <Zap size={13} className="text-dex-accent" />
                <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/50">
                  OFFENSIVE COVERAGE
                </p>
                <span className="ml-auto font-pixel text-[7px] text-muted-foreground/25 tabular-nums">
                  {coverage.size}/18
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {ALL_TYPES.map((t) => (
                  <div
                    key={t}
                    className={cn(
                      "flex items-center justify-center rounded-lg py-1 transition-all",
                      coverage.has(t) ? "opacity-100" : "opacity-20 grayscale"
                    )}
                  >
                    <TypeBadge type={t as PokemonType} size="xs" />
                  </div>
                ))}
              </div>
              {filledCount === 0 && (
                <p className="mt-3 text-center text-[10px] text-muted-foreground/25">
                  Add Pokémon to see coverage
                </p>
              )}
            </div>

            {/* Team weaknesses */}
            <div className="rounded-2xl border border-white/6 bg-dex-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={13} className="text-destructive/60" />
                <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/50">
                  TEAM WEAKNESSES
                </p>
              </div>

              {filledCount === 0 ? (
                <p className="py-8 text-center text-[10px] text-muted-foreground/25">
                  Add Pokémon to see weaknesses
                </p>
              ) : weakList.length === 0 ? (
                <p className="py-8 text-center text-[10px] text-muted-foreground/25">
                  No notable weaknesses
                </p>
              ) : (
                <div className="space-y-2.5">
                  {weakList.map(([type, count]) => {
                    const ratio = count / filledCount;
                    const label = ratio >= 0.8 ? "4×" : ratio >= 0.4 ? "2×" : "1×";
                    const labelColor =
                      ratio >= 0.8 ? "text-red-400"
                      : ratio >= 0.4 ? "text-orange-400"
                      : "text-muted-foreground/40";
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <TypeBadge type={type as PokemonType} size="xs" />
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dex-elevated">
                          <div
                            className="h-full rounded-full bg-destructive/50 transition-all duration-500"
                            style={{ width: `${ratio * 100}%` }}
                          />
                        </div>
                        <span className={cn("w-4 text-right font-pixel text-[8px] font-bold", labelColor)}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Team Notes ────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/6 bg-dex-surface p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <FileText size={13} className="text-muted-foreground/40" />
              <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/40">
                TEAM NOTES
              </p>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Strategy, leads, threat list, win conditions..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/6 bg-dex-elevated px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-dex-accent/30 focus:ring-1 focus:ring-dex-accent/10 transition-all"
            />
          </div>

          {/* ── Suggested Partners stub ────────────────────────────────── */}
          <div className="mb-6 rounded-2xl border border-dashed border-white/6 bg-dex-surface/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-pixel text-[7px] tracking-wider text-muted-foreground/30">
                SUGGESTED PARTNERS
              </p>
              <span className="rounded-full border border-dex-accent/20 px-2 py-0.5 font-pixel text-[6px] text-dex-accent/40">
                COMING SOON
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground/25">
              AI-powered partner suggestions based on role gaps and coverage holes will appear here.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptySlot({ slotIndex }: { slotIndex: number }) {
  return (
    <button
      className={cn(
        "group flex h-[200px] w-full flex-col items-center justify-center gap-3",
        "rounded-2xl border-2 border-dashed border-white/8 bg-dex-surface/40",
        "cursor-pointer transition-all duration-200",
        "hover:border-dex-accent/25 hover:bg-dex-elevated/50"
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-dex-elevated ring-1 ring-white/6 transition-all duration-200 group-hover:ring-dex-accent/20">
        <Plus size={20} className="text-muted-foreground/25 transition-colors group-hover:text-dex-accent/40" />
      </div>
      <div className="text-center">
        <p className="text-[11px] text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/50">
          Add Pokémon
        </p>
        <p className="mt-0.5 font-pixel text-[6px] tracking-wider text-muted-foreground/15">
          SLOT {slotIndex + 1}
        </p>
      </div>
    </button>
  );
}

function FilledSlot({
  slot,
  slotIndex: _slotIndex,
  onRemove,
}: {
  slot: TeamMember;
  slotIndex: number;
  onRemove: () => void;
}) {
  const roleStyle = ROLES[slot.role];
  return (
    <div className="group relative flex h-[200px] flex-col items-center gap-2 rounded-2xl border border-white/10 bg-dex-surface p-4 transition-all duration-200 hover:border-white/16 hover:bg-dex-elevated">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/30 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-dex-muted hover:text-foreground"
      >
        <X size={11} />
      </button>

      {/* Type badges */}
      <div className="self-start flex gap-1">
        {slot.types.map((t) => (
          <TypeBadge key={t} type={t as PokemonType} size="xs" />
        ))}
      </div>

      {/* Sprite placeholder */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dex-elevated ring-1 ring-white/8">
        <svg width="30" height="30" viewBox="0 0 28 28" fill="none" className="text-muted-foreground/20">
          <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2" />
          <path d="M2 14h24M10 14a4 4 0 0 1 8 0 4 4 0 0 1-8 0Z" stroke="currentColor" strokeWidth="2" />
          <circle cx="14" cy="14" r="2" fill="currentColor" />
        </svg>
      </div>

      {/* Name */}
      <span className="text-sm font-semibold text-foreground">{slot.displayName}</span>

      {/* Role badge */}
      <div
        className="rounded-full px-2.5 py-0.5 font-pixel text-[7px] tracking-wider"
        style={{ backgroundColor: `${roleStyle.color}20`, color: roleStyle.color }}
      >
        {roleStyle.label.toUpperCase()}
      </div>

      {/* Item */}
      <span className="text-[10px] text-muted-foreground/40">{slot.item}</span>
    </div>
  );
}
