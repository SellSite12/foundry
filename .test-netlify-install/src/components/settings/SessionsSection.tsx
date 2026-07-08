"use client";

import { useEffect, useState } from "react";
import { Monitor, Loader2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/client/api";

type SessionInfo = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  current: boolean;
};

function describeAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/")) return "Safari";
  return "Unknown browser";
}

export function SessionsSection() {
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);

  async function load() {
    const result = await api<{ sessions: SessionInfo[] }>("/api/user/sessions");
    if (result.ok) {
      setSessions(result.data.sessions);
    } else {
      setError(result.error);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function revokeOthers() {
    setRevoking(true);
    setRevoked(false);
    const result = await api("/api/user/sessions", { method: "DELETE" });
    if (result.ok) {
      setRevoked(true);
      await load();
    } else {
      setError(result.error);
    }
    setRevoking(false);
  }

  return (
    <Card
      title="Active sessions"
      description="Devices currently signed in to your account."
    >
      {error && <Alert kind="error">{error}</Alert>}
      {revoked && <Alert kind="success">Other sessions signed out.</Alert>}

      {sessions === null ? (
        <div className="flex items-center gap-2 py-2 text-[13px] text-[#7A7266]">
          <Loader2 size={14} className="animate-spin" /> Loading sessions…
        </div>
      ) : (
        <>
          <div className="mt-2 flex flex-col gap-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-[rgba(232,163,61,0.08)] bg-[#111011] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Monitor size={16} className="text-[#7A7266]" />
                  <div>
                    <div className="text-[13px] font-medium text-[#EFE9DF]">
                      {describeAgent(s.userAgent)}
                      {s.current && (
                        <span className="ml-2 rounded-full bg-[rgba(74,222,128,0.1)] px-2 py-0.5 text-[10px] font-medium text-[#86EFAC]">
                          This device
                        </span>
                      )}
                    </div>
                    <div className="fdy-mono mt-0.5 text-[10.5px] text-[#7A7266]">
                      {s.ipAddress ?? "unknown IP"} · since{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(s.createdAt))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sessions.length > 1 && (
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={revokeOthers}
                loading={revoking}
              >
                Sign out other sessions
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
