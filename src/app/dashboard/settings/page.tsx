import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { PasswordSection } from "@/components/settings/PasswordSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { SessionsSection } from "@/components/settings/SessionsSection";
import { DangerZone } from "@/components/settings/DangerZone";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const preferences = await db.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="fdy-display text-[24px] font-semibold text-[#EFE9DF]">
          Account settings
        </h1>
        <p className="fdy-mono mt-1 text-[11px] text-[#7A7266]">
          ACCOUNT ID · {user.id.toUpperCase()}
        </p>
      </div>

      <ProfileSection
        initial={{
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: Boolean(user.emailVerified),
          createdAt: user.createdAt.toISOString(),
        }}
      />
      <PreferencesSection
        initial={{
          theme: preferences.theme,
          timezone: preferences.timezone,
          language: preferences.language,
          emailNotifications: preferences.emailNotifications,
          marketingEmails: preferences.marketingEmails,
        }}
      />
      <PasswordSection />
      <SessionsSection />
      <DangerZone />
    </div>
  );
}
