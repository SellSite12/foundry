import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";

const BLOB_STORE = "foundry-uploads";

function useBlobs(): boolean {
  return process.env.UPLOAD_STORE === "blobs" || process.env.NETLIFY === "true";
}

export function urlToSegments(url: string): string[] | null {
  if (!url.startsWith("/uploads/")) return null;
  const parts = url.replace(/^\/uploads\//, "").split("/");
  if (parts.some((s) => !s || s.includes(".."))) return null;
  return parts;
}

async function blobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore(BLOB_STORE);
}

export async function putUpload(segments: string[], data: Buffer): Promise<void> {
  const key = segments.join("/");
  if (useBlobs()) {
    const store = await blobStore();
    await store.set(key, new Blob([data]));
    return;
  }
  const filePath = path.join(process.cwd(), "var", "uploads", ...segments);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
}

export async function getUpload(segments: string[]): Promise<Buffer | null> {
  const key = segments.join("/");
  if (useBlobs()) {
    const store = await blobStore();
    const data = await store.get(key, { type: "arrayBuffer" });
    return data ? Buffer.from(data) : null;
  }
  try {
    return await readFile(path.join(process.cwd(), "var", "uploads", ...segments));
  } catch {
    return null;
  }
}

export async function deleteUpload(segments: string[]): Promise<void> {
  const key = segments.join("/");
  if (useBlobs()) {
    const store = await blobStore();
    await store.delete(key);
    return;
  }
  await unlink(path.join(process.cwd(), "var", "uploads", ...segments)).catch(() => {});
}
