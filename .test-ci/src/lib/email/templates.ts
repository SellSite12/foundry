import { formatMoney } from "@/lib/money";
import { emailShell, button, appUrl } from "@/lib/email/mailer";

type StoreBrand = { name: string; slug?: string };

export function orderConfirmationEmail(input: {
  store: StoreBrand;
  orderNumber: string | number;
  totalCents: number;
  currency: string;
  buyerName: string;
  orderId: string;
}) {
  const total = formatMoney(input.totalCents, input.currency);
  const orderUrl = appUrl(`/account/orders/${input.orderId}`);
  const title = `Order #${input.orderNumber} confirmed`;
  const text = `Hi ${input.buyerName},\n\nYour order #${input.orderNumber} at ${input.store.name} is confirmed.\nTotal: ${total}\n\nView your order: ${orderUrl}`;
  const html = emailShell(
    title,
    `Hi ${input.buyerName}, your order <strong>#${input.orderNumber}</strong> at <strong>${input.store.name}</strong> is confirmed.<br/>Total: <strong>${total}</strong><br/>${button(orderUrl, "View order")}`,
    input.store.name
  );
  return { subject: `${input.store.name} — order #${input.orderNumber} confirmed`, text, html };
}

export function shippingUpdateEmail(input: {
  store: StoreBrand;
  orderNumber: string | number;
  status: "SHIPPED" | "DELIVERED";
  tracking?: string | null;
  carrier?: string | null;
}) {
  const shipped = input.status === "SHIPPED";
  const title = shipped ? `Order #${input.orderNumber} has shipped` : `Order #${input.orderNumber} delivered`;
  const trackingLine = input.tracking
    ? `Tracking: ${input.tracking}${input.carrier ? ` via ${input.carrier}` : ""}`
    : "";
  const text = shipped
    ? `Good news! Your ${input.store.name} order #${input.orderNumber} is on its way.\n${trackingLine}`
    : `Your ${input.store.name} order #${input.orderNumber} was delivered. Enjoy!`;
  const html = emailShell(
    title,
    shipped
      ? `Your order <strong>#${input.orderNumber}</strong> from <strong>${input.store.name}</strong> is on its way.${input.tracking ? `<br/>Tracking: ${input.tracking}${input.carrier ? ` via ${input.carrier}` : ""}` : ""}`
      : `Your order <strong>#${input.orderNumber}</strong> from <strong>${input.store.name}</strong> was delivered.`,
    input.store.name
  );
  return {
    subject: `${input.store.name} — order #${input.orderNumber} ${shipped ? "shipped" : "delivered"}`,
    text,
    html,
  };
}

export function refundEmail(input: {
  store: StoreBrand;
  orderNumber: string | number;
  amountCents: number;
  currency: string;
  reason: string;
}) {
  const amount = formatMoney(input.amountCents, input.currency);
  const text = `Hi,\n\n${amount} has been refunded for your ${input.store.name} order #${input.orderNumber}.\nReason: ${input.reason}`;
  const html = emailShell(
    "Refund processed",
    `<strong>${amount}</strong> has been refunded for order <strong>#${input.orderNumber}</strong>.<br/>Reason: ${input.reason}`,
    input.store.name
  );
  return { subject: `${input.store.name} — refund for order #${input.orderNumber}`, text, html };
}

export function teamInviteEmail(input: {
  storeName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}) {
  const text = `${input.inviterName} invited you to join ${input.storeName} as ${input.role}.\n\nAccept: ${input.inviteUrl}`;
  const html = emailShell(
    `Join ${input.storeName}`,
    `<strong>${input.inviterName}</strong> invited you to join <strong>${input.storeName}</strong> as <strong>${input.role}</strong>.<br/>${button(input.inviteUrl, "Accept invitation")}`,
    input.storeName
  );
  return { subject: `Invitation to join ${input.storeName}`, text, html };
}

export function securityAlertEmail(input: {
  name: string;
  event: string;
  detail: string;
}) {
  const text = `Hi ${input.name},\n\nSecurity alert: ${input.event}\n${input.detail}`;
  const html = emailShell("Security alert", `<strong>${input.event}</strong><br/>${input.detail}`, "Foundry");
  return { subject: "Foundry security alert", text, html };
}
