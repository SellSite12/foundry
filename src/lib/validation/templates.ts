import { z } from "zod";

import { EMAIL_TEMPLATE_KINDS, TEMPLATE_TIERS } from "@/lib/constants";

export const templateActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("apply"),
    templateId: z.string().min(1),
  }),
  z.object({
    action: z.literal("purchase"),
    templateId: z.string().min(1),
  }),
  z.object({
    action: z.literal("save"),
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(300).optional(),
  }),
]);

export const createEmailTemplateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  kind: z.enum(EMAIL_TEMPLATE_KINDS),
  subject: z.string().trim().min(2).max(200),
  preheader: z.string().trim().max(200).optional(),
  bodyHtml: z.string().trim().min(10).max(50_000),
  bodyText: z.string().trim().max(20_000).optional(),
  fromTemplateId: z.string().optional(),
});

export const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  body: z.string().trim().min(10).max(10_000),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
});

export const supportReplySchema = z.object({
  body: z.string().trim().min(1).max(10_000),
});

export const adminUserPatchSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export const adminStorePatchSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
});

export const adminTicketPatchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
});

export const templateTierSchema = z.enum(TEMPLATE_TIERS);
