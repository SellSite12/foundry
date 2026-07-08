"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/client/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const result = await api("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });

    if (result.ok) {
      router.push(next);
      router.refresh();
      return;
    }

    setError(result.fieldErrors ? null : result.error);
    setFieldErrors(result.fieldErrors ?? {});
    setLoading(false);
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Foundry account."
      footer={
        <>
          New to Foundry?{" "}
          <Link href="/signup" className="font-medium text-[#E8A33D] hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert kind="error">{error}</Alert>}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />
        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            required
          />
          <Link
            href="/forgot-password"
            className="self-end text-[12px] text-[#B8AFA0] hover:text-[#E8A33D]"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} full className="mt-2">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
