"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/client/api";

type Question = {
  id: string;
  authorName: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
};

export function QuestionsSection({
  slug,
  productId,
  loggedIn,
}: {
  slug: string;
  productId: string;
  loggedIn: boolean;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api<{ questions: Question[] }>(
      `/api/shop/${slug}/questions?productId=${productId}`
    );
    if (res.ok) setQuestions(res.data.questions);
  }, [slug, productId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await api(`/api/shop/${slug}/questions`, {
      method: "POST",
      body: { productId, question, ...(loggedIn ? {} : { authorName }) },
    });
    setBusy(false);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setAsking(false);
    setQuestion("");
    setMessage("Question sent! The seller will answer it soon.");
  }

  return (
    <section aria-label="Questions and answers" className="mt-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--sf-text)" }}>
          Questions & answers
        </h2>
        <button
          type="button"
          onClick={() => setAsking((v) => !v)}
          className="border px-4 py-2 text-[13.5px] font-semibold"
          style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-primary)", color: "var(--sf-primary)" }}
        >
          {asking ? "Cancel" : "Ask a question"}
        </button>
      </div>

      {message ? (
        <p role="status" className="mb-4 text-[13.5px] font-medium" style={{ color: "var(--sf-primary)" }}>
          {message}
        </p>
      ) : null}

      {asking ? (
        <form
          onSubmit={submit}
          className="mb-6 flex flex-col gap-3 border p-5"
          style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
        >
          {!loggedIn ? (
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
              required
              aria-label="Your name"
              className="px-3.5 py-2.5 text-[14px] outline-none"
              style={{ borderRadius: "8px", border: "1px solid var(--sf-line)", background: "var(--sf-bg)", color: "var(--sf-text)" }}
            />
          ) : null}
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to know about this product?"
            required
            rows={3}
            aria-label="Your question"
            className="px-3.5 py-2.5 text-[14px] outline-none"
            style={{ borderRadius: "8px", border: "1px solid var(--sf-line)", background: "var(--sf-bg)", color: "var(--sf-text)" }}
          />
          <button
            type="submit"
            disabled={busy}
            className="self-start px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}
          >
            {busy ? "Sending…" : "Send question"}
          </button>
        </form>
      ) : null}

      {questions.length === 0 ? (
        <p className="text-[14px]" style={{ color: "var(--sf-text-dim)" }}>
          No answered questions yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li
              key={q.id}
              className="border p-5"
              style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
            >
              <p className="text-[14px] font-semibold" style={{ color: "var(--sf-text)" }}>
                Q: {q.question}
              </p>
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--sf-text-dim)" }}>
                asked by {q.authorName}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
                <span className="font-semibold" style={{ color: "var(--sf-primary)" }}>A: </span>
                {q.answer}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
