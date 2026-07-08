import { getEmailSetupStatus } from "@/lib/email/status";
import { PageHeader, Panel } from "@/components/seller/ui";

export const metadata = { title: "Admin — Email" };

export default function AdminEmailPage() {
  const email = getEmailSetupStatus();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Email setup" description="Platform transactional email configuration." />
      <Panel title="Provider">
        <ul className="space-y-2 text-[13px] text-ink-dim">
          <li>Status: <strong className="text-ink">{email.configured ? "Ready" : "Not configured"}</strong></li>
          <li>Provider: <strong className="text-ink">{email.provider}</strong></li>
          <li>From: {email.fromAddress}</li>
          <li>Support inbox: {email.supportAddress}</li>
          <li>Transactional: {email.transactionalReady ? "Yes" : "No"}</li>
          <li>Marketing: {email.marketingReady ? "Yes" : "No"}</li>
        </ul>
      </Panel>
      <Panel title="Notes" className="mt-4">
        <ul className="space-y-1 text-[13px] text-ink-dim">
          {email.notes.map((n) => (
            <li key={n}>• {n}</li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] text-ink-faint">
          Set <code className="text-copper">RESEND_API_KEY</code> and <code className="text-copper">EMAIL_FROM</code> in production.
          Optional <code className="text-copper">SUPPORT_EMAIL</code> receives new ticket notifications.
        </p>
      </Panel>
    </div>
  );
}
