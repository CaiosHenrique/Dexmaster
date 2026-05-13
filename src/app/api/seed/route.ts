import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { seedGames } from "@/lib/pokeapi/seed-games";
import { seedSpecies } from "@/lib/pokeapi/seed-species";
import { seedPokedexes } from "@/lib/pokeapi/seed-pokedexes";

// Uses the service-role key to bypass RLS during seeding.
// SERVICE_ROLE_KEY is SERVER ONLY — never reaches the client bundle.
function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function isAuthorized(req: Request): boolean {
  const secret = process.env.SEED_SECRET;
  if (!secret) return true; // no secret configured → allow (dev only)
  const { searchParams } = new URL(req.url);
  return (
    req.headers.get("Authorization") === `Bearer ${secret}` ||
    searchParams.get("secret") === secret
  );
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    step?: string;
    startId?: number;
    endId?: number;
  };
  const step = body.step ?? "all";
  const supabase = getAdminClient();

  try {
    if (step === "games") {
      return NextResponse.json({ ok: true, ...(await seedGames(supabase)) });
    }
    if (step === "species") {
      const r = await seedSpecies(supabase, {
        startId: body.startId ?? 1,
        endId: body.endId ?? 1025,
      });
      return NextResponse.json({ ok: true, ...r });
    }
    if (step === "pokedexes") {
      return NextResponse.json({ ok: true, ...(await seedPokedexes(supabase)) });
    }
    if (step === "all") {
      const games = await seedGames(supabase);
      const species = await seedSpecies(supabase);
      const pokedexes = await seedPokedexes(supabase);
      return NextResponse.json({ ok: true, games, species, pokedexes });
    }

    return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
  } catch (err) {
    console.error("[seed]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}
