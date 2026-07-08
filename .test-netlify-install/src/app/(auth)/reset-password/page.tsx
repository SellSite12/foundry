"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/client/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setFieldErrors({ confirm: "Passwords do not match" });
      return;
    }
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const result = await api("/api/auth/reset-password", {
      method: "POST",
      body: { token, password },
    });

    if (result.ok) {
      setDone(true);
    } else {
      setError(result.fieldErrors ? null : result.error);
      setFieldErrors(result.fieldErrors ?? {});
    }
    setLoading(false);
  }

  if (!token) {
    return (
      <AuthShell
        title="Invalid link"
        footer={
          <Link href="/forgot-password" className="font-medium text-[#E8A33D] hover:underline">
            Request a new reset link
          </Link>
        }
      >
        <Alert kind="error">
          This reset link is missing its token. Request a new one and use the
          full link from the email.
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Your old password will stop working and every device will be signed out."
      footer={
        <Link href="/login" className="font-medium text-[#E8A33D] hover:underline">
          Back to sign in
        </Link>
      }
    >
      {done ? (
        <div className="flex flex-col gap-4">
          <Alert kind="success">
            Password updated. You can now sign in with your new password.
          </Alert>
          <Link href="/login">
            <Button full>Go to sign in</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            hint="At least 8 characters, with an uppercase letter and a number."
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={fieldErrors.confirm}
            required
          />
          <Button type="submit" loading={loading} full className="mt-2">
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
