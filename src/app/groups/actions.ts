"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, requireSupabase } from "@/lib/supabase/server";

export async function createGroup(formData: FormData) {
  requireSupabase();
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name || !url) {
    throw new Error("Nama dan URL wajib diisi");
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("groups").insert({ name, url, notes });
  if (error) throw new Error(error.message);

  revalidatePath("/groups");
  revalidatePath("/");
}

export async function deleteGroup(formData: FormData) {
  requireSupabase();
  const id = String(formData.get("id"));
  const supabase = createServiceClient();
  await supabase.from("groups").delete().eq("id", id);
  revalidatePath("/groups");
  revalidatePath("/");
}
