import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./env";

export { isSupabaseConfigured };

export function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi di Vercel Environment Variables.");
  }
}

export function createServiceClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan environment variables di Vercel lalu Redeploy."
    );
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
