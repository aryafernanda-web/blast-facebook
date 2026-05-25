import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/groups", label: "Grup" },
  { href: "/templates", label: "Template" },
  { href: "/campaigns", label: "Kampanye" },
];

export function Nav() {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-4 mb-6">
      <span className="font-bold text-lg mr-4 text-white">FB Blast</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="px-3 py-1.5 rounded-md text-sm hover:bg-[#1e293b] text-[var(--muted)] hover:text-white"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
