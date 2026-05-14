# Frontend System — dex.gg

## Design Tokens

All tokens are CSS custom properties defined in `src/app/globals.css` (dark mode only).

### Color Palette

| Token | Tailwind Class | Usage |
|---|---|---|
| `--dex-base` | `bg-dex-base` | Page background — darkest layer |
| `--dex-surface` | `bg-dex-surface` | Card backgrounds, table rows |
| `--dex-elevated` | `bg-dex-elevated` | Hover states, inputs, raised elements |
| `--dex-muted` | `bg-dex-muted` | Subtly raised utility surfaces |
| `--dex-accent` | `text-dex-accent` | Brand blue — links, active states, focus rings |
| `--dex-owned` | `text-dex-owned` | Green — owned indicators, collection mode |
| `--dex-owned-glow` | used in drop-shadow | CSS var for owned sprite glow |
| `--sidebar` | `bg-sidebar` | Sidebar background |

### Typography

- **Body**: system sans stack (Tailwind default)
- **`font-pixel`**: bitmap/retro font loaded via `@font-face`. Always small (`text-[6px]`–`text-[9px]`), `tracking-wider`, uppercase. Used for section labels, dex numbers, status badges, and all "game UI" text.
- **Tabular numbers**: add `tabular-nums` to any numeric value to prevent layout shift on update.

## Component System

### Layout

**`<TopBar>`** — 64px sticky page header.
Props: `title`, `showSearch`, `searchValue`, `onSearchChange`, `collectionMode`, `onToggleCollectionMode`.

**`<Sidebar>`** — 224px left nav.
`NAV_ITEMS` array at the top of `Sidebar.tsx` is the single source of truth for all routes. Adding a new nav item requires only one entry there.

### Pokémon Grid

**`<PokemonCard>`** — the core grid card.
- Normal mode: `onClick` toggles single ownership via `onToggleOwned(formId, !isOwned)`
- Collection mode: `onMouseDown` starts drag-paint; `onMouseEnter` extends it
- `isQueued`: selection ring + `animate-select-pop` bounce
- `isOwned` transition: `animate-owned-burst` glow
- Broken sprite: SVG Pokéball fallback
- Hover: ArrowUpRight detail link (hidden outside collection mode)

**`<CollectionBar>`** — fixed floating bar at `bottom-6 left-1/2`.
- Count = 0: hint state (drag, shift-click, A, Esc)
- Count > 0: action state (Mark N Owned, Remove N, All, Clear, Exit)

**`<DexSelector>`** — horizontal scrolling dex tabs. Reads `DEX_CONFIG_BY_NAME`.

**`<TypeFilter>`** — status (all/owned/missing) + type (18 types) filter row.

### UI Custom

**`<TypeBadge type size>`** — colored pill for a Pokémon type.
Sizes: `xs` (grid cards), `sm` (detail page), `md` (large display).
18 type colors defined in `TYPE_COLORS` record within the component.

**`<DexProgress owned total label>`** — styled progress bar.

**`<PokemonCardSkeleton>`** — shimmer placeholder at the same height as `PokemonCard`.

## Page Layout Pattern

Every dashboard page uses this shell:

```tsx
<div className="flex h-full flex-col overflow-hidden">
  <TopBar title="..." />

  <div className="scrollbar-dex flex-1 overflow-y-auto">
    <div className="px-6 py-4 space-y-6 [mx-auto max-w-4xl]">
      {/* content */}
    </div>
  </div>
</div>
```

- `h-full flex-col overflow-hidden` — fills the sidebar column height, stacks header + scroll area
- Scroll container gets `flex-1 overflow-y-auto` — only the content scrolls, header stays sticky
- Wide grid pages (Pokédex, Trophy Room) omit `max-w-*`; narrow pages (Dashboard, Team, Competitive, Achievements) use `max-w-3xl` or `max-w-4xl`

## Filter/Sort Pattern

```
loadData() on mount → setState(rawEntries)
                           ↓
useMemo(filtered) ← filterState + rawEntries (no re-fetch on filter change)
                           ↓
                     render filtered list
```

Filter controls write to `filterState`. `useMemo` recomputes the view. "Clear" resets all filters to defaults. Supabase is never re-queried on filter changes.

## Animation System

| Tailwind Class | Description |
|---|---|
| `animate-shimmer` | Skeleton shimmer sweep |
| `animate-select-pop` | Card scale bounce when queued |
| `animate-owned-burst` | Ring glow expansion on newly owned card |
| `animate-bar-rise` | CollectionBar slide-up entrance |
| `animate-progress-fill` | Progress bar fill on load |
| `no-select` | Disables text selection during drag-paint |

All defined as `@keyframes` in `globals.css` with Tailwind plugin registration.

## Glassmorphism Utilities

| Class | Effect |
|---|---|
| `.glass` | Frosted-glass card (backdrop-blur + semi-transparent bg) |
| `.glow-owned` | Green shadow glow for collection-mode active elements |
| `.scrollbar-dex` | Thin dark-mode styled scrollbar |

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Page component | `XxxPage()` default export | `export default function PokedexPage()` |
| Sub-components | Local named function in same file | `function CollectionCard({ entry })` |
| Data loaders | `loadXxx(): Promise<T>` | `async function loadCollection()` |
| Mock constants | `MOCK_XXX` or `XXX_DATA` | `const META_DATA: Record<Tier, ...>` |
| Filter types | `type XxxFilter = "all" | "shiny" | "normal"` | |
| DB-facing keys | Always `formId` (not `id` or `dexNumber`) in callbacks | |

## Style Rules

| Rule | Value |
|---|---|
| Page padding | `px-6 py-4` |
| Card gap | `gap-3` (large), `gap-2` (compact grid) |
| Within-card gap | `gap-1.5` |
| Separator borders | `border-white/6` |
| Card borders | `border-white/10` |
| Emphasis borders | `border-white/30` (or type-specific color at `/30`) |
| Hover transitions | `transition-all duration-200` |
| Sprite transforms | `transition-transform duration-300` |
| Progress bars | `transition-all duration-500` or `duration-700` |
| Large card rounding | `rounded-2xl` |
| Standard card rounding | `rounded-xl` |
| Control rounding | `rounded-lg` |
| Badge rounding | `rounded-full` |
| Secondary text | `text-muted-foreground/40` |
| Label/muted text | `text-muted-foreground/50` |
| Ghost/placeholder | `text-muted-foreground/25` or lower |

## Critical formId Rule

**Never pass `dexNumber` (the display number like 25) to ownership callbacks or server actions.** Always use `formId` (the `pokemon_forms.id` primary key). All `PokemonCard` callbacks, `bulkSetOwnership`, and owned-state Set lookups operate on `formId`. The `id` prop on `PokemonCardData` is for display only (`#0025`).
