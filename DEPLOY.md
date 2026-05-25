# Deploy FB Blast — panduan singkat

## 1. Upload ke GitHub

Upload folder ini (tanpa `node_modules`, tanpa `.next`):

- `src/`, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`
- `supabase/`, `worker/`, `README.md`, `.gitignore`, `.env.example`

## 2. Deploy panel ke Vercel

1. Buka https://vercel.com/new
2. Import repo GitHub
3. **Root Directory: KOSONG** (default, jangan isi `web`)
4. Framework: Next.js (otomatis)
5. Deploy → tunggu **Ready**

Cek: buka `https://NAMA-PROJECT.vercel.app` → harus tampil halaman **Panel FB Blast — siap deploy**, bukan 404 putih.

Cek health: `https://NAMA-PROJECT.vercel.app/api/health` → `{"ok":true,...}`

## 3. Supabase

1. Buat proyek di supabase.com
2. SQL Editor → paste isi `supabase/migrations/20250525000000_initial.sql` → Run
3. Settings → API → copy URL, anon key, service_role key

## 4. Environment Variables di Vercel

Settings → Environment Variables → tambah (Production + Preview):

| Variable | Nilai |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (rahasia) |

**Redeploy** setelah menyimpan.

## 5. Worker (opsional, untuk blast Facebook)

Di PC lokal:

```bash
cd worker
cp ../.env.example .env
# isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY
npm install
npx playwright install chromium
npm run login
npm run build
npm start
```

Atau deploy folder `worker/` ke Railway (Root Directory: `worker`).

---

## Masalah?

| Gejala | Solusi |
|--------|--------|
| 404 NOT_FOUND putih | Root Directory Vercel harus kosong; redeploy commit terbaru |
| Halaman setup kuning/hitam | Normal sebelum env Supabase; ikuti langkah 4 |
| Build gagal | Pastikan `package-lock.json` ada di repo |
