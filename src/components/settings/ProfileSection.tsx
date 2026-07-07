"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, BadgeAlert } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/client/api";

type Props = {
  initial: {
    name: string;
    email: string;
    image: string | null;
    emailVerified: boolean;
    createdAt: string;
  };
};

export function ProfileSection({ initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [image, setImage] = useState(initial.image ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setSaved(false);

    const result = await api("/api/user/profile", {
      method: "PATCH",
      body: { name, image: image.trim() === "" ? null : image.trim() },
    });

    if (result.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(result.fieldErrors ? null : result.error);
      setFieldErrors(result.fieldErrors ?? {});
    }
    setLoading(false);
  }

  return (
    <Card title="Profile" description="Your public account information.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        {saved && <Alert kind="success">Profile updated.</Alert>}

        <div className="flex items-center gap-4">
          <Avatar name={name || initial.name} image={image || null} size={56} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-[14px] font-medium text-[#EFE9DF]">
                {initial.email}
              </span>
              {initial.emailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(74,222,128,0.1)] px-2 py-0.5 text-[10.5px] font-medium text-[#86EFAC]">
                  <BadgeCheck size={11} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(232,163,61,0.1)] px-2 py-0.5 text-[10.5px] font-medium text-[#E8A33D]">
                  <BadgeAlert size={11} /> Unverified
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-[#7A7266]">
              Joined{" "}
              {new Intl.DateTimeFormat("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }).format(new Date(initial.createdAt))}
            </p>
          </div>
        </div>

        <Input
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          autoComplete="name"
          required
        />
        <Input
          label="Profile image URL"
          type="url"
          placeholder="https://…"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          error={fieldErrors.image}
          hint="Direct image upload arrives in a later phase. Leave empty for initials."
        />

        <div>
          <Button type="submit" loading={loading}>
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  );
}
