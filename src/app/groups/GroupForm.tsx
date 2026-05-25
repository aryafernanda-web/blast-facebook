"use client";

import { createGroup } from "./actions";
import { useTransition } from "react";

export function GroupForm() {
  const [pending, start] = useTransition();

  return (
    <form
      action={(fd) => start(() => createGroup(fd))}
      className="grid gap-3 max-w-lg"
    >
      <label className="text-sm">
        Nama grup
        <input name="name" required placeholder="Jual Beli Jakarta" className="mt-1" />
      </label>
      <label className="text-sm">
        URL grup
        <input
          name="url"
          required
          type="url"
          placeholder="https://www.facebook.com/groups/..."
          className="mt-1"
        />
      </label>
      <label className="text-sm">
        Catatan (opsional)
        <input name="notes" className="mt-1" />
      </label>
      <button type="submit" disabled={pending} className="btn btn-primary w-fit">
        {pending ? "Menyimpan..." : "Simpan grup"}
      </button>
    </form>
  );
}
