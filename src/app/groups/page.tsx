import { SetupRequired } from "@/components/SetupRequired";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { GroupForm } from "./GroupForm";
import { deleteGroup } from "./actions";
import type { Group } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = createServiceClient();
  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Grup Facebook</h1>
      <p className="text-sm text-[var(--muted)]">
        URL contoh: https://www.facebook.com/groups/nama-grup
      </p>

      <div className="card">
        <h2 className="font-semibold mb-4">Tambah grup</h2>
        <GroupForm />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Daftar ({groups?.length ?? 0})</h2>
        {!groups?.length ? (
          <p className="text-sm text-[var(--muted)]">Belum ada grup.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {(groups as Group[]).map((g) => (
              <li
                key={g.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="font-medium">{g.name}</p>
                  <a
                    href={g.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#93c5fd] break-all"
                  >
                    {g.url}
                  </a>
                  {!g.is_active && (
                    <span className="badge badge-pending ml-2">nonaktif</span>
                  )}
                </div>
                <form action={deleteGroup}>
                  <input type="hidden" name="id" value={g.id} />
                  <button type="submit" className="btn btn-ghost text-sm text-red-400">
                    Hapus
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
