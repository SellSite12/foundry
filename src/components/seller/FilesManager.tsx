"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Upload,
  Search,
  Trash2,
  FolderOpen,
  FileText,
  Film,
  File as FileIcon,
  RefreshCw,
  Eye,
} from "lucide-react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { EmptyState, Modal } from "@/components/seller/ui";

type MediaFile = {
  id: string;
  name: string;
  folder: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function FilesManager({
  storeId,
  files,
  folders,
  activeFolder,
  q,
  usedBytes,
  limitBytes,
  planName,
}: {
  storeId: string;
  files: MediaFile[];
  folders: string[];
  activeFolder: string;
  q: string;
  usedBytes: number;
  limitBytes: number;
  planName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(q);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);
  const [uploadFolder, setUploadFolder] = useState(activeFolder || "/");

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({ q: search, folder: activeFolder, ...params });
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    router.push(`${pathname}?${sp.toString()}`);
  }

  async function upload(fileList: FileList | null, replaceId?: string) {
    if (!fileList?.length) return;
    setUploading(true);
    setError(null);
    for (const file of Array.from(fileList)) {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", uploadFolder || "/");
      if (replaceId) form.append("replaceId", replaceId);
      const res = await fetch(`/api/store/${storeId}/media`, { method: "POST", body: form });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) setError(json.error ?? "Upload failed");
      if (replaceId) break;
    }
    setUploading(false);
    setReplaceTarget(null);
    if (fileRef.current) fileRef.current.value = "";
    if (replaceRef.current) replaceRef.current.value = "";
    router.refresh();
  }

  async function remove(file: MediaFile) {
    if (!confirm(`Delete "${file.name}"?`)) return;
    const res = await api(`/api/store/${storeId}/media?id=${file.id}`, { method: "DELETE" });
    if (res.ok) {
      setPreview(null);
      router.refresh();
    }
  }

  const pct = limitBytes ? Math.min(100, (usedBytes / limitBytes) * 100) : 0;

  return (
    <div>
      {/* storage meter + toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({});
          }}
          className="relative"
        >
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-4 text-[13px] text-ink outline-none focus:border-line-strong sm:w-64"
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-[11.5px] text-ink-faint md:flex">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-hover">
              <div className="h-full rounded-full bg-copper" style={{ width: `${pct}%` }} />
            </div>
            {formatBytes(usedBytes)} of {formatBytes(limitBytes)} ({planName})
          </div>
          <input
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            className="w-28 rounded-full border border-line bg-surface px-3 py-2 text-[12px] text-ink-dim outline-none"
            title="Upload folder"
            aria-label="Upload folder"
          />
          <Button onClick={() => fileRef.current?.click()} loading={uploading}>
            <Upload size={14} /> Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] text-danger">{error}</p>
      )}

      {/* folders */}
      {folders.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => navigate({ folder: "" })}
            className={`rounded-full px-3 py-1.5 text-[12px] ${
              !activeFolder ? "bg-copper-soft font-medium text-copper" : "text-ink-faint hover:text-ink"
            }`}
          >
            All files
          </button>
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => navigate({ folder: f })}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] ${
                activeFolder === f
                  ? "bg-copper-soft font-medium text-copper"
                  : "text-ink-faint hover:text-ink"
              }`}
            >
              <FolderOpen size={12} /> {f}
            </button>
          ))}
        </div>
      )}

      {files.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={20} />}
          title="No files yet"
          body="Upload images, videos, PDFs, and documents. Files are organized in folders, searchable, and reusable across products."
          action={
            <Button onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Upload your first file
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {files.map((f) => (
            <button
              key={f.id}
              onClick={() => setPreview(f)}
              className="group overflow-hidden rounded-xl border border-line bg-surface text-left transition-colors hover:border-line-strong"
            >
              <div className="relative flex aspect-square items-center justify-center bg-base2">
                {f.mimeType.startsWith("image/") ? (
                  <Image
                    src={f.url}
                    alt={f.name}
                    fill
                    sizes="160px"
                    className="object-cover"
                    unoptimized={!f.url.startsWith("/")}
                  />
                ) : f.mimeType.startsWith("video/") ? (
                  <Film size={24} className="text-ink-faint" />
                ) : f.mimeType === "application/pdf" ? (
                  <FileText size={24} className="text-ink-faint" />
                ) : (
                  <FileIcon size={24} className="text-ink-faint" />
                )}
              </div>
              <div className="p-2.5">
                <div className="truncate text-[11.5px] font-medium text-ink">{f.name}</div>
                <div className="text-[10px] text-ink-faint">{formatBytes(f.sizeBytes)}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* preview modal */}
      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title={preview?.name ?? ""} wide>
        {preview && (
          <div className="flex flex-col gap-4">
            <div className="relative flex max-h-[50vh] min-h-40 items-center justify-center overflow-hidden rounded-xl border border-line bg-base2">
              {preview.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={preview.name} className="max-h-[50vh] object-contain" />
              ) : preview.mimeType.startsWith("video/") ? (
                <video src={preview.url} controls className="max-h-[50vh]" />
              ) : (
                <div className="flex flex-col items-center gap-2 py-10 text-ink-faint">
                  <FileText size={32} />
                  <a
                    href={preview.url}
                    target="_blank"
                    className="flex items-center gap-1.5 text-[12.5px] text-copper hover:underline"
                  >
                    <Eye size={12} /> Open file
                  </a>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-[12px] text-ink-faint">
              <span>
                {preview.mimeType} · {formatBytes(preview.sizeBytes)} · {preview.folder}
              </span>
              <span>{new Date(preview.createdAt).toLocaleDateString("en-US")}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setReplaceTarget(preview.id);
                  replaceRef.current?.click();
                }}
              >
                <RefreshCw size={13} /> Replace
              </Button>
              <Button variant="ghost" onClick={() => remove(preview)}>
                <span className="flex items-center gap-2 text-danger">
                  <Trash2 size={13} /> Delete
                </span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <input
        ref={replaceRef}
        type="file"
        className="hidden"
        onChange={(e) => replaceTarget && upload(e.target.files, replaceTarget)}
      />
    </div>
  );
}
