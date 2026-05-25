import fs from "node:fs";
import path from "node:path";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
} from "playwright";

type StorageState = NonNullable<BrowserContextOptions["storageState"]>;
import { config } from "./config.js";
import type { JobContext } from "./supabase.js";
import { loadStorageStateFromDb } from "./supabase.js";

let browser: Browser | null = null;
let context: BrowserContext | null = null;

async function resolveStorageState(): Promise<StorageState> {
  if (fs.existsSync(config.storagePath)) {
    return config.storagePath;
  }
  const fromDb = await loadStorageStateFromDb();
  if (fromDb) {
    const dir = path.dirname(config.storagePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(config.storagePath, JSON.stringify(fromDb, null, 2));
    return fromDb as StorageState;
  }
  throw new Error(
    "Session Facebook belum ada. Jalankan: npm run login (di folder worker)"
  );
}

export async function getContext(): Promise<BrowserContext> {
  if (context) return context;

  const storage = await resolveStorageState();
  browser = await chromium.launch({
    headless: config.headless,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  context = await browser.newContext({
    storageState: storage,
    viewport: { width: 1280, height: 900 },
    locale: "id-ID",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  return context;
}

export async function closeBrowser() {
  await context?.close();
  await browser?.close();
  context = null;
  browser = null;
}

async function isLoggedIn(page: Page): Promise<boolean> {
  await page.goto("https://www.facebook.com/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  const loginForm = page.locator('input[name="email"]');
  return (await loginForm.count()) === 0;
}

async function downloadImages(urls: string[]): Promise<string[]> {
  const ctx = await getContext();
  const dir = path.join(process.cwd(), "data", "tmp-images");
  fs.mkdirSync(dir, { recursive: true });
  const paths: string[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const p = path.join(dir, `img-${Date.now()}-${i}.jpg`);
    const res = await ctx.request.get(url);
    if (!res.ok()) continue;
    fs.writeFileSync(p, await res.body());
    paths.push(p);
  }
  return paths;
}

async function openGroup(page: Page, groupUrl: string) {
  await page.goto(groupUrl, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForTimeout(3000);
}

async function clickFirstVisible(page: Page, selectors: string[], timeout = 8000) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    try {
      await loc.waitFor({ state: "visible", timeout });
      await loc.click();
      return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

async function fillComposer(page: Page, text: string) {
  const editors = [
    '[contenteditable="true"][role="textbox"]',
    'div[aria-label*="Write something"]',
    'div[aria-label*="Tulis sesuatu"]',
    'div[aria-label*="Create a public post"]',
    'div[aria-label*="Buat postingan publik"]',
    '[data-lexical-editor="true"]',
  ];

  for (const sel of editors) {
    const el = page.locator(sel).first();
    if ((await el.count()) > 0) {
      await el.click();
      await el.fill(text);
      return;
    }
  }

  throw new Error("Kotak posting grup tidak ditemukan — UI Facebook mungkin berubah");
}

async function attachPhotos(page: Page, imagePaths: string[]) {
  if (!imagePaths.length) return;

  const fileInputs = page.locator('input[type="file"]');
  const count = await fileInputs.count();
  if (count === 0) {
    await clickFirstVisible(page, [
      '[aria-label="Photo/video"]',
      '[aria-label="Foto/video"]',
      'div[aria-label*="Photo"]',
    ]);
    await page.waitForTimeout(1500);
  }

  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(imagePaths);
  await page.waitForTimeout(2000);
}

async function submitPost(page: Page) {
  const posted = await clickFirstVisible(page, [
    'div[aria-label="Post"][role="button"]',
    'div[aria-label="Posting"][role="button"]',
    'span:has-text("Post")',
    'span:has-text("Posting")',
  ]);

  if (!posted) {
    throw new Error("Tombol Posting tidak ditemukan");
  }
  await page.waitForTimeout(5000);
}

export async function postRegular(ctx: JobContext, page: Page) {
  await openGroup(page, ctx.groupUrl);

  const opened = await clickFirstVisible(page, [
    'span:has-text("Write something")',
    'span:has-text("Tulis sesuatu")',
    'div[role="button"]:has-text("Write something")',
    '[aria-label*="Write something"]',
    '[aria-label*="Tulis sesuatu"]',
  ]);

  if (!opened) {
    await clickFirstVisible(page, [
      'div[role="button"] >> text=/Write|Tulis|Create|Buat/i',
    ]);
  }

  await page.waitForTimeout(1500);

  const body = ctx.template.title
    ? `${ctx.template.title}\n\n${ctx.template.content}`
    : ctx.template.content;

  await fillComposer(page, body);

  const images = await downloadImages(ctx.template.image_urls);
  if (images.length) await attachPhotos(page, images);

  await submitPost(page);
}

export async function postMarketplace(ctx: JobContext, page: Page) {
  await openGroup(page, ctx.groupUrl);

  const mpOpened = await clickFirstVisible(page, [
    'a[href*="marketplace"]',
    'span:has-text("Marketplace")',
    '[aria-label*="Marketplace"]',
  ]);

  if (!mpOpened) {
    const sellUrl = ctx.groupUrl.replace(/\/?$/, "/buy_sell_discussion");
    await page.goto(sellUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(3000);
  }

  await clickFirstVisible(page, [
    'span:has-text("Sell Something")',
    'span:has-text("Jual Barang")',
    'span:has-text("Create listing")',
    'span:has-text("Buat listing")',
    'a:has-text("Sell")',
  ]);

  await page.waitForTimeout(2000);

  const title = ctx.template.title ?? "Item";
  const priceStr =
    ctx.template.price != null
      ? String(ctx.template.price)
      : "0";

  const titleInput = page.locator(
    'input[aria-label*="Title"], input[placeholder*="Title"], input[aria-label*="Judul"]'
  );
  if ((await titleInput.count()) > 0) {
    await titleInput.first().fill(title);
  }

  const priceInput = page.locator(
    'input[aria-label*="Price"], input[placeholder*="Price"], input[aria-label*="Harga"]'
  );
  if ((await priceInput.count()) > 0) {
    await priceInput.first().fill(priceStr);
  }

  await fillComposer(page, ctx.template.content);

  if (ctx.template.location) {
    const loc = page.locator(
      'input[aria-label*="Location"], input[placeholder*="Location"], input[aria-label*="Lokasi"]'
    );
    if ((await loc.count()) > 0) await loc.first().fill(ctx.template.location);
  }

  const images = await downloadImages(ctx.template.image_urls);
  if (images.length) await attachPhotos(page, images);

  await submitPost(page);
}

export async function runPost(ctx: JobContext) {
  const browserCtx = await getContext();
  const page = await browserCtx.newPage();

  try {
    if (!(await isLoggedIn(page))) {
      throw new Error("Session expired — jalankan npm run login lagi");
    }

    if (ctx.template.type === "marketplace") {
      await postMarketplace(ctx, page);
    } else {
      await postRegular(ctx, page);
    }
  } finally {
    await page.close();
  }
}
