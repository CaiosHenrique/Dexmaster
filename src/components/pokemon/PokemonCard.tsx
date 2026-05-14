"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TypeBadge, type PokemonType } from "@/components/ui-custom/TypeBadge";
import { Check, Sparkles, ArrowUpRight } from "lucide-react";

export interface PokemonCardData {
  id: number;           // dex number shown on card (#0025)
  formId: number;       // DB pokemon_forms.id — used for all ownership operations
  slug: string;         // species DB name — used for /pokemon/[slug]
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
  index?: number;
  onToggleOwned?: (id: number, owned: boolean) => void;
  onCardMouseDown?: (id: number, index: number, shiftKey: boolean) => void;
  onCardMouseEnter?: (id: number, index: number) => void;
}

export function PokemonCard({
  pokemon,
  collectionMode = false,
  isQueued = false,
  index = 0,
  onToggleOwned,
  onCardMouseDown,
  onCardMouseEnter,
}: PokemonCardProps) {
  const [popping, setPopping] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const prevQueuedRef = useRef(isQueued);
  const prevOwnedRef = useRef(pokemon.isOwned);

  const { id, formId, slug, displayName, spriteUrl, types, isOwned } = pokemon;
  const dexNumber = `#${String(id).padStart(4, "0")}`;
  const effectiveOwned = isOwned || isQueued;

  // Bounce pop when card is queued
  useEffect(() => {
    if (isQueued && !prevQueuedRef.current) {
      setPopping(true);
      const t = setTimeout(() => setPopping(false), 220);
      return () => clearTimeout(t);
    }
    prevQueuedRef.current = isQueued;
  }, [isQueued]);

  // Burst glow when card transitions to owned (single-card mode)
  useEffect(() => {
    if (isOwned && !prevOwnedRef.current) {
      setBursting(true);
      const t = setTimeout(() => setBursting(false), 450);
      return () => clearTimeout(t);
    }
    prevOwnedRef.current = isOwned;
  }, [isOwned]);

  const handleClick = useCallback(() => {
    if (collectionMode) return; // collection mode handled by onMouseDown
    if (!onToggleOwned) return;
    onToggleOwned(formId, !isOwned); // formId, not id (dex number)
  }, [collectionMode, formId, isOwned, onToggleOwned]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!collectionMode) return;
      e.preventDefault(); // prevent text selection during drag-paint
      onCardMouseDown?.(formId, index, e.shiftKey); // formId, not id
    },
    [collectionMode, formId, index, onCardMouseDown]
  );

  const handleMouseEnter = useCallback(() => {
    if (!collectionMode) return;
    onCardMouseEnter?.(formId, index); // formId, not id
  }, [collectionMode, formId, index, onCardMouseEnter]);

  const showSprite = spriteUrl && !imgError;

  return (
    <div className="group relative">
      <button
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        draggable={false}
        className={cn(
          "relative flex w-full flex-col items-center gap-1.5 rounded-xl border p-3 text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dex-accent",
          "select-none transition-all duration-200",
          effectiveOwned
            ? "border-dex-owned/30 bg-dex-surface hover:border-dex-owned/50 hover:bg-dex-elevated"
            : "border-white/5 bg-dex-surface/50 hover:border-white/10 hover:bg-dex-surface",
          collectionMode && !effectiveOwned &&
            "cursor-crosshair hover:border-dex-owned/40 hover:bg-dex-owned/5",
          isQueued && "border-dex-owned/50 bg-dex-owned/8",
          popping && "animate-select-pop",
          bursting && "animate-owned-burst"
        )}
      >
        {/* Dex number */}
        <span
          className={cn(
            "self-start font-pixel text-[7px] transition-colors duration-200",
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
            "group-hover:scale-110",
            effectiveOwned && "group-hover:drop-shadow-[0_0_10px_var(--dex-owned-glow)]",
            isQueued && "drop-shadow-[0_0_8px_var(--dex-owned-glow)]"
          )}
        >
          {showSprite ? (
            <Image
              src={spriteUrl!}
              alt={displayName}
              width={64}
              height={64}
              className="object-contain"
              style={{ imageRendering: "pixelated" }}
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dex-elevated ring-1 ring-white/5">
              <svg
                width="26"
                height="26"
                viewBox="0 0 28 28"
                fill="none"
                className="text-muted-foreground/20"
              >
                <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2" />
                <path d="M2 14h24M10 14a4 4 0 0 1 8 0 4 4 0 0 1-8 0Z" stroke="currentColor" strokeWidth="2" />
                <circle cx="14" cy="14" r="2" fill="currentColor" />
              </svg>
            </div>
          )}
        </div>

        {/* Name */}
        <span
          className={cn(
            "text-center text-[11px] font-medium leading-tight transition-colors duration-200",
            effectiveOwned ? "text-foreground" : "text-muted-foreground/40"
          )}
        >
          {displayName}
        </span>

        {/* Type badges — graceful empty state */}
        <div className="flex flex-wrap justify-center gap-1">
          {types.length > 0 ? (
            types.slice(0, 2).map((t) => (
              <TypeBadge key={t} type={t as PokemonType} size="xs" />
            ))
          ) : (
            <div className="h-3.5 w-10 rounded bg-dex-elevated/50" />
          )}
        </div>

        {/* Owned checkmark */}
        {effectiveOwned && (
          <div
            className={cn(
              "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full",
              "transition-all duration-200",
              isQueued
                ? "scale-110 bg-dex-owned/40 ring-1 ring-dex-owned/60"
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

        {/* Queued: persistent selection ring */}
        {isQueued && (
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-dex-owned/50" />
        )}
      </button>

      {/* Detail link — only outside collection mode */}
      {!collectionMode && (
        <Link
          href={`/pokemon/${slug}`}
          className={cn(
            "absolute bottom-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-md",
            "bg-dex-elevated ring-1 ring-white/10 text-muted-foreground/50",
            "opacity-0 transition-all duration-150 group-hover:opacity-100",
            "hover:bg-dex-muted hover:text-foreground hover:ring-white/20"
          )}
          title={`View ${displayName}`}
        >
          <ArrowUpRight size={10} />
        </Link>
      )}
    </div>
  );
}
