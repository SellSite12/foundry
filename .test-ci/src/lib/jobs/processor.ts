import { db } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { claimPendingJobs, completeJob, failJob } from "@/lib/jobs/queue";
import { deliverWebhook } from "@/lib/webhooks/delivery";
import { generateReportFile } from "@/lib/reports/generate";
import { refreshStoreInsights } from "@/lib/ai/insights";
import { dispatchAutomation } from "@/lib/automation/dispatcher";

type JobPayload = Record<string, unknown>;

async function handleJob(type: string, payload: JobPayload): Promise<void> {
  switch (type) {
    case "email.send": {
      const { to, subject, text, html } = payload as {
        to: string;
        subject: string;
        text: string;
        html?: string;
      };
      await sendMail({ to, subject, text, html: html ?? text });
      break;
    }
    case "webhook.deliver": {
      const { deliveryId } = payload as { deliveryId: string };
      await deliverWebhook(deliveryId);
      break;
    }
    case "report.generate": {
      const { reportId, runId } = payload as { reportId: string; runId: string };
      await generateReportFile(reportId, runId);
      break;
    }
    case "insights.refresh": {
      const { storeId } = payload as { storeId: string };
      await refreshStoreInsights(storeId);
      break;
    }
    case "automation.run": {
      const { trigger, storeId, context } = payload as {
        trigger: string;
        storeId: string;
        context?: Record<string, unknown>;
      };
      await dispatchAutomation(trigger, storeId, context ?? {});
      break;
    }
    case "import.process": {
      const { storeId, kind, rows } = payload as {
        storeId: string;
        kind: string;
        rows: Record<string, unknown>[];
      };
      if (kind === "products") {
        for (const row of rows) {
          const name = String(row.name ?? "").trim();
          if (!name) continue;
          const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
          await db.product.create({
            data: {
              storeId,
              name,
              slug,
              description: String(row.description ?? ""),
              type: String(row.type ?? "PHYSICAL"),
              status: "DRAFT",
              priceCents: Math.round(Number(row.priceCents ?? row.price ?? 0) * (row.price ? 100 : 1)),
              trackInventory: Boolean(row.trackInventory),
              stock: Number(row.stock ?? 0),
            },
          });
        }
      }
      break;
    }
    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

export async function processJobQueue(limit = 10): Promise<{ processed: number; failed: number }> {
  const jobs = await claimPendingJobs(limit);
  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      const payload = JSON.parse(job.payload) as JobPayload;
      await handleJob(job.type, payload);
      await completeJob(job.id);
      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Job failed";
      await failJob(job.id, message, job.maxAttempts, job.attempts + 1);
      failed++;
    }
  }

  return { processed, failed };
}
