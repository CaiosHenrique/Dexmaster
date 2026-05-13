import { cn } from "@/lib/utils";

interface DexProgressProps {
  owned: number;
  total: number;
  label?: string;
  variant?: "bar" | "compact";
  className?: string;
}

export function DexProgress({
  owned,
  total,
  label,
  variant = "bar",
  className,
}: DexProgressProps) {
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-dex-muted">
          <div
            className="h-full rounded-full bg-dex-owned transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-pixel text-[8px] text-dex-owned">{pct}%</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        )}
        <div className="ml-auto flex items-baseline gap-1.5">
          <span className="font-pixel text-[10px] text-dex-owned">{owned}</span>
          <span className="text-[10px] text-muted-foreground/60">/ {total}</span>
          <span className="font-pixel text-[9px] text-muted-foreground">
            ({pct}%)
          </span>
        </div>
      </div>

      {/* Progress track with pixel tick marks */}
      <div className="relative h-2.5 overflow-hidden rounded-full bg-dex-muted">
        <div
          className="h-full rounded-full bg-dex-owned transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <div className="pointer-events-none absolute inset-0 flex">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-dex-base/40 last:border-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
