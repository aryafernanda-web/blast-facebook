import Link from "next/link";
import { SetupRequired } from "@/components/SetupRequired";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return <SetupRequired />;
  }

  const supabase = createServiceClient();

  const [
    { count: groupCount },
    { count: templateCount },
    { data: campaigns },
    { data: recentJobs },
  ] = await Promise.all([
    supabase.from("groups").select("*", { count: "exact", head: true }),
    supabase.from("templates").select("*", { count: "exact", head: true }),
    supabase
      .from("campaigns")
      .select("id, name, status, total_jobs, completed_jobs, failed_jobs")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("jobs")
      .select("id, status, error_message, created_at, groups(name)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const running =
    campaigns?.filter((c) => c.status === "running" || c.status === "queued")
      .length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Grup aktif" value={groupCount ?? 0} href="/groups" />
        <Stat label="Template" value={templateCount ?? 0} href="/templates" />
        <Stat label="Kampanye aktif" value={running} href="/campaigns" />
        <div className="card">
          <p className="text-sm text-[var(--muted)]">Worker</p>
          <p className="text-lg font-semibold mt-1">Railway / VPS</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Folder <code className="text-[#93c5fd]">worker/</code> di repo
          </p>
        </div>
      </div>

      <section className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Kampanye terbaru</h2>
          <Link href="/campaigns/new" className="btn btn-primary text-sm">
            + Kampanye baru
          </Link>
        </div>
        {!campaigns?.length ? (
          <p className="text-[var(--muted)] text-sm">Belum ada kampanye.</p>
        ) : (
          <ul className="space-y-2">
            {campaigns.map((c) => (
              <li
                key={c.id}
                className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0"
              >
                <Link
                  href={`/campaigns/${c.id}`}
                  className="hover:text-[#93c5fd] font-medium"
                >
                  {c.name}
                </Link>
                <span className="text-sm text-[var(--muted)]">
                  <StatusBadge status={c.status} /> · {c.completed_jobs}/
                  {c.total_jobs}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold text-lg mb-4">Job terakhir</h2>
        {!recentJobs?.length ? (
          <p className="text-[var(--muted)] text-sm">Belum ada job.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentJobs.map((j) => {
              const g = j.groups as { name?: string } | null;
              return (
                <li key={j.id} className="flex justify-between gap-4">
                  <span>{g?.name ?? "Grup"}</span>
                  <span>
                    <JobBadge status={j.status} />
                    {j.error_message && (
                      <span className="text-[var(--danger)] ml-2 truncate max-w-[200px] inline-block align-bottom">
                        {j.error_message}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="card hover:border-[#3b82f6] transition-colors">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="text-3xl font-bold mt-1 text-white">{value}</p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "badge-pending",
    queued: "badge-running",
    running: "badge-running",
    completed: "badge-success",
    failed: "badge-failed",
    paused: "badge-pending",
  };
  return <span className={`badge ${map[status] ?? "badge-pending"}`}>{status}</span>;
}

function JobBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "badge-pending",
    processing: "badge-running",
    success: "badge-success",
    failed: "badge-failed",
    skipped: "badge-pending",
  };
  return <span className={`badge ${map[status] ?? "badge-pending"}`}>{status}</span>;
}
