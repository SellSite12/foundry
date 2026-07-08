import { ok, withErrorHandling } from "@/lib/api";
import { runAbandonedCartAutomations } from "@/lib/shop/automations";
import { config } from "@/lib/config";

function assertCron(req: Request) {
  const secret = config.cronSecret;
  if (!secret) return;
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) throw new Error("Unauthorized");
}

/** Hourly cron entry point for abandoned-cart recovery across all stores. */
export const POST = withErrorHandling(async (req) => {
  assertCron(req);
  const result = await runAbandonedCartAutomations();
  return ok({ result });
});
