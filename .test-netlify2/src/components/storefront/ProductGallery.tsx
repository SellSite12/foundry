"use client";

import { useState } from "react";

type Media = { url: string; alt: string | null; isVideo: boolean };

/** Image/video gallery with thumbnails and click-to-zoom. */
export function ProductGallery({ media, productName }: { media: Media[]; productName: string }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const current = media[index] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-square overflow-hidden border"
        style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
      >
        {current ? (
          current.isVideo ? (
            <video
              src={current.url}
              controls
              className="h-full w-full object-contain"
              aria-label={current.alt ?? productName}
            />
          ) : (
            <button
              type="button"
              onClick={() => setZoomed(true)}
              className="h-full w-full cursor-zoom-in"
              aria-label="Zoom image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.url}
                alt={current.alt ?? productName}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
          )
        ) : (
          <div className="flex h-full items-center justify-center text-6xl" aria-hidden style={{ color: "var(--sf-text-dim)", opacity: 0.35 }}>
            ◇
          </div>
        )}
      </div>

      {media.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product media">
          {media.map((m, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show media ${i + 1}`}
              onClick={() => setIndex(i)}
              className="relative h-16 w-16 shrink-0 overflow-hidden border-2 transition-colors"
              style={{
                borderRadius: "8px",
                borderColor: i === index ? "var(--sf-primary)" : "var(--sf-line)",
              }}
            >
              {m.isVideo ? (
                <span className="flex h-full w-full items-center justify-center text-xl" style={{ background: "var(--sf-surface)", color: "var(--sf-text)" }} aria-hidden>
                  ▶
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      ) : null}

      {/* Zoom overlay */}
      {zoomed && current && !current.isVideo ? (
        <div
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-4"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed product image"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt={current.alt ?? productName} className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close zoom"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white"
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
