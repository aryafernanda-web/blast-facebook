"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient, requireSupabase } from "@/lib/supabase/server";
import type { TemplateType } from "@/lib/types";

function parseImages(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function saveTemplate(formData: FormData) {
  requireSupabase();
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "post") as TemplateType;
  const title = String(formData.get("title") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const currency = String(formData.get("currency") ?? "IDR").trim() || "IDR";
  const location = String(formData.get("location") ?? "").trim() || null;
  const image_urls = parseImages(String(formData.get("image_urls") ?? ""));

  if (!name || !content) throw new Error("Nama dan konten wajib");

  const payload = {
    name,
    type,
    title,
    content,
    price: priceRaw ? Number(priceRaw) : null,
    currency,
    location,
    image_urls,
    updated_at: new Date().toISOString(),
  };

  const supabase = createServiceClient();

  if (id) {
    const { error } = await supabase.from("templates").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/templates");
    redirect(`/templates/${id}/edit`);
  }

  const { error } = await supabase.from("templates").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/templates");
  redirect("/templates");
}

export async function deleteTemplate(formData: FormData) {
  requireSupabase();
  const id = String(formData.get("id"));
  const supabase = createServiceClient();
  await supabase.from("templates").delete().eq("id", id);
  revalidatePath("/templates");
}
