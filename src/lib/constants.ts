// Allowed values for string-based status/type columns in the database.
// Kept in code (instead of DB enums) so the schema stays portable between
// SQLite (dev) and PostgreSQL (production).

export const USER_ROLES = ["USER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const AUTH_TOKEN_TYPES = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;
export type AuthTokenType = keyof typeof AUTH_TOKEN_TYPES;

export const NOTIFICATION_TYPES = [
  "INFO",
  "SUCCESS",
  "WARNING",
  "SECURITY",
  "ORDER",
  "INVENTORY",
  "PAYMENT",
  "CUSTOMER",
  "TEAM",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const THEMES = ["dark", "light", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const SESSION_COOKIE = "foundry_session";
export const SESSION_TTL_DAYS = 30;

export const EMAIL_VERIFICATION_TTL_HOURS = 24;
export const PASSWORD_RESET_TTL_MINUTES = 60;

// ---------------------------------------------------------------
// Commerce
// ---------------------------------------------------------------

export const PRODUCT_TYPES = ["DIGITAL", "PHYSICAL", "SERVICE", "SUBSCRIPTION"] as const;
export const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const PRODUCT_VISIBILITIES = ["VISIBLE", "HIDDEN"] as const;

export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Statuses that count as revenue (money captured, not returned). */
export const REVENUE_STATUSES: OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
];

export const INVENTORY_REASONS = [
  "RESTOCK",
  "CORRECTION",
  "DAMAGE",
  "SALE",
  "RETURN",
  "TRANSFER",
] as const;

export const DISCOUNT_KINDS = ["CODE", "AUTOMATIC", "BUNDLE"] as const;
export const DISCOUNT_TYPES = ["PERCENT", "FIXED_AMOUNT", "FREE_SHIPPING"] as const;

export const TEAM_ROLES = ["OWNER", "ADMIN", "MANAGER", "SUPPORT", "WAREHOUSE"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const REVIEW_STATUSES = ["PENDING", "PUBLISHED", "HIDDEN"] as const;

export const CAMPAIGN_STATUSES = ["DRAFT", "SCHEDULED", "SENT"] as const;

export const AUTOMATION_TRIGGERS = [
  "ORDER_CREATED",
  "ORDER_SHIPPED",
  "REFUND_COMPLETED",
  "STOCK_LOW",
  "CUSTOMER_CREATED",
  "CUSTOMER_BIRTHDAY",
  "PRODUCT_BACK_IN_STOCK",
  "NEW_REVIEW",
  "SUBSCRIPTION_RENEWAL",
  "CART_ABANDONED",
  "REFERRAL_SIGNUP",
  "AFFILIATE_SALE",
] as const;
export const AUTOMATION_ACTIONS = [
  "NOTIFY",
  "SEND_EMAIL",
  "TAG_CUSTOMER",
  "WEBHOOK",
  "CREATE_DISCOUNT",
  "CREATE_TASK",
  "UPDATE_DATABASE",
  "GENERATE_AI",
  "DELAY",
  "BRANCH",
] as const;

export const PLANS = ["STARTER", "GROWTH", "SCALE"] as const;
export type Plan = (typeof PLANS)[number];

export const INDUSTRIES = [
  "Apparel & Fashion",
  "Art & Design",
  "Beauty & Cosmetics",
  "Books & Media",
  "Digital Products",
  "Education & Courses",
  "Electronics",
  "Food & Beverage",
  "Health & Wellness",
  "Home & Garden",
  "Jewelry & Accessories",
  "Music & Audio",
  "Software & SaaS",
  "Sports & Outdoors",
  "Toys & Games",
  "Other",
] as const;

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "SEK", "MXN", "BRL"] as const;

// ---------------------------------------------------------------
// Storefront & checkout (Phase 4)
// ---------------------------------------------------------------

export const THEME_MODES = ["dark", "light"] as const;
export const THEME_FONTS = ["sans", "serif", "mono"] as const;
export const HEADER_STYLES = ["classic", "centered", "minimal"] as const;
export const FOOTER_STYLES = ["full", "slim"] as const;
export const CARD_STYLES = ["rounded", "square", "borderless"] as const;
export const BUTTON_STYLES = ["rounded", "pill", "square"] as const;

export const HERO_STYLES = [
  "classic",
  "aurora",
  "depth",
  "spotlight",
  "neon-grid",
  "cinematic",
  "bokeh",
  "orbit",
  "hologram",
  "marble",
  "prism",
  "sunrise",
  // WebGL shader heroes (paid tier)
  "silk",
  "iridescence",
  "liquid-chrome",
  "galaxy",
  "light-rays",
  "hyperspeed",
  "aurora-flow",
] as const;
export type HeroStyle = (typeof HERO_STYLES)[number];

export const MOTION_PRESETS = ["none", "subtle", "cinematic", "premium"] as const;
export type MotionPreset = (typeof MOTION_PRESETS)[number];

export const SECTION_TYPES = [
  "featured_products",
  "featured_collections",
  "testimonials",
  "faq",
  "rich_text",
] as const;

export const STORE_PAGE_SLUGS = ["about", "contact", "privacy", "terms"] as const;
export type StorePageSlug = (typeof STORE_PAGE_SLUGS)[number];

export const SHIPPING_KINDS = ["DELIVERY", "PICKUP"] as const;

export const PAYMENT_METHODS = ["card", "wallet"] as const;
export const QUESTION_STATUSES = ["PENDING", "ANSWERED", "HIDDEN"] as const;

export const CART_COOKIE = "foundry_cart";
export const CART_TTL_DAYS = 90;

export const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
] as const;

// ---------------------------------------------------------------
// Phase 5 — AI, integrations, enterprise
// ---------------------------------------------------------------

export const INTEGRATION_CATEGORIES = [
  "PAYMENT",
  "SHIPPING",
  "ACCOUNTING",
  "MARKETING",
  "CRM",
  "EMAIL",
  "SMS",
  "ANALYTICS",
  "STORAGE",
  "SUPPORT",
  "CALENDAR",
] as const;

export const INTEGRATION_PROVIDERS = [
  { id: "stripe", category: "PAYMENT", label: "Stripe" },
  { id: "paypal", category: "PAYMENT", label: "PayPal" },
  { id: "shippo", category: "SHIPPING", label: "Shippo" },
  { id: "quickbooks", category: "ACCOUNTING", label: "QuickBooks" },
  { id: "mailchimp", category: "MARKETING", label: "Mailchimp" },
  { id: "hubspot", category: "CRM", label: "HubSpot" },
  { id: "sendgrid", category: "EMAIL", label: "SendGrid" },
  { id: "twilio", category: "SMS", label: "Twilio" },
  { id: "google_analytics", category: "ANALYTICS", label: "Google Analytics" },
  { id: "s3", category: "STORAGE", label: "Amazon S3" },
  { id: "zendesk", category: "SUPPORT", label: "Zendesk" },
  { id: "google_calendar", category: "CALENDAR", label: "Google Calendar" },
] as const;

export const WEBHOOK_EVENTS = [
  "order.created",
  "order.updated",
  "order.shipped",
  "order.refunded",
  "customer.created",
  "product.created",
  "product.updated",
  "inventory.low",
  "review.created",
  "cart.abandoned",
] as const;

export const JOB_TYPES = [
  "email.send",
  "report.generate",
  "webhook.deliver",
  "automation.run",
  "import.process",
  "insights.refresh",
] as const;

export const AI_INSIGHT_KINDS = [
  "revenue_trend",
  "slow_mover",
  "restock",
  "retention",
  "marketing",
  "cart_risk",
  "seasonal",
  "pricing",
  "segmentation",
] as const;

export const AI_DRAFT_KINDS = [
  "product_description",
  "seo_title",
  "seo_description",
  "email",
  "social",
  "support_reply",
  "promotion",
] as const;

export const REPORT_TYPES = ["sales", "inventory", "customers", "marketing", "financial"] as const;
export const REPORT_SCHEDULES = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const;
export const REPORT_FORMATS = ["CSV", "JSON"] as const;

export const WORKSPACE_ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER"] as const;
export const API_SCOPES = ["read", "read_write"] as const;
export const API_RATE_LIMIT_PER_MINUTE = 120;

// ---------------------------------------------------------------
// Templates & platform support
// ---------------------------------------------------------------

export const TEMPLATE_TIERS = ["FREE", "PAID", "CUSTOM"] as const;
export type TemplateTier = (typeof TEMPLATE_TIERS)[number];

export const EMAIL_TEMPLATE_KINDS = ["TRANSACTIONAL", "MARKETING"] as const;
export type EmailTemplateKind = (typeof EMAIL_TEMPLATE_KINDS)[number];

export const SUPPORT_TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING",
  "RESOLVED",
  "CLOSED",
] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];
