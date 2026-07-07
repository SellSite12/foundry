import { createHmac, randomBytes } from "crypto";

import { db } from "@/lib/db";
import { enqueueJob } from "@/lib/jobs/queue";

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

export function signPayload(secret: string, payload: string, timestamp: number): string {
  const signed = `${timestamp}.${payload}`;
  return createHmac("sha256", secret).update(signed).digest("hex");
}

/** Queue outbound webhook deliveries for matching subscriptions. */
export async function emitWebhookEvent(
  storeId: string,
  event: string,
  data: Record<string, unknown>
): Promise<number> {
  const webhooks = await db.webhook.findMany({
    where: { storeId, active: true },
  });

  let queued = 0;
  const payload = JSON.stringify({
    id: `evt_${Date.now()}`,
    event,
    createdAt: new Date().toISOString(),
    data,
  });

  for (const hook of webhooks) {
    const events = hook.events.split(",").map((e) => e.trim());
    if (!events.includes(event) && !events.includes("*")) continue;

    const delivery = await db.webhookDelivery.create({
      data: { webhookId: hook.id, event, payload, status: "PENDING" },
    });
    await enqueueJob({
      type: "webhook.deliver",
      payload: { deliveryId: delivery.id },
      storeId,
    });
    queued++;
  }

  return queued;
}

export async function deliverWebhook(deliveryId: string): Promise<void> {
  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhook: true },
  });
  if (!delivery || delivery.status === "SUCCEEDED") return;

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signPayload(delivery.webhook.secret, delivery.payload, timestamp);

  let responseCode: number | null = null;
  let responseBody: string | null = null;
  let ok = false;

  try {
    const res = await fetch(delivery.webhook.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-foundry-signature": signature,
        "x-foundry-timestamp": String(timestamp),
        "x-foundry-event": delivery.event,
      },
      body: delivery.payload,
      signal: AbortSignal.timeout(15_000),
    });
    responseCode = res.status;
    responseBody = (await res.text()).slice(0, 2000);
    ok = res.ok;
  } catch (error) {
    responseBody = error instanceof Error ? error.message : "Delivery failed";
  }

  const attempts = delivery.attempts + 1;
  if (ok) {
    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "SUCCEEDED",
        responseCode,
        responseBody,
        attempts,
        completedAt: new Date(),
      },
    });
    await db.webhook.update({
      where: { id: delivery.webhookId },
      data: { failureCount: 0 },
    });
    return;
  }

  const maxAttempts = 5;
  const retry = attempts < maxAttempts;
  await db.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: retry ? "PENDING" : "FAILED",
      responseCode,
      responseBody,
      attempts,
      nextRetryAt: retry ? new Date(Date.now() + attempts * 120_000) : null,
      completedAt: retry ? null : new Date(),
    },
  });

  await db.webhook.update({
    where: { id: delivery.webhookId },
    data: { failureCount: { increment: 1 } },
  });

  if (retry) {
    await enqueueJob({
      type: "webhook.deliver",
      payload: { deliveryId },
      storeId: delivery.webhook.storeId,
      scheduledAt: new Date(Date.now() + attempts * 120_000),
    });
  }

  if (!ok && !retry) throw new Error(`Webhook delivery failed after ${attempts} attempts`);
}
