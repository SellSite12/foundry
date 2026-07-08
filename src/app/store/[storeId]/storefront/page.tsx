import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { getOrCreateTheme, parseTestimonials, parseFaq } from "@/lib/shop/theme";
import { PageHeader, Panel } from "@/components/seller/ui";
import { TemplateGallery } from "@/components/seller/TemplateGallery";
import "@/app/shop/storefront-effects.css";
import { ThemeCustomizer } from "@/components/seller/ThemeCustomizer";
import { StorePagesEditor } from "@/components/seller/StorePagesEditor";
import { CustomDomainForm } from "@/components/seller/CustomDomainForm";

export const metadata = { title: "Storefront" };

export default async function StorefrontSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "settings");
  if (!access) notFound();
  const { store } = access;

  const [theme, pages] = await Promise.all([
    getOrCreateTheme(storeId),
    db.storePage.findMany({ where: { storeId }, orderBy: { slug: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Storefront"
        description={`Customize how customers see your store at /shop/${store.slug} — changes save automatically and go live instantly.`}
      />

      <TemplateGallery storeId={storeId} />

      <ThemeCustomizer
        storeId={storeId}
        storeSlug={store.slug}
        initialTheme={{
          primaryColor: theme.primaryColor,
          accentColor: theme.accentColor,
          mode: theme.mode,
          font: theme.font,
          headerStyle: theme.headerStyle,
          footerStyle: theme.footerStyle,
          cardStyle: theme.cardStyle,
          buttonStyle: theme.buttonStyle,
          announcementText: theme.announcementText,
          announcementEnabled: theme.announcementEnabled,
          bannerUrl: theme.bannerUrl,
          bannerHeading: theme.bannerHeading,
          bannerSubheading: theme.bannerSubheading,
        }}
        initialTestimonials={parseTestimonials(theme)}
        initialFaq={parseFaq(theme)}
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Panel
          title="Content pages"
          description="About, contact, privacy, and terms pages on your storefront."
        >
          <StorePagesEditor
            storeId={storeId}
            initialPages={pages.map((p) => ({
              slug: p.slug,
              title: p.title,
              content: p.content ?? "",
            }))}
          />
        </Panel>

        <Panel
          title="Domains"
          description="Your storefront URLs — the Foundry URL always works."
        >
          <CustomDomainForm
            storeId={storeId}
            storeSlug={store.slug}
            initialDomain={store.customDomain}
          />
        </Panel>
      </div>
    </div>
  );
}
