export type TemplateType = "post" | "marketplace";
export type CampaignStatus =
  | "draft"
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed";
export type JobStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "skipped";

export interface Group {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  title: string | null;
  content: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  image_urls: string[];
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  template_id: string;
  status: CampaignStatus;
  delay_seconds: number;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  created_at: string;
  templates?: Pick<Template, "name" | "type">;
}

export interface Job {
  id: string;
  campaign_id: string;
  group_id: string;
  status: JobStatus;
  error_message: string | null;
  created_at: string;
  groups?: Pick<Group, "name" | "url">;
}
