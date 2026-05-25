export function SetupRequired() {
  return (
    <div className="card space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Panel FB Blast — siap deploy</h1>
      <p className="text-[var(--muted)] text-sm">
        Situs sudah jalan di Vercel. Langkah terakhir: hubungkan database Supabase.
      </p>
      <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
        <li>
          Buat proyek di{" "}
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="text-[#93c5fd] underline"
          >
            supabase.com
          </a>
        </li>
        <li>
          SQL Editor → jalankan file{" "}
          <code className="text-[#93c5fd]">supabase/migrations/20250525000000_initial.sql</code>
        </li>
        <li>
          Vercel → Project → <strong>Settings</strong> → <strong>Environment Variables</strong>
        </li>
        <li>
          Tambahkan (Production + Preview):
          <ul className="list-disc list-inside ml-4 mt-1 text-[var(--muted)]">
            <li>
              <code>NEXT_PUBLIC_SUPABASE_URL</code>
            </li>
            <li>
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </li>
            <li>
              <code>SUPABASE_SERVICE_ROLE_KEY</code>
            </li>
          </ul>
        </li>
        <li>
          Klik <strong>Deployments</strong> → <strong>Redeploy</strong>
        </li>
      </ol>
      <p className="text-xs text-[var(--muted)]">
        Worker Playwright tetap di folder <code>worker/</code> (Railway/VPS), terpisah dari panel ini.
      </p>
    </div>
  );
}
