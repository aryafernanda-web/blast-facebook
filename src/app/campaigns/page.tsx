import Link from "next/link";
import { SetupRequired } from "@/components/SetupRequired";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = createServiceClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, templates(name, type)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Kampanye blast</h1>
        <Link href="/campaigns/new" className="btn btn-primary">
          + Kampanye baru
        </Link>
      </div>

      <div className="card">
        {!campaigns?.length ? (
          <p className="text-sm text-[var(--muted)]">Belum ada kampanye.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {(campaigns as Campaign[]).map((c) => {
              const t = c.templates as { name?: string; type?: string } | undefined;
              return (
                <li key={c.id} className="py-4">
                  <Link
                    href={`/campaigns/${c.id}`}
                    className="font-medium hover:text-[#93c5fd] text-lg"
                  >
                    {c.name}
                  </Link>
                  <p className="text-sm text-[var(--muted)] mt-1">
                    {t?.name} ({t?.type}) · jeda {c.delay_seconds}s ·{" "}
                    {c.completed_jobs}/{c.total_jobs} selesai
                    {c.failed_jobs > 0 && (
                      <span className="text-red-400"> · {c.failed_jobs} gagal</span>
                    )}
                  </p>
                  <span className="badge badge-running mt-2 inline-block">{c.status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
