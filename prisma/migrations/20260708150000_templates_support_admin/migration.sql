-- Templates, email templates, support tickets, user status

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");

ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "templateId" TEXT;

CREATE TABLE IF NOT EXISTS "StorefrontTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "tier" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "industry" TEXT,
    "previewColor" TEXT,
    "snapshotJson" TEXT NOT NULL,
    "storeId" TEXT,
    "createdById" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StorefrontTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StorefrontTemplate_slug_key" ON "StorefrontTemplate"("slug");
CREATE INDEX IF NOT EXISTS "StorefrontTemplate_tier_isPublished_idx" ON "StorefrontTemplate"("tier", "isPublished");
CREATE INDEX IF NOT EXISTS "StorefrontTemplate_storeId_idx" ON "StorefrontTemplate"("storeId");

CREATE TABLE IF NOT EXISTS "StorefrontTemplatePurchase" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StorefrontTemplatePurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StorefrontTemplatePurchase_storeId_templateId_key" ON "StorefrontTemplatePurchase"("storeId", "templateId");
CREATE INDEX IF NOT EXISTS "StorefrontTemplatePurchase_storeId_idx" ON "StorefrontTemplatePurchase"("storeId");

CREATE TABLE IF NOT EXISTS "EmailTemplate" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "tier" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmailTemplate_storeId_slug_key" ON "EmailTemplate"("storeId", "slug");
CREATE INDEX IF NOT EXISTS "EmailTemplate_tier_kind_idx" ON "EmailTemplate"("tier", "kind");

CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");

CREATE TABLE IF NOT EXISTS "SupportTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportTicketMessage_ticketId_createdAt_idx" ON "SupportTicketMessage"("ticketId", "createdAt");

ALTER TABLE "StorefrontTemplate" ADD CONSTRAINT "StorefrontTemplate_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StorefrontTemplatePurchase" ADD CONSTRAINT "StorefrontTemplatePurchase_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StorefrontTemplatePurchase" ADD CONSTRAINT "StorefrontTemplatePurchase_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "StorefrontTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
