"use client";

import { useState } from "react";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/client/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await api("/api/auth/forgot-password", {
      method: "POST",
      body: { email },
    });

    if (result.ok) {
      setSent(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
      footer={
        <Link href="/login" className="font-medium text-[#E8A33D] hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <Alert kind="success">
          If an account exists for <span className="font-medium">{email}</span>,
          a reset link is on its way. The link expires in 60 minutes.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} full className="mt-2">
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
