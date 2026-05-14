"use client";

import { cn } from "@/lib/utils";
import { TypeBadge, type PokemonType } from "@/components/ui-custom/TypeBadge";

export type StatusFilter = "all" | "owned" | "missing";

const ALL_TYPES: PokemonType[] = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

interface TypeFilterProps {
  status: StatusFilter;
  type: PokemonType | null;
  onStatusChange: (s: StatusFilter) => void;
  onTypeChange: (t: PokemonType | null) => void;
  counts: { all: number; owned: number; missing: number };
}

export function TypeFilter({
  status,
  type,
  onStatusChange,
  onTypeChange,
  counts,
}: TypeFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Status pills */}
      <div className="flex items-center gap-1.5">
        {(["all", "owned", "missing"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
              status === s
                ? s === "owned"
                  ? "bg-dex-owned/15 text-dex-owned ring-1 ring-dex-owned/30"
                  : s === "missing"
                  ? "bg-dex-accent/10 text-dex-accent ring-1 ring-dex-accent/20"
                  : "bg-dex-elevated text-foreground ring-1 ring-white/10"
                : "text-muted-foreground hover:text-foreground hover:bg-dex-elevated"
            )}
          >
            <span className="capitalize">{s}</span>
            <span className="ml-1.5 tabular-nums opacity-50">{counts[s]}</span>
          </button>
        ))}

        {type && (
          <button
            onClick={() => onTypeChange(null)}
            className="ml-auto text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear type
          </button>
        )}
      </div>

      {/* Type chips */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-dex">
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(type === t ? null : t)}
            className={cn(
              "shrink-0 transition-all duration-150",
              type === t
                ? "scale-110 brightness-110 ring-2 ring-white/30 rounded-full"
                : "opacity-55 hover:opacity-90"
            )}
            title={t}
          >
            <TypeBadge type={t} size="xs" />
          </button>
        ))}
      </div>
    </div>
  );
}
