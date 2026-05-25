import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupRequired } from "@/components/SetupRequired";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { queueCampaign, pauseCampaign, deleteCampaign } from "../actions";
import type { Campaign, Job, Template } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, templates(*)")
    .eq("id", id)
    .single();

  if (!campaign) notFound();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, groups(name, url)")
    .eq("campaign_id", id)
    .order("created_at");

  const c = campaign as Campaign & { templates: Template };
  const canQueue = c.status === "draft" || c.status === "paused";

  return (
    <div className="space-y-6">
      <Link href="/campaigns" className="text-sm text-[#93c5fd]">
        ← Kampanye
      </Link>

      <div className="flex flex-wrap justify-between gap-4 items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">{c.name}</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Template: {c.templates.name} ({c.templates.type}) · Jeda worker:{" "}
            {c.delay_seconds}s
          </p>
          <span className="badge badge-running mt-2 inline-block">{c.status}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {canQueue && (
            <form action={queueCampaign}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="btn btn-primary">
                Antrikan blast
              </button>
            </form>
          )}
          {c.status === "running" && (
            <form action={pauseCampaign}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="btn btn-ghost">
                Jeda
              </button>
            </form>
          )}
          {c.status === "draft" && (
            <form action={deleteCampaign}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="btn btn-danger text-sm">
                Hapus
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MiniStat label="Total job" value={c.total_jobs} />
        <MiniStat label="Selesai" value={c.completed_jobs} />
        <MiniStat label="Gagal" value={c.failed_jobs} />
      </div>

      {canQueue && (
        <p className="text-sm text-amber-300 card">
          Klik <strong>Antrikan blast</strong> lalu pastikan worker Railway/VPS sudah
          jalan. Worker akan mengambil job satu per satu.
        </p>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4">Preview konten</h2>
        {c.templates.title && (
          <p className="font-medium">{c.templates.title}</p>
        )}
        <pre className="text-sm whitespace-pre-wrap mt-2 text-[var(--muted)]">
          {c.templates.content}
        </pre>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Jobs ({jobs?.length ?? 0})</h2>
        <ul className="space-y-2 text-sm">
          {(jobs as Job[])?.map((j) => {
            const g = j.groups as { name?: string } | null;
            return (
              <li
                key={j.id}
                className="flex justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <span>{g?.name}</span>
                <span>
                  <JobBadge status={j.status} />
                  {j.error_message && (
                    <span className="text-red-400 ml-2">{j.error_message}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function JobBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "badge-pending",
    processing: "badge-running",
    success: "badge-success",
    failed: "badge-failed",
  };
  return <span className={`badge ${map[status] ?? "badge-pending"}`}>{status}</span>;
}
