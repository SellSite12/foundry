"use client";

import { useState } from "react";

import { api } from "@/lib/client/api";

const inputStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid var(--sf-line)",
  background: "var(--sf-surface)",
  color: "var(--sf-text)",
};

export function ContactForm({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const res = await api(`/api/shop/${slug}/contact`, {
      method: "POST",
      body: { name, email, subject, message },
    });
    setBusy(false);
    if (!res.ok) {
      setResult({ kind: "error", text: res.error });
      return;
    }
    setResult({ kind: "ok", text: "Message sent! We'll get back to you shortly." });
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>
            Your name
          </label>
          <input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-[14px] outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>
            Email address
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-[14px] outline-none"
            style={inputStyle}
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>
          Subject
        </label>
        <input
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full px-3.5 py-2.5 text-[14px] outline-none"
          style={inputStyle}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="w-full px-3.5 py-2.5 text-[14px] outline-none"
          style={inputStyle}
        />
      </div>
      {result ? (
        <p role="status" className="text-[13.5px] font-medium" style={{ color: result.kind === "ok" ? "#22C55E" : "#EF4444" }}>
          {result.text}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="self-start px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-50"
        style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}
      >
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
