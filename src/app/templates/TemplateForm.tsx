"use client";

import { saveTemplate } from "./actions";
import { useTransition } from "react";
import type { Template, TemplateType } from "@/lib/types";

export function TemplateForm({ template }: { template?: Template }) {
  const [pending, start] = useTransition();
  const type = (template?.type ?? "post") as TemplateType;

  return (
    <form
      action={(fd) => start(() => saveTemplate(fd))}
      className="grid gap-4 max-w-xl"
    >
      {template?.id && <input type="hidden" name="id" value={template.id} />}

      <label className="text-sm">
        Nama template
        <input name="name" required defaultValue={template?.name} className="mt-1" />
      </label>

      <label className="text-sm">
        Tipe
        <select name="type" defaultValue={type} className="mt-1">
          <option value="post">Posting biasa (feed grup)</option>
          <option value="marketplace">Marketplace grup</option>
        </select>
      </label>

      <label className="text-sm">
        Judul (Marketplace / opsional)
        <input name="title" defaultValue={template?.title ?? ""} className="mt-1" />
      </label>

      <label className="text-sm">
        Konten / deskripsi
        <textarea
          name="content"
          required
          rows={5}
          defaultValue={template?.content}
          className="mt-1"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Harga
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={template?.price ?? ""}
            className="mt-1"
          />
        </label>
        <label className="text-sm">
          Mata uang
          <input
            name="currency"
            defaultValue={template?.currency ?? "IDR"}
            className="mt-1"
          />
        </label>
      </div>

      <label className="text-sm">
        Lokasi (Marketplace)
        <input name="location" defaultValue={template?.location ?? ""} className="mt-1" />
      </label>

      <label className="text-sm">
        URL gambar (satu per baris, HTTPS)
        <textarea
          name="image_urls"
          rows={3}
          defaultValue={template?.image_urls?.join("\n") ?? ""}
          placeholder="https://example.com/foto1.jpg"
          className="mt-1 font-mono text-xs"
        />
      </label>

      <button type="submit" disabled={pending} className="btn btn-primary w-fit">
        {pending ? "Menyimpan..." : "Simpan template"}
      </button>
    </form>
  );
}
