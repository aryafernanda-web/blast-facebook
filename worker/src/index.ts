import { config } from "./config.js";
import {
  claimNextJob,
  completeJob,
  logJob,
  releaseJobToPending,
} from "./supabase.js";
import { closeBrowser, runPost } from "./poster.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processLoop() {
  console.log(`[worker] ${config.workerId} started`);
  console.log(`[worker] poll=${config.pollIntervalMs}ms delay=${config.delayBetweenJobsMs}ms`);

  while (true) {
    try {
      const ctx = await claimNextJob();

      if (!ctx) {
        await sleep(config.pollIntervalMs);
        continue;
      }

      console.log(`[worker] job ${ctx.job.id} → ${ctx.groupName}`);
      await logJob(ctx.job.id, "info", `Memproses grup: ${ctx.groupName}`);

      try {
        await runPost(ctx);
        await completeJob(ctx.job.id, ctx.job.campaign_id, true);
        await logJob(ctx.job.id, "info", "Berhasil");
        console.log(`[worker] job ${ctx.job.id} OK`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[worker] job ${ctx.job.id} FAIL:`, msg);
        await logJob(ctx.job.id, "error", msg);

        if (ctx.job.attempt_count < config.maxAttempts) {
          await releaseJobToPending(ctx.job.id, msg);
        } else {
          await completeJob(ctx.job.id, ctx.job.campaign_id, false, msg);
        }
      }

      const delay = Math.max(
        ctx.delaySeconds * 1000,
        config.delayBetweenJobsMs
      );
      console.log(`[worker] tunggu ${delay / 1000}s sebelum job berikutnya`);
      await sleep(delay);
    } catch (err) {
      console.error("[worker] loop error:", err);
      await sleep(config.pollIntervalMs);
    }
  }
}

process.on("SIGINT", async () => {
  await closeBrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeBrowser();
  process.exit(0);
});

processLoop().catch((e) => {
  console.error(e);
  process.exit(1);
});
