"use client";

import { Panel, Table, Th, Td } from "@/components/seller/ui";

type Log = {
  id: string;
  action: string;
  userName: string | null;
  detail: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

export function AuditLogViewer({ logs }: { logs: Log[] }) {
  return (
    <Panel title="Audit trail" description="Security-sensitive actions across your store.">
      <Table>
        <thead>
          <tr>
            <Th>Time</Th>
            <Th>Action</Th>
            <Th>User</Th>
            <Th>IP</Th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <Td>{new Date(l.createdAt).toLocaleString()}</Td>
              <Td><code className="text-xs">{l.action}</code></Td>
              <Td>{l.userName ?? "System"}</Td>
              <Td>{l.ipAddress ?? "—"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Panel>
  );
}
