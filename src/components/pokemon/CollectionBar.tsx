"use client";

import { Check, Trash2, X, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollectionBarProps {
  visible: boolean;
  count: number;
  ownedInSelection: number;
  isApplying: boolean;
  onMarkOwned: () => void;
  onUnmark: () => void;
  onSelectAll: () => void;
  onClear: () => void;
  onExit: () => void;
}

export function CollectionBar({
  visible,
  count,
  ownedInSelection,
  isApplying,
  onMarkOwned,
  onUnmark,
  onSelectAll,
  onClear,
  onExit,
}: CollectionBarProps) {
  const unownedInSelection = count - ownedInSelection;

  if (!visible) return null;

  return (
    <div className="animate-bar-rise fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div
        className={cn(
          "glass rounded-2xl shadow-2xl transition-shadow duration-300",
          count > 0 && "glow-owned"
        )}
      >
        {count === 0 ? (
          /* ── Hint state ─────────────────────────────────────────────── */
          <div className="flex items-center gap-2.5 px-5 py-3 text-[11px] text-muted-foreground/50">
            <MousePointer2 size={12} className="shrink-0 text-muted-foreground/30" />
            <span>
              Click or drag to select
              <span className="mx-2 opacity-30">·</span>
              <kbd className="font-mono opacity-60">Shift+click</kbd> range
              <span className="mx-2 opacity-30">·</span>
              <kbd className="font-mono opacity-60">A</kbd> all
              <span className="mx-2 opacity-30">·</span>
              <kbd className="font-mono opacity-60">Esc</kbd> exit
            </span>
          </div>
        ) : (
          /* ── Action state ────────────────────────────────────────────── */
          <div className="flex items-center gap-2 px-4 py-3">
            {/* Count pill */}
            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
              <div className="h-1.5 w-1.5 rounded-full bg-dex-owned animate-pulse" />
              <span className="font-pixel text-[8px] tracking-wider text-dex-owned">
                {count} SELECTED
              </span>
            </div>

            {/* Mark owned */}
            {unownedInSelection > 0 && (
              <button
                onClick={onMarkOwned}
                disabled={isApplying}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5",
                  "bg-dex-owned/20 text-xs font-medium text-dex-owned",
                  "ring-1 ring-dex-owned/30 transition-all duration-150",
                  "hover:bg-dex-owned/30 hover:ring-dex-owned/50",
                  "active:scale-95 disabled:opacity-50"
                )}
              >
                <Check size={12} strokeWidth={2.5} />
                {unownedInSelection === count
                  ? count === 1
                    ? "Mark Owned"
                    : `Mark ${count} Owned`
                  : `Mark ${unownedInSelection} Owned`}
              </button>
            )}

            {/* Remove from collection */}
            {ownedInSelection > 0 && (
              <button
                onClick={onUnmark}
                disabled={isApplying}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5",
                  "bg-destructive/10 text-xs font-medium text-destructive/70",
                  "ring-1 ring-destructive/20 transition-all duration-150",
                  "hover:bg-destructive/20 hover:text-destructive",
                  "active:scale-95 disabled:opacity-50"
                )}
              >
                <Trash2 size={12} />
                Remove {ownedInSelection}
              </button>
            )}

            {/* Select all visible */}
            <button
              onClick={onSelectAll}
              className="rounded-lg px-2.5 py-1.5 text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground/80"
            >
              All
            </button>

            {/* Clear selection */}
            <button
              onClick={onClear}
              className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground/70"
              title="Clear selection"
            >
              <X size={13} />
            </button>

            {/* Exit */}
            <div className="border-l border-white/10 pl-2">
              <button
                onClick={onExit}
                className="rounded-lg px-2 py-1.5 font-mono text-[10px] text-muted-foreground/30 transition-colors hover:text-muted-foreground/60"
                title="Exit collection mode"
              >
                Esc
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
