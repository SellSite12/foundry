"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Eye, EyeOff, MessageSquare, Flag } from "lucide-react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Panel, StatusBadge, Modal } from "@/components/seller/ui";

type Review = {
  id: string;
  productName: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  reply: string | null;
  status: string;
  reported: boolean;
  verified: boolean;
  createdAt: string;
};

export function ReviewsManager({ storeId, reviews }: { storeId: string; reviews: Review[] }) {
  const router = useRouter();
  const [replying, setReplying] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  async function moderate(review: Review, status: string) {
    await api(`/api/store/${storeId}/reviews?id=${review.id}`, {
      method: "PATCH",
      body: { status },
    });
    router.refresh();
  }

  async function report(review: Review) {
    await api(`/api/store/${storeId}/reviews?id=${review.id}`, {
      method: "PATCH",
      body: { report: !review.reported, reportNote: review.reported ? null : "Flagged by seller" },
    });
    router.refresh();
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replying) return;
    setSaving(true);
    await api(`/api/store/${storeId}/reviews?id=${replying.id}`, {
      method: "PATCH",
      body: { reply: replyText },
    });
    setSaving(false);
    setReplying(null);
    setReplyText("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((r) => (
        <Panel key={r.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={i < r.rating ? "fill-copper text-copper" : "text-line-strong"}
                    />
                  ))}
                </div>
                <StatusBadge status={r.status} />
                {r.verified && (
                  <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10.5px] font-semibold text-success">
                    Verified purchase
                  </span>
                )}
                {r.reported && (
                  <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10.5px] font-semibold text-danger">
                    Reported
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-[13.5px] font-medium text-ink">
                {r.title ?? "(no title)"}
              </div>
              {r.body && <p className="mt-1 text-[13px] text-ink-dim">{r.body}</p>}
              <div className="mt-2 text-[11.5px] text-ink-faint">
                {r.authorName} on <span className="text-ink-dim">{r.productName}</span> ·{" "}
                {new Date(r.createdAt).toLocaleDateString("en-US")}
              </div>
              {r.reply && (
                <div className="mt-3 rounded-lg bg-base2 p-3 text-[12.5px] text-ink-dim">
                  <span className="mb-1 block text-[10.5px] font-semibold uppercase text-copper">
                    Your reply
                  </span>
                  {r.reply}
                </div>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              {r.status !== "PUBLISHED" && (
                <ActionBtn onClick={() => moderate(r, "PUBLISHED")} icon={<Eye size={12} />}>
                  Publish
                </ActionBtn>
              )}
              {r.status !== "HIDDEN" && (
                <ActionBtn onClick={() => moderate(r, "HIDDEN")} icon={<EyeOff size={12} />}>
                  Hide
                </ActionBtn>
              )}
              <ActionBtn
                onClick={() => {
                  setReplying(r);
                  setReplyText(r.reply ?? "");
                }}
                icon={<MessageSquare size={12} />}
              >
                {r.reply ? "Edit reply" : "Reply"}
              </ActionBtn>
              <ActionBtn onClick={() => report(r)} icon={<Flag size={12} />}>
                {r.reported ? "Unreport" : "Report abuse"}
              </ActionBtn>
            </div>
          </div>
        </Panel>
      ))}

      <Modal open={Boolean(replying)} onClose={() => setReplying(null)} title="Reply to review">
        <form onSubmit={sendReply} className="flex flex-col gap-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none"
            placeholder="Thanks for the feedback…"
            required
          />
          <Button type="submit" loading={saving} full>
            Save reply
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-[11.5px] text-ink-dim hover:text-ink"
    >
      {icon}
      {children}
    </button>
  );
}
