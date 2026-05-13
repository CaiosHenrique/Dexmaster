"use client";

import { Search, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  collectionMode?: boolean;
  onToggleCollectionMode?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  title?: string;
}

export function TopBar({
  collectionMode = false,
  onToggleCollectionMode,
  searchValue = "",
  onSearchChange,
  showSearch = false,
  title,
}: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/6 bg-dex-base/80 px-6 backdrop-blur-sm">
      {title && (
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      )}

      {showSearch && (
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Search Pokémon..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full rounded-lg border border-white/8 bg-dex-elevated py-2 pl-8 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-dex-accent/50 focus:ring-1 focus:ring-dex-accent/30 transition-all duration-150"
          />
        </div>
      )}

      <div className="flex-1" />

      {onToggleCollectionMode && (
        <button
          onClick={onToggleCollectionMode}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
            collectionMode
              ? "bg-dex-owned/15 text-dex-owned ring-1 ring-dex-owned/30 glow-owned"
              : "bg-dex-elevated text-muted-foreground hover:text-foreground hover:bg-dex-muted"
          )}
        >
          <Zap size={13} className={cn(collectionMode && "animate-pulse")} />
          {collectionMode ? "Collection Mode ON" : "Collection Mode"}
        </button>
      )}
    </header>
  );
}
