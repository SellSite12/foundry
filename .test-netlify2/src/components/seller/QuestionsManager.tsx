"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, MessageCircle } from "lucide-react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Panel, StatusBadge, Modal } from "@/components/seller/ui";

type Question = {
  id: string;
  productName: string;
  authorName: string;
  question: string;
  answer: string | null;
  status: string;
  createdAt: string;
};

export function QuestionsManager({
  storeId,
  questions,
}: {
  storeId: string;
  questions: Question[];
}) {
  const router = useRouter();
  const [answering, setAnswering] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!answering) return;
    setSaving(true);
    await api(`/api/store/${storeId}/questions?id=${answering.id}`, {
      method: "PATCH",
      body: { answer: answerText },
    });
    setSaving(false);
    setAnswering(null);
    setAnswerText("");
    router.refresh();
  }

  async function hide(q: Question) {
    await api(`/api/store/${storeId}/questions?id=${q.id}`, {
      method: "PATCH",
      body: { status: q.status === "HIDDEN" ? (q.answer ? "ANSWERED" : "PENDING") : "HIDDEN" },
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {questions.map((q) => (
        <Panel key={q.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <StatusBadge status={q.status} />
                <span className="text-[11.5px] text-ink-faint">
                  {q.authorName} on <span className="text-ink-dim">{q.productName}</span> ·{" "}
                  {new Date(q.createdAt).toLocaleDateString("en-US")}
                </span>
              </div>
              <p className="mt-1.5 text-[13.5px] font-medium text-ink">Q: {q.question}</p>
              {q.answer ? (
                <div className="mt-2 rounded-lg bg-base2 p-3 text-[12.5px] text-ink-dim">
                  <span className="mb-1 block text-[10.5px] font-semibold uppercase text-copper">
                    Your answer
                  </span>
                  {q.answer}
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button
                onClick={() => {
                  setAnswering(q);
                  setAnswerText(q.answer ?? "");
                }}
                className="flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-[11.5px] text-ink-dim hover:text-ink"
              >
                <MessageCircle size={12} />
                {q.answer ? "Edit answer" : "Answer"}
              </button>
              <button
                onClick={() => hide(q)}
                className="flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-[11.5px] text-ink-dim hover:text-ink"
              >
                <EyeOff size={12} />
                {q.status === "HIDDEN" ? "Unhide" : "Hide"}
              </button>
            </div>
          </div>
        </Panel>
      ))}

      <Modal open={Boolean(answering)} onClose={() => setAnswering(null)} title="Answer question">
        <form onSubmit={submitAnswer} className="flex flex-col gap-4">
          <p className="text-[13px] text-ink-dim">{answering?.question}</p>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none"
            placeholder="Write a public answer…"
            required
          />
          <Button type="submit" loading={saving} full>
            Publish answer
          </Button>
        </form>
      </Modal>
    </div>
  );
}
