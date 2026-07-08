"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/client/api";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("");
  const requested = useRef(false);

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    // Tokens are single-use; guard against React strict-mode double effects.
    if (requested.current) return;
    requested.current = true;

    api("/api/auth/verify-email", { method: "POST", body: { token } }).then(
      (result) => {
        if (result.ok) {
          setState("success");
        } else {
          setState("error");
          setMessage(result.error);
        }
      }
    );
  }, [token]);

  return (
    <AuthShell
      title="Email verification"
      footer={
        <Link href="/dashboard" className="font-medium text-[#E8A33D] hover:underline">
          Go to dashboard
        </Link>
      }
    >
      {state === "verifying" && (
        <div className="flex items-center gap-3 text-[14px] text-[#B8AFA0]">
          <Loader2 size={16} className="animate-spin text-[#E8A33D]" />
          Verifying your email…
        </div>
      )}
      {state === "success" && (
        <div className="flex flex-col gap-4">
          <Alert kind="success">
            Your email has been verified. Your account is fully set up.
          </Alert>
          <Link href="/dashboard">
            <Button full>Continue to dashboard</Button>
          </Link>
        </div>
      )}
      {state === "error" && (
        <div className="flex flex-col gap-4">
          <Alert kind="error">{message}</Alert>
          <p className="text-[13px] text-[#7A7266]">
            You can request a fresh verification email from your dashboard
            settings.
          </p>
        </div>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
