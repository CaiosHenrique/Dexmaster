"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TypeBadge, type PokemonType } from "@/components/ui-custom/TypeBadge";
import { Check, Sparkles } from "lucide-react";

export interface PokemonCardData {
  id: number;
  name: string;
  displayName: string;
  spriteUrl: string | null;
  types: string[];
  isOwned: boolean;
  isShinyOwned?: boolean;
}

interface PokemonCardProps {
  pokemon: PokemonCardData;
  collectionMode?: boolean;
  isQueued?: boolean;
  onToggleOwned?: (id: number, owned: boolean) => void;
}

export function PokemonCard({
  pokemon,
  collectionMode = false,
  isQueued = false,
  onToggleOwned,
}: PokemonCardProps) {
  const [capturing, setCapturing] = useState(false);
  const { id, displayName, spriteUrl, types, isOwned } = pokemon;

  const dexNumber = `#${String(id).padStart(4, "0")}`;
  const effectiveOwned = isOwned || isQueued;

  const handleClick = useCallback(() => {
    if (!onToggleOwned) return;
    if (!effectiveOwned) {
      setCapturing(true);
      setTimeout(() => setCapturing(false), 450);
    }
    onToggleOwned(id, !isOwned);
  }, [id, isOwned, effectiveOwned, onToggleOwned]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dex-accent",
        effectiveOwned
          ? "border-white/10 bg-dex-surface hover:bg-dex-elevated hover:border-white/15"
          : "border-white/5 bg-dex-surface/50 hover:bg-dex-surface hover:border-white/10",
        collectionMode && !effectiveOwned && "hover:scale-[1.03] hover:border-dex-owned/40",
        isQueued && "border-dex-owned/40 bg-dex-owned/5",
        capturing && "animate-capture"
      )}
    >
      {/* Dex number */}
      <span
        className={cn(
          "self-start font-pixel text-[7px] transition-colors",
          effectiveOwned ? "text-muted-foreground/60" : "text-muted-foreground/30"
        )}
      >
        {dexNumber}
      </span>

      {/* Sprite */}
      <div
        className={cn(
          "relative flex h-16 w-16 items-center justify-center transition-all duration-300",
          !effectiveOwned && "pokemon-missing",
          effectiveOwned &&
            "group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_var(--dex-owned-glow)]"
        )}
      >
        {spriteUrl ? (
          <Image
            src={spriteUrl}
            alt={displayName}
            width={64}
            height={64}
            className="object-contain"
            style={{ imageRendering: "pixelated" }}
            unoptimized
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-dex-elevated" />
        )}
      </div>

      {/* Name */}
      <span
        className={cn(
          "text-center text-[11px] font-medium leading-tight transition-colors",
          effectiveOwned ? "text-foreground" : "text-muted-foreground/40"
        )}
      >
        {displayName}
      </span>

      {/* Type badges */}
      <div className="flex flex-wrap justify-center gap-1">
        {types.slice(0, 2).map((t) => (
          <TypeBadge key={t} type={t as PokemonType} size="xs" />
        ))}
      </div>

      {/* Owned checkmark */}
      {effectiveOwned && (
        <div
          className={cn(
            "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full",
            isQueued
              ? "bg-dex-owned/30 ring-1 ring-dex-owned/50"
              : "bg-dex-owned/20 ring-1 ring-dex-owned/30"
          )}
        >
          <Check size={10} className="text-dex-owned" strokeWidth={3} />
        </div>
      )}

      {/* Shiny indicator */}
      {pokemon.isShinyOwned && (
        <div className="absolute left-1.5 top-1.5">
          <Sparkles size={10} className="text-yellow-400/80" />
        </div>
      )}

      {/* Collection mode hover ring */}
      {collectionMode && !effectiveOwned && (
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-dex-owned/0 transition-all duration-150 group-hover:ring-dex-owned/50" />
      )}
    </button>
  );
}
