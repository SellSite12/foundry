"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/client/api";

export function DangerZone() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onDelete(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const result = await api("/api/user/account", {
      method: "DELETE",
      body: { password },
    });

    if (result.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    setError(result.fieldErrors ? null : result.error);
    setFieldErrors(result.fieldErrors ?? {});
    setLoading(false);
  }

  return (
    <Card
      title="Danger zone"
      description="Export your data or permanently delete your account."
      className="border-[rgba(248,113,113,0.25)]"
    >
      <div className="mb-6">
        <p className="text-sm text-ink-dim mb-2">
          Download a copy of your profile, orders, addresses, and preferences (JSON).
        </p>
        <a
          href="/api/user/export"
          className="inline-flex items-center px-4 py-2 rounded-full border border-line-strong text-sm text-ink hover:border-copper"
          download="foundry-data-export.json"
        >
          Export my data
        </a>
      </div>
      {!confirming ? (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Delete account
        </Button>
      ) : (
        <form onSubmit={onDelete} className="flex flex-col gap-4" noValidate>
          <Alert kind="error">
            This is permanent. Your profile, stores, orders, and settings will
            be deleted and cannot be recovered.
          </Alert>
          <Input
            label="Confirm your password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password ?? (error ?? undefined)}
            required
          />
          <div className="flex gap-3">
            <Button variant="danger" type="submit" loading={loading}>
              Permanently delete
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setConfirming(false);
                setPassword("");
                setError(null);
                setFieldErrors({});
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
