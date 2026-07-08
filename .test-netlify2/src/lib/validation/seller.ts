import { z } from "zod";

import {
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  PRODUCT_VISIBILITIES,
  ORDER_STATUSES,
  INVENTORY_REASONS,
  DISCOUNT_KINDS,
  DISCOUNT_TYPES,
  TEAM_ROLES,
  REVIEW_STATUSES,
  AUTOMATION_TRIGGERS,
  AUTOMATION_ACTIONS,
  PLANS,
  CURRENCIES,
} from "@/lib/constants";
import { emailSchema } from "@/lib/validation/auth";

const cents = z.number().int().min(0).max(100_000_000);
const shortText = z.string().trim().max(200);
const longText = z.string().trim().max(10_000);
const optionalUrl = z.string().trim().url().max(2048).nullable().optional();

// ---------------------------------------------------------------
// Store / onboarding / settings
// ---------------------------------------------------------------

export const createStoreSchema = z.object({
  name: z.string().trim().min(2, "Business name must be at least 2 characters").max(80),
  description: longText.optional(),
  industry: shortText.optional(),
});

export const updateStoreSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: longText.nullable().optional(),
  industry: shortText.nullable().optional(),
  website: optionalUrl,
  phone: z.string().trim().max(30).nullable().optional(),
  businessEmail: z.string().trim().toLowerCase().email().max(254).nullable().optional(),
  addressLine1: shortText.nullable().optional(),
  addressLine2: shortText.nullable().optional(),
  city: shortText.nullable().optional(),
  state: shortText.nullable().optional(),
  postalCode: z.string().trim().max(20).nullable().optional(),
  country: shortText.nullable().optional(),
  taxId: z.string().trim().max(50).nullable().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxInclusive: z.boolean().optional(),
  timezone: z.string().trim().max(64).optional(),
  currency: z.enum(CURRENCIES).optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #E8A33D")
    .optional(),
  logo: optionalUrl,
  customDomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^([a-z0-9-]+\.)+[a-z]{2,}$/, "Enter a domain like shop.example.com")
    .max(253)
    .nullable()
    .optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  onboardingStep: z.number().int().min(1).max(5).optional(),
  onboardingDone: z.boolean().optional(),
});

// ---------------------------------------------------------------
// Products
// ---------------------------------------------------------------

export const variantSchema = z.object({
  id: z.string().optional(), // present = update existing
  name: shortText.min(1),
  options: z.record(z.string().max(40), z.string().max(80)),
  sku: z.string().trim().max(64).nullable().optional(),
  barcode: z.string().trim().max(64).nullable().optional(),
  priceCents: cents.nullable().optional(),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  position: z.number().int().min(0).optional(),
});

export const productImageSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  alt: shortText.nullable().optional(),
  isVideo: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200),
  description: longText.nullable().optional(),
  type: z.enum(PRODUCT_TYPES).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  visibility: z.enum(PRODUCT_VISIBILITIES).optional(),
  publishAt: z.string().datetime().nullable().optional(),
  priceCents: cents.optional(),
  compareAtCents: cents.nullable().optional(),
  costCents: cents.nullable().optional(),
  sku: z.string().trim().max(64).nullable().optional(),
  barcode: z.string().trim().max(64).nullable().optional(),
  weightGrams: z.number().int().min(0).max(1_000_000).nullable().optional(),
  lengthCm: z.number().min(0).max(10_000).nullable().optional(),
  widthCm: z.number().min(0).max(10_000).nullable().optional(),
  heightCm: z.number().min(0).max(10_000).nullable().optional(),
  requiresShipping: z.boolean().optional(),
  warehouseLocation: shortText.nullable().optional(),
  trackInventory: z.boolean().optional(),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  incomingStock: z.number().int().min(0).max(1_000_000).optional(),
  lowStockThreshold: z.number().int().min(0).max(100_000).optional(),
  category: shortText.nullable().optional(),
  tags: z.string().trim().max(500).nullable().optional(),
  collectionId: z.string().nullable().optional(),
  seoTitle: shortText.nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
  images: z.array(productImageSchema).max(20).optional(),
  variants: z.array(variantSchema).max(100).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const bulkProductSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(["PUBLISH", "DRAFT", "ARCHIVE", "UNARCHIVE", "DELETE"]),
});

export const collectionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: longText.nullable().optional(),
});

// ---------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------

export const inventoryAdjustSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  delta: z.number().int().min(-1_000_000).max(1_000_000).refine((v) => v !== 0, "Delta cannot be zero"),
  reason: z.enum(INVENTORY_REASONS),
  note: shortText.nullable().optional(),
});

// ---------------------------------------------------------------
// Orders
// ---------------------------------------------------------------

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  customerEmail: emailSchema,
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().nullable().optional(),
        quantity: z.number().int().min(1).max(10_000),
      })
    )
    .min(1, "Add at least one item"),
  shippingCents: cents.optional(),
  discountCents: cents.optional(),
  markPaid: z.boolean().optional(),
  customerNote: longText.nullable().optional(),
});

export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  trackingNumber: z.string().trim().max(100).nullable().optional(),
  shippingCarrier: z.string().trim().max(60).nullable().optional(),
  customerNote: longText.nullable().optional(),
  internalNote: longText.nullable().optional(),
});

export const refundOrderSchema = z.object({
  amountCents: z.number().int().min(1).max(100_000_000),
  reason: shortText.min(1, "Give a short reason"),
  restock: z.boolean().optional(),
});

// ---------------------------------------------------------------
// Customers
// ---------------------------------------------------------------

export const customerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  phone: z.string().trim().max(30).nullable().optional(),
  tags: z.string().trim().max(500).nullable().optional(),
  notes: longText.nullable().optional(),
  addressLine1: shortText.nullable().optional(),
  addressLine2: shortText.nullable().optional(),
  city: shortText.nullable().optional(),
  state: shortText.nullable().optional(),
  postalCode: z.string().trim().max(20).nullable().optional(),
  country: shortText.nullable().optional(),
});

export const updateCustomerSchema = customerSchema.partial();

// ---------------------------------------------------------------
// Marketing
// ---------------------------------------------------------------

export const discountSchema = z.object({
  kind: z.enum(DISCOUNT_KINDS).optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/, "3-30 letters, numbers, dashes")
    .nullable()
    .optional(),
  title: z.string().trim().min(1).max(120),
  type: z.enum(DISCOUNT_TYPES),
  value: z.number().int().min(0).max(100_000_000),
  minSubtotalCents: cents.nullable().optional(),
  usageLimit: z.number().int().min(1).max(1_000_000).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export const giftCardSchema = z.object({
  initialCents: z.number().int().min(100, "Minimum $1.00").max(100_000_000),
  note: shortText.nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(200),
  preheader: shortText.nullable().optional(),
  body: longText.nullable().optional(),
  status: z.enum(["DRAFT", "SCHEDULED"]).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export const automationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  trigger: z.enum(AUTOMATION_TRIGGERS),
  action: z.enum(AUTOMATION_ACTIONS),
  config: z.string().max(5000).nullable().optional(),
  enabled: z.boolean().optional(),
});

// ---------------------------------------------------------------
// Team / API keys / reviews / inbox / shipping / billing
// ---------------------------------------------------------------

export const inviteTeamSchema = z.object({
  email: emailSchema,
  role: z.enum(TEAM_ROLES).refine((r) => r !== "OWNER", "Ownership can't be granted via invite"),
  permissions: z.string().max(2000).nullable().optional(),
});

export const updateTeamSchema = z.object({
  role: z.enum(TEAM_ROLES).refine((r) => r !== "OWNER").optional(),
  permissions: z.string().max(2000).nullable().optional(),
});

export const apiKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
  scopes: z.enum(["read", "read_write"]).optional(),
});

export const reviewModerateSchema = z.object({
  status: z.enum(REVIEW_STATUSES).optional(),
  reply: longText.nullable().optional(),
  report: z.boolean().optional(), // flag as abusive (auto-hides)
  reportNote: shortText.nullable().optional(),
});

export const conversationSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  customerId: z.string().nullable().optional(),
  body: longText.min(1),
});

export const messageSchema = z.object({
  body: longText.min(1),
});

export const shippingRateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(["DELIVERY", "PICKUP"]).optional(),
  region: z.string().trim().min(1).max(80).optional(),
  countries: z.string().trim().max(1000).nullable().optional(), // comma-separated; empty = everywhere
  priceCents: cents,
  freeAboveCents: cents.nullable().optional(),
  minDays: z.number().int().min(0).max(365).nullable().optional(),
  maxDays: z.number().int().min(0).max(365).nullable().optional(),
  active: z.boolean().optional(),
});

export const changePlanSchema = z.object({
  plan: z.enum(PLANS),
});
