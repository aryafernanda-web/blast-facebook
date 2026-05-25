import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config.js";

let client: SupabaseClient | null = null;

export function getSupabase() {
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export interface JobRow {
  id: string;
  campaign_id: string;
  group_id: string;
  status: string;
  attempt_count: number;
}

export interface JobContext {
  job: JobRow;
  groupUrl: string;
  groupName: string;
  template: {
    type: "post" | "marketplace";
    title: string | null;
    content: string;
    price: number | null;
    currency: string | null;
    location: string | null;
    image_urls: string[];
  };
  delaySeconds: number;
}

export async function claimNextJob(): Promise<JobContext | null> {
  const sb = getSupabase();
  const { data: jobs, error } = await sb.rpc("claim_next_job", {
    p_worker_id: config.workerId,
  });

  if (error) throw new Error(`claim_next_job: ${error.message}`);
  const job = (jobs as JobRow[] | null)?.[0];
  if (!job) return null;

  const { data: group } = await sb
    .from("groups")
    .select("name, url")
    .eq("id", job.group_id)
    .single();

  const { data: campaign } = await sb
    .from("campaigns")
    .select("delay_seconds, template_id, templates(*)")
    .eq("id", job.campaign_id)
    .single();

  const rawTemplate = campaign?.templates;
  const t = (
    Array.isArray(rawTemplate) ? rawTemplate[0] : rawTemplate
  ) as JobContext["template"] | null | undefined;

  if (!group || !campaign || !t) return null;

  return {
    job,
    groupUrl: group.url,
    groupName: group.name,
    template: {
      type: t.type,
      title: t.title,
      content: t.content,
      price: t.price,
      currency: t.currency,
      location: t.location,
      image_urls: t.image_urls ?? [],
    },
    delaySeconds: campaign.delay_seconds ?? 45,
  };
}

export async function logJob(
  jobId: string,
  level: string,
  message: string,
  meta?: Record<string, unknown>
) {
  await getSupabase().from("job_logs").insert({
    job_id: jobId,
    level,
    message,
    meta: meta ?? {},
  });
}

export async function completeJob(
  jobId: string,
  campaignId: string,
  ok: boolean,
  errorMessage?: string
) {
  const sb = getSupabase();
  const now = new Date().toISOString();

  await sb
    .from("jobs")
    .update({
      status: ok ? "success" : "failed",
      error_message: errorMessage ?? null,
      completed_at: now,
    })
    .eq("id", jobId);

  const { data: campaign } = await sb
    .from("campaigns")
    .select("completed_jobs, failed_jobs, total_jobs")
    .eq("id", campaignId)
    .single();

  if (campaign) {
    const completed_jobs = campaign.completed_jobs + (ok ? 1 : 0);
    const failed_jobs = campaign.failed_jobs + (ok ? 0 : 1);
    const done = completed_jobs + failed_jobs >= campaign.total_jobs;

    const updates: Record<string, unknown> = {
      updated_at: now,
      completed_jobs,
      failed_jobs,
    };

    if (done) {
      updates.status = failed_jobs > 0 ? "failed" : "completed";
      updates.completed_at = now;
    }

    await sb.from("campaigns").update(updates).eq("id", campaignId);
  }
}

export async function releaseJobToPending(jobId: string, error: string) {
  await getSupabase()
    .from("jobs")
    .update({
      status: "pending",
      error_message: error,
      locked_at: null,
      worker_id: null,
    })
    .eq("id", jobId);
}

export async function uploadStorageState(storageState: object) {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("facebook_sessions")
    .select("id")
    .eq("label", "default")
    .maybeSingle();

  if (existing?.id) {
    await sb
      .from("facebook_sessions")
      .update({
        storage_state: storageState,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await sb.from("facebook_sessions").insert({
      label: "default",
      storage_state: storageState,
      is_active: true,
    });
  }
}

export async function loadStorageStateFromDb(): Promise<object | null> {
  const { data } = await getSupabase()
    .from("facebook_sessions")
    .select("storage_state")
    .eq("label", "default")
    .eq("is_active", true)
    .maybeSingle();

  return (data?.storage_state as object) ?? null;
}
