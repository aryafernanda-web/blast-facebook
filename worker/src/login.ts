/**
 * Login manual sekali — simpan cookie ke file + Supabase.
 * Jalankan di PC/VPS dengan HEADLESS=false:
 *   npm run login
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { chromium } from "playwright";
import { config } from "./config.js";
import { uploadStorageState } from "./supabase.js";

async function prompt(msg: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise<string>((resolve) => {
    rl.question(msg, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function main() {
  const dir = path.dirname(config.storagePath);
  fs.mkdirSync(dir, { recursive: true });

  console.log("Browser akan terbuka. Login Facebook secara manual.");
  console.log("Setelah feed utama tampil, kembali ke terminal dan tekan Enter.\n");

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "id-ID",
  });

  const page = await context.newPage();
  await page.goto("https://www.facebook.com/login", {
    waitUntil: "domcontentloaded",
  });

  await prompt("Tekan Enter setelah login berhasil... ");

  const state = await context.storageState();
  fs.writeFileSync(config.storagePath, JSON.stringify(state, null, 2));
  console.log(`Disimpan ke ${config.storagePath}`);

  try {
    await uploadStorageState(state);
    console.log("Di-upload ke Supabase (facebook_sessions).");
  } catch (e) {
    console.warn("Gagal upload ke Supabase (cek env):", e);
  }

  await browser.close();
  console.log("Selesai.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
