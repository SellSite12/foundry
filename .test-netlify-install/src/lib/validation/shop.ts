import { z } from "zod";

import {
  THEME_MODES,
  THEME_FONTS,
  HEADER_STYLES,
  FOOTER_STYLES,
  CARD_STYLES,
  BUTTON_STYLES,
  STORE_PAGE_SLUGS,
  SHIPPING_KINDS,
  QUESTION_STATUSES,
} from "@/lib/constants";
import { emailSchema } from "@/lib/validation/auth";

const shortText = z.string().trim().max(200);
const longText = z.string().trim().max(10_000);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #E8A33D");

// ---------------------------------------------------------------
// Cart
// ---------------------------------------------------------------

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().min(1).max(999).default(1),
});

export const updateCartItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(0).max(999).optional(), // 0 = remove
  savedForLater: z.boolean().optional(),
});

export const cartCodesSchema = z.object({
  discountCode: z.string().trim().max(40).nullable().optional(),
  giftCardCode: z.string().trim().max(40).nullable().optional(),
});

// ---------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------

export const shippingAddressSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().max(30).nullable().optional(),
  line1: z.string().trim().min(1, "Address is required").max(200),
  line2: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().max(100).nullable().optional(),
  postalCode: z.string().trim().min(1, "Postal code is required").max(20),
  country: z.string().trim().min(1, "Country is required").max(100),
});

export const quoteSchema = z.object({
  country: z.string().trim().max(100).nullable().optional(),
  state: z.string().trim().max(100).nullable().optional(),
  shippingRateId: z.string().nullable().optional(),
  discountCode: z.string().trim().max(40).nullable().optional(),
  giftCardCode: z.string().trim().max(40).nullable().optional(),
});

const cardSchema = z.object({
  number: z
    .string()
    .trim()
    .regex(/^[\d\s-]{12,25}$/, "Enter a valid card number"),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2020).max(2099),
  cvc: z.string().trim().regex(/^\d{3,4}$/, "Enter the 3-4 digit security code"),
  name: z.string().trim().min(1, "Name on card is required").max(120),
});

export const paymentMethodInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("card"), card: cardSchema, save: z.boolean().optional() }),
  z.object({ kind: z.literal("saved"), paymentMethodId: z.string().min(1) }),
  z.object({ kind: z.literal("wallet") }),
]);

export const placeOrderSchema = z.object({
  email: emailSchema,
  address: shippingAddressSchema,
  shippingRateId: z.string().nullable().optional(),
  discountCode: z.string().trim().max(40).nullable().optional(),
  giftCardCode: z.string().trim().max(40).nullable().optional(),
  customerNote: longText.nullable().optional(),
  payment: paymentMethodInputSchema,
  /** client-side displayed total — server rejects if it no longer matches */
  expectedTotalCents: z.number().int().min(0),
});

// ---------------------------------------------------------------
// Storefront interactions
// ---------------------------------------------------------------

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: shortText.nullable().optional(),
  body: longText.min(3, "Tell us a bit more").max(5000),
  authorName: z.string().trim().min(1).max(120).optional(), // required for guests
  email: emailSchema.optional(), // guests
  photos: z.array(z.string().trim().max(2048)).max(6).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: shortText.nullable().optional(),
  body: longText.min(3).max(5000).optional(),
  photos: z.array(z.string().trim().max(2048)).max(6).optional(),
});

export const createQuestionSchema = z.object({
  productId: z.string().min(1),
  question: z.string().trim().min(5, "Ask a full question").max(1000),
  authorName: z.string().trim().min(1).max(120).optional(),
});

export const answerQuestionSchema = z.object({
  answer: longText.min(1).max(5000).nullable().optional(),
  status: z.enum(QUESTION_STATUSES).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(120),
  email: emailSchema,
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(5, "Write a short message").max(5000),
});

export const trackOrderSchema = z.object({
  orderNumber: z.number().int().min(1),
  email: emailSchema,
});

// ---------------------------------------------------------------
// Customer account
// ---------------------------------------------------------------

export const addressSchema = z.object({
  label: shortText.min(1).default("Home"),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(30).nullable().optional(),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(100).nullable().optional(),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional(),
});

export const wishlistSchema = z.object({
  productId: z.string().min(1),
});

export const savePaymentMethodSchema = z.object({
  card: cardSchema,
  isDefault: z.boolean().optional(),
});

// ---------------------------------------------------------------
// Theme customizer (seller)
// ---------------------------------------------------------------

const sectionSchema = z.object({
  type: z.enum(["featured_products", "featured_collections", "testimonials", "faq", "rich_text"]),
  title: shortText.optional(),
  body: longText.optional(),
  productIds: z.array(z.string()).max(24).optional(),
  limit: z.number().int().min(1).max(24).optional(),
});

export const updateThemeSchema = z.object({
  primaryColor: hexColor.optional(),
  accentColor: hexColor.optional(),
  mode: z.enum(THEME_MODES).optional(),
  font: z.enum(THEME_FONTS).optional(),
  headerStyle: z.enum(HEADER_STYLES).optional(),
  footerStyle: z.enum(FOOTER_STYLES).optional(),
  cardStyle: z.enum(CARD_STYLES).optional(),
  buttonStyle: z.enum(BUTTON_STYLES).optional(),
  announcementText: shortText.nullable().optional(),
  announcementEnabled: z.boolean().optional(),
  bannerUrl: z.string().trim().max(2048).nullable().optional(),
  bannerHeading: shortText.nullable().optional(),
  bannerSubheading: shortText.nullable().optional(),
  sections: z.array(sectionSchema).max(12).optional(),
  testimonials: z
    .array(
      z.object({
        author: z.string().trim().min(1).max(120),
        quote: z.string().trim().min(1).max(1000),
        rating: z.number().int().min(1).max(5).optional(),
      })
    )
    .max(12)
    .optional(),
  faq: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(300),
        answer: z.string().trim().min(1).max(2000),
      })
    )
    .max(30)
    .optional(),
});

export const updateStorePageSchema = z.object({
  slug: z.enum(STORE_PAGE_SLUGS),
  title: z.string().trim().min(1).max(200),
  content: longText.nullable().optional(),
});

// ---------------------------------------------------------------
// Tax rules & shipping (seller)
// ---------------------------------------------------------------

export const taxRuleSchema = z.object({
  name: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(100), // "*" = everywhere
  state: z.string().trim().max(100).nullable().optional(),
  rate: z.number().min(0).max(100),
  active: z.boolean().optional(),
});

export const shippingRateKindSchema = z.enum(SHIPPING_KINDS);
