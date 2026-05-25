import { SetupRequired } from "@/components/SetupRequired";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { CampaignForm } from "./CampaignForm";
import type { Group, Template } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = createServiceClient();
  const [{ data: templates }, { data: groups }] = await Promise.all([
    supabase.from("templates").select("id, name, type").order("name"),
    supabase.from("groups").select("id, name, url").eq("is_active", true).order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Kampanye baru</h1>
      <div className="card">
        <CampaignForm
          templates={(templates ?? []) as Pick<Template, "id" | "name" | "type">[]}
          groups={(groups ?? []) as Pick<Group, "id" | "name" | "url">[]}
        />
      </div>
    </div>
  );
}
