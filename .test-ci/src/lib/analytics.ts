import { db } from "@/lib/db";

/**
 * Records a platform analytics event. Failures are swallowed — analytics
 * must never break a user-facing flow.
 */
export async function trackEvent(
  type: string,
  opts: { userId?: string; storeId?: string; payload?: Record<string, unknown> } = {}
): Promise<void> {
  try {
    await db.analyticsEvent.create({
      data: {
        type,
        userId: opts.userId,
        storeId: opts.storeId,
        payload: opts.payload ? JSON.stringify(opts.payload) : null,
      },
    });
  } catch (error) {
    console.error("[analytics] failed to record event", type, error);
  }
}
