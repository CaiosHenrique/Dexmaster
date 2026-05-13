import { cn } from "@/lib/utils";

export type PokemonType =
  | "normal" | "fire" | "water" | "electric" | "grass" | "ice"
  | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug"
  | "rock" | "ghost" | "dragon" | "dark" | "steel" | "fairy";

interface TypeBadgeProps {
  type: PokemonType;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const TYPE_LABELS: Record<PokemonType, string> = {
  normal: "Normal",   fire: "Fire",     water: "Water",   electric: "Electric",
  grass: "Grass",     ice: "Ice",       fighting: "Fight", poison: "Poison",
  ground: "Ground",   flying: "Flying", psychic: "Psychic",bug: "Bug",
  rock: "Rock",       ghost: "Ghost",   dragon: "Dragon",  dark: "Dark",
  steel: "Steel",     fairy: "Fairy",
};

export function TypeBadge({ type, size = "sm", className }: TypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium uppercase tracking-wide text-white/90 shadow-sm",
        `bg-type-${type}`,
        size === "xs" && "px-1.5 py-0.5 text-[9px]",
        size === "sm" && "px-2.5 py-1 text-[10px]",
        size === "md" && "px-3 py-1.5 text-xs",
        className
      )}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}
