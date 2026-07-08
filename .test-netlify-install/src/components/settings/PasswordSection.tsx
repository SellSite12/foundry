"use client";

import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/client/api";

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    if (newPassword !== confirm) {
      setFieldErrors({ confirm: "Passwords do not match" });
      return;
    }
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const result = await api("/api/user/password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });

    if (result.ok) {
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } else {
      setError(result.fieldErrors ? null : result.error);
      setFieldErrors(result.fieldErrors ?? {});
    }
    setLoading(false);
  }

  return (
    <Card
      title="Password"
      description="Changing your password signs out every other device."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        {saved && (
          <Alert kind="success">
            Password changed. Other sessions have been signed out.
          </Alert>
        )}

        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={fieldErrors.currentPassword}
          required
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={fieldErrors.newPassword}
          hint="At least 8 characters, with an uppercase letter and a number."
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
          required
        />

        <div>
          <Button type="submit" loading={loading} variant="secondary">
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}
