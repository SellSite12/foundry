"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/client/api";
import { Stars } from "@/components/storefront/ui";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  photos: string[];
  verified: boolean;
  reply: string | null;
  createdAt: string;
  mine: boolean;
};

const inputStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid var(--sf-line)",
  background: "var(--sf-bg)",
  color: "var(--sf-text)",
};

export function ReviewsSection({
  slug,
  productId,
  loggedIn,
  average,
  count,
}: {
  slug: string;
  productId: string;
  loggedIn: boolean;
  average: number | null;
  count: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [writing, setWriting] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api<{ reviews: Review[] }>(
      `/api/shop/${slug}/reviews?productId=${productId}`
    );
    if (res.ok) setReviews(res.data.reviews);
  }, [slug, productId]);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(r: Review) {
    setEditing(r);
    setWriting(true);
    setRating(r.rating);
    setTitle(r.title ?? "");
    setBody(r.body ?? "");
    setPhotos(r.photos);
    setMessage(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = editing
      ? await api(`/api/shop/${slug}/reviews?id=${editing.id}`, {
          method: "PATCH",
          body: { rating, title: title || null, body, photos },
        })
      : await api(`/api/shop/${slug}/reviews`, {
          method: "POST",
          body: {
            productId,
            rating,
            title: title || null,
            body,
            photos,
            ...(loggedIn ? {} : { authorName }),
          },
        });
    setBusy(false);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setWriting(false);
    setEditing(null);
    setTitle("");
    setBody("");
    setPhotos([]);
    setMessage("Thanks! Your review is awaiting moderation and will appear once approved.");
    load();
  }

  async function remove(id: string) {
    const res = await api(`/api/shop/${slug}/reviews?id=${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <section aria-label="Customer reviews" className="mt-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--sf-text)" }}>
            Reviews
          </h2>
          <Stars average={average} count={count} />
        </div>
        <button
          type="button"
          onClick={() => {
            setWriting((v) => !v);
            setEditing(null);
            setMessage(null);
          }}
          className="border px-4 py-2 text-[13.5px] font-semibold"
          style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-primary)", color: "var(--sf-primary)" }}
        >
          {writing ? "Cancel" : "Write a review"}
        </button>
      </div>

      {message ? (
        <p role="status" className="mb-4 text-[13.5px] font-medium" style={{ color: "var(--sf-primary)" }}>
          {message}
        </p>
      ) : null}

      {writing ? (
        <form
          onSubmit={submit}
          className="mb-8 flex flex-col gap-3 border p-5"
          style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
        >
          <div>
            <label className="mb-1 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>
              Your rating
            </label>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => setRating(n)}
                  className="text-2xl"
                  style={{ color: n <= rating ? "var(--sf-primary)" : "var(--sf-line)" }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          {!loggedIn ? (
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
              required
              aria-label="Your name"
              className="px-3.5 py-2.5 text-[14px] outline-none"
              style={inputStyle}
            />
          ) : null}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            aria-label="Review title"
            className="px-3.5 py-2.5 text-[14px] outline-none"
            style={inputStyle}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you think?"
            required
            rows={4}
            aria-label="Review body"
            className="px-3.5 py-2.5 text-[14px] outline-none"
            style={inputStyle}
          />
          <div className="flex gap-2">
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Photo URL (optional)"
              aria-label="Photo URL"
              className="flex-1 px-3.5 py-2.5 text-[14px] outline-none"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => {
                if (photoUrl.trim() && photos.length < 6) {
                  setPhotos((p) => [...p, photoUrl.trim()]);
                  setPhotoUrl("");
                }
              }}
              className="border px-4 text-[13px] font-medium"
              style={{ borderRadius: "8px", borderColor: "var(--sf-line)", color: "var(--sf-text-dim)" }}
            >
              Add photo
            </button>
          </div>
          {photos.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px]" style={{ borderColor: "var(--sf-line)", color: "var(--sf-text-dim)" }}>
                  photo {i + 1}
                  <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((arr) => arr.filter((_, j) => j !== i))}>✕</button>
                </span>
              ))}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="self-start px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}
          >
            {busy ? "Submitting…" : editing ? "Update review" : "Submit review"}
          </button>
        </form>
      ) : null}

      {reviews.length === 0 ? (
        <p className="text-[14px]" style={{ color: "var(--sf-text-dim)" }}>
          No published reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="border p-5"
              style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Stars average={r.rating} count={0} showCount={false} />
                  <span className="text-[13.5px] font-semibold" style={{ color: "var(--sf-text)" }}>
                    {r.authorName}
                  </span>
                  {r.verified ? (
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "color-mix(in srgb, var(--sf-primary) 15%, transparent)", color: "var(--sf-primary)" }}>
                      Verified purchase
                    </span>
                  ) : null}
                </div>
                <span className="text-[12px]" style={{ color: "var(--sf-text-dim)" }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              {r.title ? (
                <h3 className="mt-2 text-[14.5px] font-semibold" style={{ color: "var(--sf-text)" }}>
                  {r.title}
                </h3>
              ) : null}
              {r.body ? (
                <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
                  {r.body}
                </p>
              ) : null}
              {r.photos.length > 0 ? (
                <div className="mt-3 flex gap-2">
                  {r.photos.map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={p} alt={`Review photo ${i + 1}`} loading="lazy" className="h-20 w-20 rounded-lg object-cover" />
                  ))}
                </div>
              ) : null}
              {r.reply ? (
                <div className="mt-3 border-l-2 pl-3 text-[13.5px]" style={{ borderColor: "var(--sf-primary)", color: "var(--sf-text-dim)" }}>
                  <span className="font-semibold" style={{ color: "var(--sf-text)" }}>Seller response: </span>
                  {r.reply}
                </div>
              ) : null}
              {r.mine ? (
                <div className="mt-3 flex gap-3 text-[12.5px] font-medium">
                  <button type="button" onClick={() => startEdit(r)} style={{ color: "var(--sf-primary)" }}>
                    Edit
                  </button>
                  <button type="button" onClick={() => remove(r.id)} style={{ color: "#EF4444" }}>
                    Delete
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
