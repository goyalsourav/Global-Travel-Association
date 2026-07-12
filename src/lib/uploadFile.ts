// Client-side upload helper. Uploads go straight from the browser to Vercel
// Blob using a short-lived token minted by /api/blob-upload, with real
// progress events and cancellation. Swap the internals here if the storage
// backend ever changes — callers only know about UploadedFileMeta.
import { upload } from "@vercel/blob/client";

export type UploadedFileMeta = {
  url: string;
  name: string;
  size: number;
  type: string;
};

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadFile(
  file: File,
  folder: string,
  onProgress: (percentage: number) => void,
  signal?: AbortSignal,
): Promise<UploadedFileMeta> {
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const result = await upload(`${folder}/${safeName}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob-upload",
    onUploadProgress: ({ percentage }) => onProgress(percentage),
    abortSignal: signal,
  });
  return { url: result.url, name: file.name, size: file.size, type: file.type };
}
