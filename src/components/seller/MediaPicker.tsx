"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Trash2, Film, Loader2, Link2 } from "lucide-react";

type Img = { url: string; alt: string; isVideo: boolean };

/** Product media strip: upload to the store media library or add by URL. */
export function MediaPicker({
  storeId,
  images,
  onChange,
}: {
  storeId: string;
  images: Img[];
  onChange: (images: Img[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "/products");
      const res = await fetch(`/api/store/${storeId}/media`, {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { file: { url: string; mimeType: string } };
        error?: string;
      };
      if (json.ok && json.data) {
        onChange([
          ...images,
          {
            url: json.data.file.url,
            alt: "",
            isVideo: json.data.file.mimeType.startsWith("video/"),
          },
        ]);
      } else {
        setError(json.error ?? "Upload failed");
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function addUrl() {
    const url = urlInput.trim();
    if (!url) return;
    onChange([
      ...images,
      { url, alt: "", isVideo: /\.(mp4|webm)(\?|$)/i.test(url) },
    ]);
    setUrlInput("");
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {images.map((img, i) => (
          <div
            key={`${img.url}-${i}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-base2"
          >
            {img.isVideo ? (
              <div className="flex h-full items-center justify-center text-ink-faint">
                <Film size={22} />
              </div>
            ) : (
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="120px"
                className="object-cover"
                unoptimized={!img.url.startsWith("/")}
              />
            )}
            <button
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove"
            >
              <Trash2 size={12} />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                COVER
              </span>
            )}
          </div>
        ))}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong text-ink-faint transition-colors hover:border-copper hover:text-copper"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          <span className="text-[10.5px]">{uploading ? "Uploading…" : "Upload"}</span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm"
        onChange={(e) => upload(e.target.files)}
        className="hidden"
      />

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
            placeholder="…or paste an image/video URL"
            className="w-full rounded-full border border-line bg-surface py-2 pl-8 pr-3 text-[12.5px] text-ink outline-none focus:border-line-strong"
          />
        </div>
        <button
          onClick={addUrl}
          className="rounded-full border border-line-strong px-4 text-[12.5px] text-ink-dim hover:text-ink"
        >
          Add
        </button>
      </div>
    </div>
  );
}
