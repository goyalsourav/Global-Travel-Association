// Token exchange endpoint for Vercel Blob client uploads. The browser asks
// this route for a scoped upload token, then uploads the file directly to
// Blob storage (bypassing the 4.5 MB serverless body limit, with progress).
import { createFileRoute } from "@tanstack/react-router";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
];

export const Route = createFileRoute("/api/blob-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          return Response.json(
            { error: "BLOB_READ_WRITE_TOKEN is not set on the server" },
            { status: 500 },
          );
        }
        const body = (await request.json()) as HandleUploadBody;
        try {
          const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => ({
              allowedContentTypes: ALLOWED_CONTENT_TYPES,
              maximumSizeInBytes: MAX_FILE_BYTES,
              addRandomSuffix: true,
            }),
            // Fires from Vercel's servers after the upload finishes (not on
            // localhost). We don't depend on it — the client already gets the
            // final blob URL from the upload() call itself.
            onUploadCompleted: async () => {},
          });
          return Response.json(jsonResponse);
        } catch (err) {
          return Response.json(
            { error: err instanceof Error ? err.message : "Upload failed" },
            { status: 400 },
          );
        }
      },
    },
  },
});
