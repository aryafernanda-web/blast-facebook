import { notFound } from "next/navigation";
import { SetupRequired } from "@/components/SetupRequired";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { TemplateForm } from "../../TemplateForm";
import type { Template } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const { id } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("templates").select("*").eq("id", id).single();

  if (!data) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Edit template</h1>
      <div className="card">
        <TemplateForm template={data as Template} />
      </div>
    </div>
  );
}
