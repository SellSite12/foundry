import nodemailer from "nodemailer";

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

async function sendViaResend(input: MailInput): Promise<void> {
  const from = process.env.EMAIL_FROM ?? "Foundry <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend failed (${res.status}): ${detail}`);
  }
}

/**
 * Sends a transactional email via Resend or SMTP. When neither is configured
 * (local development), the message is printed to the server console.
 */
export async function sendMail(input: MailInput): Promise<void> {
  if (resendConfigured()) {
    await sendViaResend(input);
    return;
  }

  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[email] NOT SENT to ${input.to} — configure RESEND_API_KEY or SMTP_* in production`
      );
      return;
    }
    console.log(
      [
        "",
        "================ DEV EMAIL (SMTP not configured) ================",
        `To:      ${input.to}`,
        `Subject: ${input.subject}`,
        "",
        input.text,
        "=================================================================",
        "",
      ].join("\n")
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "Foundry <no-reply@foundry.local>",
    ...input,
  });
}

function appUrl(path: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

export { appUrl };

export function emailShell(title: string, bodyHtml: string, brand = "Foundry"): string {
  return `
  <div style="background:#0C0A09;padding:40px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#18140F;border:1px solid rgba(232,163,61,0.22);border-radius:16px;padding:36px;">
      <div style="font-size:20px;font-weight:700;color:#E8A33D;margin-bottom:20px;">${brand}</div>
      <div style="font-size:17px;font-weight:600;color:#EFE9DF;margin-bottom:12px;">${title}</div>
      <div style="font-size:14px;line-height:1.6;color:#B8AFA0;">${bodyHtml}</div>
      <div style="margin-top:28px;font-size:12px;color:#7A7266;">
        If you didn't request this, you can safely ignore this email.
      </div>
    </div>
  </div>`;
}

export function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin:18px 0;padding:12px 24px;background:#E8A33D;color:#0C0A09;font-weight:600;border-radius:9999px;text-decoration:none;">${label}</a>`;
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  rawToken: string
): Promise<void> {
  const url = appUrl(`/verify-email?token=${rawToken}`);
  await sendMail({
    to,
    subject: "Verify your Foundry email",
    text: `Hi ${name},\n\nConfirm your email address to finish setting up your Foundry account:\n\n${url}\n\nThis link expires in 24 hours.`,
    html: emailShell(
      "Confirm your email address",
      `Hi ${name}, confirm your email to finish setting up your Foundry account.<br/>${button(
        url,
        "Verify email"
      )}<br/>This link expires in 24 hours.`
    ),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  rawToken: string
): Promise<void> {
  const url = appUrl(`/reset-password?token=${rawToken}`);
  await sendMail({
    to,
    subject: "Reset your Foundry password",
    text: `Hi ${name},\n\nSomeone requested a password reset for your Foundry account. Use this link to choose a new password:\n\n${url}\n\nThis link expires in 60 minutes.`,
    html: emailShell(
      "Reset your password",
      `Hi ${name}, use the button below to choose a new password.<br/>${button(
        url,
        "Reset password"
      )}<br/>This link expires in 60 minutes.`
    ),
  });
}
