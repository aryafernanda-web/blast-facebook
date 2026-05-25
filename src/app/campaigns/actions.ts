"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient, requireSupabase } from "@/lib/supabase/server";

export async function createCampaign(formData: FormData) {
  requireSupabase();
  const name = String(formData.get("name") ?? "").trim();
  const template_id = String(formData.get("template_id") ?? "").trim();
  const delay_seconds = Number(formData.get("delay_seconds") ?? 45);
  const groupIds = formData.getAll("group_ids") as string[];

  if (!name || !template_id || groupIds.length === 0) {
    throw new Error("Nama, template, dan minimal 1 grup wajib");
  }

  const supabase = createServiceClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      name,
      template_id,
      delay_seconds: Math.max(10, delay_seconds),
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !campaign) throw new Error(error?.message ?? "Gagal buat kampanye");

  const links = groupIds.map((group_id) => ({
    campaign_id: campaign.id,
    group_id,
  }));

  const { error: linkErr } = await supabase.from("campaign_groups").insert(links);
  if (linkErr) throw new Error(linkErr.message);

  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}`);
}

export async function queueCampaign(formData: FormData) {
  requireSupabase();
  const id = String(formData.get("id"));
  const supabase = createServiceClient();

  const { error } = await supabase.rpc("queue_campaign", { p_campaign_id: id });
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
  revalidatePath("/");
}

export async function pauseCampaign(formData: FormData) {
  requireSupabase();
  const id = String(formData.get("id"));
  const supabase = createServiceClient();
  await supabase
    .from("campaigns")
    .update({ status: "paused", updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/campaigns/${id}`);
}

export async function deleteCampaign(formData: FormData) {
  requireSupabase();
  const id = String(formData.get("id"));
  const supabase = createServiceClient();
  await supabase.from("campaigns").delete().eq("id", id);
  revalidatePath("/campaigns");
  redirect("/campaigns");
}
