"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/seller/ui";
import { api } from "@/lib/client/api";

export function CreateStoreButton({ primary = false }: { primary?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const result = await api<{ store: { id: string } }>("/api/stores", {
      method: "POST",
      body: { name },
    });

    if (result.ok) {
      router.push(`/onboarding/${result.data.store.id}`);
      router.refresh();
      return;
    }
    setError(result.fieldErrors ? null : result.error);
    setFieldErrors(result.fieldErrors ?? {});
    setLoading(false);
  }

  return (
    <>
      <Button variant={primary ? "primary" : "secondary"} onClick={() => setOpen(true)}>
        <Plus size={14} /> Create store
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create a new store">
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          <Input
            label="Business name"
            placeholder="Acme Studio"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            required
            autoFocus
          />
          <p className="text-[12px] text-ink-faint">
            You&apos;ll be guided through a short onboarding to set up contact
            details, tax, currency, and branding.
          </p>
          <Button type="submit" loading={loading} full>
            Create & start onboarding
          </Button>
        </form>
      </Modal>
    </>
  );
}
