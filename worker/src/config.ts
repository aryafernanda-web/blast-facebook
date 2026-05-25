import "dotenv/config";
import path from "node:path";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const config = {
  supabaseUrl: req("SUPABASE_URL"),
  supabaseServiceKey: req("SUPABASE_SERVICE_ROLE_KEY"),
  workerId: process.env.WORKER_ID ?? `worker-${process.pid}`,
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 5000),
  delayBetweenJobsMs: Number(process.env.DELAY_BETWEEN_JOBS_MS ?? 45000),
  headless: process.env.HEADLESS !== "false",
  storagePath:
    process.env.FB_STORAGE_PATH ??
    path.join(process.cwd(), "data", "fb-storage.json"),
  maxAttempts: Number(process.env.MAX_JOB_ATTEMPTS ?? 2),
};
