import Link from "next/link";
import { SetupRequired } from "@/components/SetupRequired";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { deleteTemplate } from "./actions";
import type { Template } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = createServiceClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Template</h1>
        <Link href="/templates/new" className="btn btn-primary">
          + Template baru
        </Link>
      </div>

      <div className="card">
        {!templates?.length ? (
          <p className="text-sm text-[var(--muted)]">Belum ada template.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {(templates as Template[]).map((t) => (
              <li key={t.id} className="py-4 flex justify-between gap-4">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {t.name}
                    <span className="badge badge-running">{t.type}</span>
                  </p>
                  {t.title && (
                    <p className="text-sm text-[var(--muted)] mt-1">{t.title}</p>
                  )}
                  <p className="text-sm mt-2 line-clamp-2">{t.content}</p>
                  {t.type === "marketplace" && t.price != null && (
                    <p className="text-sm mt-1 text-[#86efac]">
                      {t.currency} {t.price}
                      {t.location ? ` · ${t.location}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link href={`/templates/${t.id}/edit`} className="btn btn-ghost text-sm">
                    Edit
                  </Link>
                  <form action={deleteTemplate}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="btn btn-ghost text-sm text-red-400 w-full">
                      Hapus
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
