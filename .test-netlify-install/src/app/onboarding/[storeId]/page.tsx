import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { OnboardingWizard } from "@/components/seller/OnboardingWizard";

export const metadata = { title: "Store setup" };

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const store = await db.store.findFirst({
    where: { id: storeId, ownerId: user.id },
  });
  if (!store) notFound();
  if (store.onboardingDone) redirect(`/store/${store.id}`);

  return (
    <OnboardingWizard
      store={{
        id: store.id,
        name: store.name,
        description: store.description,
        industry: store.industry,
        website: store.website,
        phone: store.phone,
        businessEmail: store.businessEmail,
        addressLine1: store.addressLine1,
        addressLine2: store.addressLine2,
        city: store.city,
        state: store.state,
        postalCode: store.postalCode,
        country: store.country,
        taxId: store.taxId,
        taxRate: store.taxRate,
        taxInclusive: store.taxInclusive,
        timezone: store.timezone,
        currency: store.currency,
        brandColor: store.brandColor,
        logo: store.logo,
        onboardingStep: store.onboardingStep,
      }}
    />
  );
}
