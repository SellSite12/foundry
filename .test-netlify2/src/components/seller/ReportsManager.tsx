"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Plus } from "lucide-react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel, Table, Th, Td } from "@/components/seller/ui";

type Report = {
  id: string;
  name: string;
  type: string;
  format: string;
  schedule: string | null;
  lastRunAt: string | null;
  runs: { id: string; status: string; fileUrl: string | null; rowCount: number | null }[];
};

export function ReportsManager({ storeId, reports }: { storeId: string; reports: Report[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("sales");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await api(`/api/store/${storeId}/reports`, {
      method: "POST",
      body: { name, type, format: "CSV" },
    });
    setName("");
    router.refresh();
  }

  async function run(id: string) {
    await api(`/api/store/${storeId}/reports?id=${id}`, { method: "PATCH" });
    router.refresh();
  }

  return (
    <div className="grid gap-5">
      <Panel title="Create report">
        <form onSubmit={create} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-[var(--text-muted)]">Name</label>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">Type</label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="sales">Sales</option>
              <option value="inventory">Inventory</option>
              <option value="customers">Customers</option>
            </select>
          </div>
          <Button type="submit"><Plus size={16} className="mr-1" /> Add</Button>
        </form>
      </Panel>

      <Panel title="Reports">
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Schedule</Th>
              <Th>Last run</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <Td>{r.name}</Td>
                <Td>{r.type}</Td>
                <Td>{r.schedule ?? "On demand"}</Td>
                <Td>{r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : "—"}</Td>
                <Td>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="!py-1.5 !px-3 !text-xs" onClick={() => run(r.id)}>Run</Button>
                    {r.runs[0]?.fileUrl && (
                      <a href={r.runs[0].fileUrl} className="btn btn-sm btn-ghost">
                        <FileDown size={14} />
                      </a>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
