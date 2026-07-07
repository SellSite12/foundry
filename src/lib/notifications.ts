import { db } from "@/lib/db";
import type { NotificationType } from "@/lib/constants";

export async function createNotification(input: {
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string;
  href?: string;
}): Promise<void> {
  await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? "INFO",
      title: input.title,
      body: input.body,
      href: input.href,
    },
  });
}
