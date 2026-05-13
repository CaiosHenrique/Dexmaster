"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { DEX_CONFIGS, type DexName } from "@/lib/dex-constants";

interface DexSelectorProps {
  activeDex: DexName;
  entryCounts?: Partial<Record<DexName, number>>;
}

export function DexSelector({ activeDex, entryCounts = {} }: DexSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(name: DexName) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("dex", name);
    router.push(`/pokedex?${params.toString()}`);
  }

  return (
    <div className="flex items-end gap-1 overflow-x-auto pb-1 scrollbar-dex">
      {DEX_CONFIGS.map((dex) => {
        const isActive = dex.name === activeDex;
        const count = entryCounts[dex.name];

        return (
          <button
            key={dex.name}
            onClick={() => select(dex.name)}
            title={dex.displayName}
            className={cn(
              "group relative flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
              isActive
                ? "text-white"
                : "bg-dex-elevated text-muted-foreground hover:text-foreground hover:bg-dex-muted"
            )}
            style={
              isActive
                ? {
                    backgroundColor: `${dex.color}1a`,
                    boxShadow: `0 0 18px ${dex.color}28, inset 0 0 0 1px ${dex.color}45`,
                    color: dex.color,
                  }
                : undefined
            }
          >
            <span className="leading-none">{dex.shortName}</span>

            {count !== undefined && (
              <span className="text-[9px] leading-none opacity-50">{count}</span>
            )}

            {dex.isDlc && (
              <span
                className="font-pixel text-[5px] leading-none opacity-60"
                style={isActive ? { color: dex.color } : undefined}
              >
                DLC
              </span>
            )}

            {/* Active underline bar */}
            {isActive && (
              <span
                className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full"
                style={{ backgroundColor: dex.color, opacity: 0.9 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
