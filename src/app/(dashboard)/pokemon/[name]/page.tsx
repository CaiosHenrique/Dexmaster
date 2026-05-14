"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { TypeBadge, type PokemonType } from "@/components/ui-custom/TypeBadge";
import { cn } from "@/lib/utils";
import type { Species, PokemonForm } from "@/types/database";
import { toggleOwnership } from "@/app/actions/ownership";

// ── Config ─────────────────────────────────────────────────────────────────────

const STAT_CONFIG = [
  { key: "hp",  label: "HP",      max: 255, color: "#63BB5B" },
  { key: "atk", label: "Attack",  max: 190, color: "#FF6B35" },
  { key: "def", label: "Defense", max: 250, color: "#5090D6" },
  { key: "spa", label: "Sp. Atk", max: 194, color: "#AB5AC1" },
  { key: "spd", label: "Sp. Def", max: 250, color: "#74CEC0" },
  { key: "spe", label: "Speed",   max: 200, color: "#F4D03F" },
] as const;

interface FormOwnership {
  owned: boolean;
  shinyOwned: boolean;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PokemonDetailPage() {
  const params = useParams();
  const slug = params.name as string;

  const [species, setSpecies] = useState<Species | null>(null);
  const [forms, setForms] = useState<PokemonForm[]>([]);
  const [ownerships, setOwnerships] = useState<Map<number, FormOwnership>>(new Map());
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      const supabase = createClient();

      const { data: speciesData } = await supabase
        .from("pokemon_species")
        .select("*")
        .eq("name", slug)
        .maybeSingle();

      if (cancelled || !speciesData) {
        if (!cancelled) setLoading(false);
        return;
      }
      setSpecies(speciesData);

      const { data: formsData } = await supabase
        .from("pokemon_forms")
        .select("*")
        .eq("species_id", speciesData.id)
        .order("is_default", { ascending: false });

      if (cancelled) return;
      const resolvedForms = formsData ?? [];
      setForms(resolvedForms);

      const { data: { user } } = await supabase.auth.getUser();
      if (user && resolvedForms.length) {
        const formIds = resolvedForms.map((f) => f.id);
        const { data: owned } = await supabase
          .from("ownerships")
          .select("form_id, is_shiny")
          .eq("user_id", user.id)
          .in("form_id", formIds)
          .eq("is_alpha", false)
          .eq("is_gigantamax", false);

        if (!cancelled) {
          const map = new Map<number, FormOwnership>();
          resolvedForms.forEach((f) => map.set(f.id, { owned: false, shinyOwned: false }));
          owned?.forEach((o) => {
            const entry = map.get(o.form_id);
            if (!entry) return;
            if (o.is_shiny) entry.shinyOwned = true;
            else entry.owned = true;
          });
          setOwnerships(map);
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  function handleToggle(formId: number, isShiny: boolean) {
    setOwnerships((prev) => {
      const next = new Map(prev);
      const entry = next.get(formId) ?? { owned: false, shinyOwned: false };
      const updated = { ...entry };
      if (isShiny) updated.shinyOwned = !entry.shinyOwned;
      else updated.owned = !entry.owned;
      next.set(formId, updated);
      return next;
    });
    startTransition(() => { toggleOwnership(formId, isShiny); });
  }

  const defaultForm = forms.find((f) => f.is_default) ?? forms[0];
  const otherForms = forms.filter((f) => !f.is_default);
  const primaryType = defaultForm?.types[0];
  const defaultOwn = defaultForm
    ? (ownerships.get(defaultForm.id) ?? { owned: false, shinyOwned: false })
    : null;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dex-elevated border-t-dex-accent" />
      </div>
    );
  }

  if (!species || !defaultForm) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">Pokémon not found.</p>
        <Link href="/pokedex" className="text-sm text-dex-accent hover:underline">
          ← Back to Pokédex
        </Link>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Breadcrumb */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/6 px-6 py-4">
        <Link
          href="/pokedex"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Pokédex
        </Link>
        <span className="text-muted-foreground/30">/</span>
        <span className="text-sm font-medium">{species.display_name}</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-dex">
        <div className="mx-auto max-w-2xl px-6 py-8">

          {/* ── Hero ────────────────────────────────────────────────────────── */}
          <div className="mb-10 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
            {/* Artwork panel */}
            <div className="shrink-0">
              <div
                className="flex h-52 w-52 items-center justify-center rounded-2xl border border-white/6"
                style={primaryType ? {
                  background: `radial-gradient(ellipse at 50% 65%, color-mix(in srgb, var(--color-type-${primaryType}) 16%, transparent) 0%, transparent 68%)`,
                } : undefined}
              >
                {defaultForm.artwork_url ? (
                  <Image
                    src={defaultForm.artwork_url}
                    alt={species.display_name}
                    width={200}
                    height={200}
                    className="object-contain drop-shadow-[0_8px_28px_rgba(0,0,0,0.5)] animate-float"
                    unoptimized
                  />
                ) : defaultForm.sprite_default ? (
                  <Image
                    src={defaultForm.sprite_default}
                    alt={species.display_name}
                    width={96}
                    height={96}
                    className="object-contain"
                    style={{ imageRendering: "pixelated" }}
                    unoptimized
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-dex-elevated" />
                )}
              </div>
            </div>

            {/* Identity + ownership */}
            <div className="flex min-w-0 flex-col gap-4 text-center sm:text-left">
              <div>
                <p className="font-pixel text-[8px] tracking-widest text-muted-foreground/40">
                  #{String(species.id).padStart(4, "0")}
                </p>
                <h1 className="mt-0.5 text-3xl font-bold tracking-tight">
                  {species.display_name}
                </h1>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {defaultForm.types.map((t) => (
                  <TypeBadge key={t} type={t as PokemonType} size="sm" />
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {species.is_legendary && <SpeciesFlag color="yellow" label="Legendary" />}
                {species.is_mythical && <SpeciesFlag color="purple" label="Mythical" />}
                {species.is_baby && <SpeciesFlag color="pink" label="Baby" />}
              </div>

              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <OwnButton
                  owned={defaultOwn?.owned ?? false}
                  onClick={() => handleToggle(defaultForm.id, false)}
                  label={defaultOwn?.owned ? "Owned" : "Mark owned"}
                  activeClass="bg-dex-owned/15 text-dex-owned ring-dex-owned/30 hover:bg-dex-owned/20"
                />
                <OwnButton
                  owned={defaultOwn?.shinyOwned ?? false}
                  onClick={() => handleToggle(defaultForm.id, true)}
                  label={defaultOwn?.shinyOwned ? "Shiny owned" : "Shiny"}
                  icon={<Sparkles size={14} />}
                  activeClass="bg-yellow-500/15 text-yellow-400 ring-yellow-500/30 hover:bg-yellow-500/20"
                />
              </div>
            </div>
          </div>

          {/* ── Base Stats ──────────────────────────────────────────────────── */}
          <Section label="Base Stats">
            <div className="space-y-3">
              {STAT_CONFIG.map(({ key, label, max, color }) => {
                const value = defaultForm.base_stats[key as keyof typeof defaultForm.base_stats] as number;
                return (
                  <div key={key} className="grid grid-cols-[5.5rem_2.5rem_1fr] items-center gap-3">
                    <span className="text-right text-[11px] text-muted-foreground">{label}</span>
                    <span className="text-right font-pixel text-[10px] tabular-nums">{value}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-dex-elevated">
                      <div
                        className="h-full rounded-full animate-progress-fill"
                        style={{
                          width: `${Math.min(100, Math.round((value / max) * 100))}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="grid grid-cols-[5.5rem_2.5rem_1fr] items-center gap-3 border-t border-white/6 pt-3">
                <span className="text-right text-[11px] font-semibold text-muted-foreground">Total</span>
                <span className="text-right font-pixel text-[10px] font-bold tabular-nums">
                  {defaultForm.base_stats.total}
                </span>
                <div />
              </div>
            </div>
          </Section>

          {/* ── Profile ─────────────────────────────────────────────────────── */}
          <Section label="Profile">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {defaultForm.height != null && (
                <MiniStat label="Height" value={`${(defaultForm.height / 10).toFixed(1)} m`} />
              )}
              {defaultForm.weight != null && (
                <MiniStat label="Weight" value={`${(defaultForm.weight / 10).toFixed(1)} kg`} />
              )}
              <MiniStat label="Generation" value={`Gen ${romanNumeral(species.generation)}`} />
            </div>
          </Section>

          {/* ── Abilities ───────────────────────────────────────────────────── */}
          {defaultForm.abilities.length > 0 && (
            <Section label="Abilities">
              <div className="flex flex-wrap gap-2">
                {defaultForm.abilities.map((a) => (
                  <div
                    key={a.name}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2",
                      a.is_hidden
                        ? "border-dex-accent/20 bg-dex-accent/5"
                        : "border-white/8 bg-dex-elevated"
                    )}
                  >
                    <span className="text-sm capitalize">{a.name.replace(/-/g, " ")}</span>
                    {a.is_hidden && (
                      <span className="font-pixel text-[7px] text-dex-accent/70">HIDDEN</span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── Alternate Forms ──────────────────────────────────────────────── */}
          {otherForms.length > 0 && (
            <Section label="Forms">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {otherForms.map((form) => {
                  const own = ownerships.get(form.id) ?? { owned: false, shinyOwned: false };
                  return (
                    <div
                      key={form.id}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                        own.owned
                          ? "border-dex-owned/25 bg-dex-elevated"
                          : "border-white/5 bg-dex-elevated/50"
                      )}
                    >
                      {form.sprite_default ? (
                        <Image
                          src={form.sprite_default}
                          alt={form.display_name}
                          width={64}
                          height={64}
                          className={cn("object-contain", !own.owned && "pokemon-missing")}
                          style={{ imageRendering: "pixelated" }}
                          unoptimized
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-dex-elevated" />
                      )}
                      <span className="text-center text-xs font-medium leading-snug">
                        {form.display_name}
                      </span>
                      <div className="flex flex-wrap justify-center gap-1">
                        {form.types.map((t) => (
                          <TypeBadge key={t} type={t as PokemonType} size="xs" />
                        ))}
                      </div>
                      <OwnButton
                        owned={own.owned}
                        onClick={() => handleToggle(form.id, false)}
                        label={own.owned ? "Owned" : "Mark owned"}
                        activeClass="bg-dex-owned/15 text-dex-owned ring-dex-owned/30"
                        small
                      />
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 font-pixel text-[8px] uppercase tracking-widest text-muted-foreground/50">
        {label}
      </h2>
      <div className="rounded-xl border border-white/6 bg-dex-surface p-5">{children}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/6 bg-dex-elevated p-4">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function OwnButton({
  owned,
  onClick,
  label,
  icon,
  activeClass,
  small = false,
}: {
  owned: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  activeClass: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg font-medium ring-1 transition-all duration-150",
        small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        owned
          ? activeClass
          : "bg-dex-elevated text-muted-foreground ring-white/10 hover:text-foreground"
      )}
    >
      {icon ?? (owned ? <CheckCircle2 size={small ? 11 : 14} /> : <Circle size={small ? 11 : 14} />)}
      {label}
    </button>
  );
}

function SpeciesFlag({ color, label }: { color: "yellow" | "purple" | "pink"; label: string }) {
  const styles: Record<string, string> = {
    yellow: "bg-yellow-500/10 text-yellow-400/80 ring-yellow-500/20",
    purple: "bg-purple-500/10 text-purple-400/80 ring-purple-500/20",
    pink:   "bg-pink-500/10  text-pink-400/80   ring-pink-500/20",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1", styles[color])}>
      {label}
    </span>
  );
}

function romanNumeral(n: number): string {
  const map: Record<number, string> = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V",
    6: "VI", 7: "VII", 8: "VIII", 9: "IX",
  };
  return map[n] ?? String(n);
}
