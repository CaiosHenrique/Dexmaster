"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleOwnership(
  formId: number,
  isShiny = false
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("ownerships")
    .select("id")
    .eq("user_id", user.id)
    .eq("form_id", formId)
    .eq("is_shiny", isShiny)
    .eq("is_alpha", false)
    .eq("is_gigantamax", false)
    .maybeSingle();

  if (existing) {
    await supabase.from("ownerships").delete().eq("id", existing.id);
  } else {
    await supabase.from("ownerships").insert({
      user_id: user.id,
      form_id: formId,
      is_shiny: isShiny,
      is_alpha: false,
      is_gigantamax: false,
    });
  }

  revalidatePath("/pokedex");
  return {};
}

export async function bulkSetOwnership(
  formIds: number[],
  owned: boolean,
  isShiny = false
): Promise<{ error?: string }> {
  if (formIds.length === 0) return {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (owned) {
    const rows = formIds.map((form_id) => ({
      user_id: user.id,
      form_id,
      is_shiny: isShiny,
      is_alpha: false,
      is_gigantamax: false,
    }));
    const { error } = await supabase
      .from("ownerships")
      .upsert(rows, { onConflict: "user_id,form_id,is_shiny,is_alpha,is_gigantamax" });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("ownerships")
      .delete()
      .eq("user_id", user.id)
      .in("form_id", formIds)
      .eq("is_shiny", isShiny)
      .eq("is_alpha", false)
      .eq("is_gigantamax", false);
    if (error) return { error: error.message };
  }

  revalidatePath("/pokedex");
  return {};
}
