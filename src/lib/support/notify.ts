import { db } from "@/lib/db";
import { supportEmailAddress } from "@/lib/admin/access";
import { appUrl, emailShell, sendMail } from "@/lib/email/mailer";

export async function notifyAdminsNewTicket(input: {
  ticketId: string;
  subject: string;
  userName: string;
  userEmail: string;
  storeName?: string;
  body: string;
}) {
  const admins = await db.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { email: true, name: true },
  });

  const recipients =
    admins.length > 0
      ? admins.map((a) => a.email)
      : [supportEmailAddress()];

  const ticketUrl = appUrl(`/admin/support/${input.ticketId}`);
  const storeLine = input.storeName ? `<br/>Store: <strong>${input.storeName}</strong>` : "";
  const html = emailShell(
    "New support ticket",
    `<strong>${input.userName}</strong> (${input.userEmail}) opened a ticket.<br/>Subject: <strong>${input.subject}</strong>${storeLine}<br/><br/>${input.body}<br/><br/><a href="${ticketUrl}" style="color:#E8A33D;">View in admin →</a>`,
    "Foundry Support"
  );
  const text = `New ticket from ${input.userName} (${input.userEmail})\nSubject: ${input.subject}\n\n${input.body}\n\n${ticketUrl}`;

  await Promise.all(
    recipients.map((to) =>
      sendMail({
        to,
        subject: `[Support] ${input.subject}`,
        text,
        html,
      }).catch((err) => console.error("[support] notify failed:", err))
    )
  );
}

export async function notifyUserTicketReply(input: {
  to: string;
  userName: string;
  subject: string;
  body: string;
  ticketId: string;
}) {
  const url = appUrl(`/dashboard/support/${input.ticketId}`);
  await sendMail({
    to: input.to,
    subject: `Re: ${input.subject}`,
    text: `Hi ${input.userName},\n\n${input.body}\n\nView ticket: ${url}`,
    html: emailShell(
      "Support reply",
      `Hi ${input.userName},<br/><br/>${input.body}<br/><br/><a href="${url}" style="color:#E8A33D;">View your ticket →</a>`,
      "Foundry Support"
    ),
  });
}
