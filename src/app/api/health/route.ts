import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET() {
  return Response.json({
    ok: true,
    app: "fb-blast-panel",
    supabase: isSupabaseConfigured(),
  });
}
