import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "FB Blast Panel",
  description: "Panel blast grup Facebook",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <header className="mb-2">
            <p className="text-xs text-[var(--muted)] mb-4">
              Panel Vercel · Worker Railway/VPS · Gunakan dengan risiko sendiri
            </p>
            <Nav />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
