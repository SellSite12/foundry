import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { db } from "@/lib/db";
import { REVENUE_STATUSES } from "@/lib/constants";
import { sendMail } from "@/lib/email/mailer";

const REPORT_DIR = path.join(process.cwd(), "var", "reports");

async function buildSalesCsv(storeId: string): Promise<{ csv: string; rows: number }> {
  const orders = await db.order.findMany({
    where: { storeId, status: { in: [...REVENUE_STATUSES] } },
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      orderNumber: true,
      status: true,
      totalCents: true,
      customerEmail: true,
      createdAt: true,
    },
  });
  const header = "order_number,status,total_cents,customer_email,created_at";
  const lines = orders.map(
    (o) =>
      `${o.orderNumber},${o.status},${o.totalCents},${o.customerEmail ?? ""},${o.createdAt.toISOString()}`
  );
  return { csv: [header, ...lines].join("\n"), rows: orders.length };
}

async function buildInventoryCsv(storeId: string): Promise<{ csv: string; rows: number }> {
  const products = await db.product.findMany({
    where: { storeId, trackInventory: true },
    select: { name: true, sku: true, stock: true, priceCents: true, status: true },
  });
  const header = "name,sku,stock,price_cents,status";
  const lines = products.map((p) => `${p.name},${p.sku ?? ""},${p.stock},${p.priceCents},${p.status}`);
  return { csv: [header, ...lines].join("\n"), rows: products.length };
}

async function buildCustomersCsv(storeId: string): Promise<{ csv: string; rows: number }> {
  const customers = await db.customer.findMany({
    where: { storeId },
    select: { email: true, name: true, tags: true, createdAt: true },
  });
  const header = "email,name,tags,created_at";
  const lines = customers.map(
    (c) => `${c.email},${c.name ?? ""},${c.tags ?? ""},${c.createdAt.toISOString()}`
  );
  return { csv: [header, ...lines].join("\n"), rows: customers.length };
}

export async function generateReportFile(reportId: string, runId: string): Promise<void> {
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Report not found");

  let content = "";
  let rows = 0;

  switch (report.type) {
    case "sales": {
      const r = await buildSalesCsv(report.storeId);
      content = r.csv;
      rows = r.rows;
      break;
    }
    case "inventory": {
      const r = await buildInventoryCsv(report.storeId);
      content = r.csv;
      rows = r.rows;
      break;
    }
    case "customers": {
      const r = await buildCustomersCsv(report.storeId);
      content = r.csv;
      rows = r.rows;
      break;
    }
    default: {
      const r = await buildSalesCsv(report.storeId);
      content = r.csv;
      rows = r.rows;
    }
  }

  await mkdir(REPORT_DIR, { recursive: true });
  const filename = `${reportId}-${runId}.${report.format === "JSON" ? "json" : "csv"}`;
  const filePath = path.join(REPORT_DIR, filename);

  if (report.format === "JSON") {
    const lines = content.split("\n").filter(Boolean);
    const headers = lines[0]?.split(",") ?? [];
    const data = lines.slice(1).map((line) => {
      const vals = line.split(",");
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
    });
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  } else {
    await writeFile(filePath, content, "utf8");
  }

  const fileUrl = `/api/reports/download/${filename}`;
  await db.reportRun.update({
    where: { id: runId },
    data: { status: "COMPLETED", fileUrl, rowCount: rows, completedAt: new Date() },
  });
  await db.report.update({ where: { id: reportId }, data: { lastRunAt: new Date() } });

  if (report.recipients) {
    const emails = report.recipients.split(",").map((e) => e.trim()).filter(Boolean);
    for (const to of emails) {
      await sendMail({
        to,
        subject: `Report ready: ${report.name}`,
        text: `Your scheduled report "${report.name}" is ready.\nDownload: ${process.env.APP_URL ?? "http://localhost:3000"}${fileUrl}`,
        html: `<p>Your report <strong>${report.name}</strong> is ready.</p><p><a href="${process.env.APP_URL ?? "http://localhost:3000"}${fileUrl}">Download</a></p>`,
      });
    }
  }
}

export async function runScheduledReports(): Promise<number> {
  const reports = await db.report.findMany({ where: { enabled: true, schedule: { not: null } } });
  let ran = 0;
  const now = new Date();

  for (const report of reports) {
    const due = isReportDue(report.schedule!, report.lastRunAt, now);
    if (!due) continue;

    const run = await db.reportRun.create({ data: { reportId: report.id, status: "PENDING" } });
    try {
      await generateReportFile(report.id, run.id);
      ran++;
    } catch (error) {
      await db.reportRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Failed",
          completedAt: new Date(),
        },
      });
    }
  }
  return ran;
}

function isReportDue(schedule: string, lastRunAt: Date | null, now: Date): boolean {
  if (!lastRunAt) return true;
  const ms: Record<string, number> = {
    DAILY: 86_400_000,
    WEEKLY: 7 * 86_400_000,
    MONTHLY: 30 * 86_400_000,
    QUARTERLY: 90 * 86_400_000,
    YEARLY: 365 * 86_400_000,
  };
  return now.getTime() - lastRunAt.getTime() >= (ms[schedule] ?? 86_400_000);
}
