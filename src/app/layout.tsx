import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { SkipLink } from "@/components/SkipLink";
import { CookieConsent } from "@/components/CookieConsent";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Foundry — Commerce, cast in one platform",
    description:
      "Foundry gives builders one place to launch stores, price products, and run the whole business.",
    path: "/",
  }),
  title: {
    default: "Foundry — Commerce, cast in one platform",
    template: "%s · Foundry",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolve the signed-in user's saved theme so the whole app renders with
  // the right palette on first paint (no flash).
  let theme = "dark";
  try {
    const { getCurrentUser } = await import("@/lib/auth/session");
    const { db } = await import("@/lib/db");
    const user = await getCurrentUser();
    if (user) {
      const prefs = await db.userPreferences.findUnique({
        where: { userId: user.id },
        select: { theme: true },
      });
      if (prefs?.theme === "light") theme = "light";
    }
  } catch {
    // during prerendering there is no request context — default to dark
  }

  return (
    <html lang="en" data-theme={theme}>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <SkipLink />
        <div id="main-content">{children}</div>
        <CookieConsent />
      </body>
    </html>
  );
}
