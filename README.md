# FB Blast

Panel web untuk antrian blast posting ke grup Facebook. Deploy panel di **Vercel**, database di **Supabase**, bot di folder **worker/** (PC/Railway).

> Otomatisasi Facebook melanggar ToS Meta — risiko blokir akun.

## Mulai cepat

**Deploy panel:** baca [DEPLOY.md](DEPLOY.md) (5 langkah).

**Lokal:**

```bash
npm install
cp .env.example .env.local
# isi 3 variabel Supabase
npm run dev
```

Buka http://localhost:3000

## Struktur repo

```
├── src/              ← Panel Next.js (Vercel deploy dari root)
├── supabase/         ← SQL migration
├── worker/           ← Bot Playwright (terpisah)
├── package.json
└── DEPLOY.md         ← Panduan deploy
```

## Tanpa Supabase?

Panel tetap **bisa dibuka** di Vercel — menampilkan panduan setup. Setelah env diisi + redeploy, dashboard penuh aktif.

## Worker

Lihat [DEPLOY.md](DEPLOY.md) bagian 5.
