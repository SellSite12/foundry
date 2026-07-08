import { AdminTicketDetail } from "@/components/admin/AdminTicketDetail";

export const metadata = { title: "Support ticket" };

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return <AdminTicketDetail ticketId={ticketId} />;
}
