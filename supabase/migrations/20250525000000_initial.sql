-- FB Blast: schema for panel (Vercel) + worker (Railway/VPS)

create extension if not exists "pgcrypto";

create type template_type as enum ('post', 'marketplace');
create type campaign_status as enum ('draft', 'queued', 'running', 'paused', 'completed', 'failed');
create type job_status as enum ('pending', 'processing', 'success', 'failed', 'skipped');

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type template_type not null default 'post',
  title text,
  content text not null,
  price numeric(12, 2),
  currency text default 'IDR',
  location text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_id uuid not null references templates(id) on delete restrict,
  status campaign_status not null default 'draft',
  delay_seconds integer not null default 45 check (delay_seconds >= 10),
  total_jobs integer not null default 0,
  completed_jobs integer not null default 0,
  failed_jobs integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table campaign_groups (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  primary key (campaign_id, group_id)
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  status job_status not null default 'pending',
  attempt_count integer not null default 0,
  error_message text,
  worker_id text,
  locked_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, group_id)
);

create table job_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  level text not null default 'info',
  message text not null,
  meta jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Facebook session cookies (JSON from Playwright storageState) — worker only
create table facebook_sessions (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'default',
  storage_state jsonb not null,
  is_active boolean not null default true,
  last_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_pending_idx on jobs (status, created_at) where status = 'pending';
create index jobs_campaign_idx on jobs (campaign_id);
create index campaigns_status_idx on campaigns (status);

-- Claim next pending job (worker)
create or replace function claim_next_job(p_worker_id text)
returns setof jobs
language plpgsql
as $$
declare
  v_job jobs%rowtype;
begin
  select j.* into v_job
  from jobs j
  join campaigns c on c.id = j.campaign_id
  where j.status = 'pending'
    and c.status in ('queued', 'running')
  order by j.created_at
  limit 1
  for update of j skip locked;

  if not found then
    return;
  end if;

  update jobs
  set
    status = 'processing',
    worker_id = p_worker_id,
    locked_at = now(),
    started_at = coalesce(started_at, now()),
    attempt_count = attempt_count + 1
  where id = v_job.id
  returning * into v_job;

  update campaigns
  set status = 'running', started_at = coalesce(started_at, now()), updated_at = now()
  where id = v_job.campaign_id and status = 'queued';

  return next v_job;
end;
$$;

-- Queue campaign: create jobs from campaign_groups
create or replace function queue_campaign(p_campaign_id uuid)
returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  insert into jobs (campaign_id, group_id)
  select p_campaign_id, cg.group_id
  from campaign_groups cg
  join groups g on g.id = cg.group_id and g.is_active = true
  on conflict (campaign_id, group_id) do nothing;

  get diagnostics v_count = row_count;

  update campaigns
  set
    status = 'queued',
    total_jobs = (select count(*) from jobs where campaign_id = p_campaign_id),
    updated_at = now()
  where id = p_campaign_id;

  return (select count(*)::integer from jobs where campaign_id = p_campaign_id);
end;
$$;

alter table groups enable row level security;
alter table templates enable row level security;
alter table campaigns enable row level security;
alter table campaign_groups enable row level security;
alter table jobs enable row level security;
alter table job_logs enable row level security;
alter table facebook_sessions enable row level security;

-- Panel uses service role on server; anon read/write for MVP (tighten with auth later)
create policy "allow_all_groups" on groups for all using (true) with check (true);
create policy "allow_all_templates" on templates for all using (true) with check (true);
create policy "allow_all_campaigns" on campaigns for all using (true) with check (true);
create policy "allow_all_campaign_groups" on campaign_groups for all using (true) with check (true);
create policy "allow_all_jobs" on jobs for all using (true) with check (true);
create policy "allow_all_job_logs" on job_logs for all using (true) with check (true);
create policy "deny_sessions_anon" on facebook_sessions for all using (false);
