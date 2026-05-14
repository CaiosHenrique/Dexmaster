export function PokemonCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-dex-surface/50 p-3">
      <div className="h-2 w-7 self-start rounded bg-dex-elevated animate-pulse" />
      <div className="h-16 w-16 rounded-lg bg-dex-elevated animate-pulse" />
      <div className="h-2.5 w-14 rounded bg-dex-elevated animate-pulse" />
      <div className="h-3.5 w-10 rounded-full bg-dex-elevated animate-pulse" />
    </div>
  );
}
