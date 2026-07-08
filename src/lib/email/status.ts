export type EmailSetupStatus = {
  configured: boolean;
  provider: "resend" | "smtp" | "dev";
  fromAddress: string;
  supportAddress: string;
  transactionalReady: boolean;
  marketingReady: boolean;
  notes: string[];
};

export function getEmailSetupStatus(): EmailSetupStatus {
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
  const isProd = process.env.NODE_ENV === "production";
  const fromAddress = process.env.EMAIL_FROM ?? "Foundry <onboarding@resend.dev>";
  const supportAddress = process.env.SUPPORT_EMAIL ?? fromAddress;

  const notes: string[] = [];
  let provider: EmailSetupStatus["provider"] = "dev";

  if (hasResend) {
    provider = "resend";
    notes.push("Transactional emails send via Resend.");
  } else if (hasSmtp) {
    provider = "smtp";
    notes.push("Transactional emails send via SMTP.");
  } else if (isProd) {
    notes.push("No email provider configured — emails will not send in production.");
  } else {
    notes.push("Development mode — emails print to the server console.");
  }

  notes.push("Order confirmations, shipping updates, and team invites use your store name in the email.");
  notes.push("Marketing campaigns use templates from your Email templates library.");

  return {
    configured: hasResend || hasSmtp || !isProd,
    provider,
    fromAddress,
    supportAddress,
    transactionalReady: hasResend || hasSmtp || !isProd,
    marketingReady: hasResend || hasSmtp || !isProd,
    notes,
  };
}
