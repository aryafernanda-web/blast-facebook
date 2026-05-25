"use client";

import { createCampaign } from "../actions";
import { useTransition } from "react";
import type { Group, Template } from "@/lib/types";

export function CampaignForm({
  templates,
  groups,
}: {
  templates: Pick<Template, "id" | "name" | "type">[];
  groups: Pick<Group, "id" | "name" | "url">[];
}) {
  const [pending, start] = useTransition();

  if (!templates.length) {
    return <p className="text-sm text-amber-400">Buat template dulu.</p>;
  }
  if (!groups.length) {
    return <p className="text-sm text-amber-400">Tambah grup aktif dulu.</p>;
  }

  return (
    <form
      action={(fd) => start(() => createCampaign(fd))}
      className="grid gap-4 max-w-xl"
    >
      <label className="text-sm">
        Nama kampanye
        <input name="name" required placeholder="Blast promo Mei" className="mt-1" />
      </label>

      <label className="text-sm">
        Template
        <select name="template_id" required className="mt-1">
          <option value="">— pilih —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.type})
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Jeda antar grup (detik, min 10)
        <input
          name="delay_seconds"
          type="number"
          min={10}
          defaultValue={45}
          className="mt-1"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium mb-2">Pilih grup</legend>
        <div className="max-h-64 overflow-y-auto border border-[var(--border)] rounded-lg p-3 space-y-2">
          {groups.map((g) => (
            <label key={g.id} className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="group_ids" value={g.id} className="mt-1 w-auto" />
              <span>
                {g.name}
                <span className="block text-xs text-[var(--muted)] truncate">{g.url}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={pending} className="btn btn-primary w-fit">
        {pending ? "Membuat..." : "Buat kampanye (draft)"}
      </button>
    </form>
  );
}
