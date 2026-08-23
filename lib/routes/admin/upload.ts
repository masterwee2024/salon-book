import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { verifyToken } from "../../auth.js";

export const config = {
  api: { bodyParser: false },
};

export async function handleAdminUpload(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token))) {
    return res.status(401).json({ error: "Admin authentication required." });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const formidable = await import("formidable");
  const form = formidable.formidable({
    maxFileSize: 4 * 1024 * 1024,
    filter: ({ mimetype }) => Boolean(mimetype?.startsWith("image/")),
    keepExtensions: true,
  });

  const [, files] = await form.parse(req as never);
  const file = Array.isArray(files.file) ? files.file[0] : (files.file as unknown as { filepath: string; originalFilename?: string | null; mimetype?: string | null } | undefined);
  if (!file || !file.filepath) return res.status(400).json({ error: "No image file provided." });

  const ext = path.extname(file.originalFilename ?? file.filepath) || ".jpg";
  const filename = `${randomUUID()}${ext}`;

  // Try Vercel Blob first — persistent CDN storage, works on Hobby free tier
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`stylists/${filename}`, fs.readFileSync(file.filepath), {
        access: "public",
        contentType: file.mimetype ?? "image/jpeg",
        token: blobToken,
      });
      try { fs.unlinkSync(file.filepath); } catch {}
      return res.status(201).json({ url: blob.url });
    } catch (e) {
      console.error("Blob upload failed, falling back to filesystem:", e);
    }
  }

  // Local fallback: save to public/images (and /tmp on Vercel)
  const isVercel = Boolean(process.env.VERCEL);
  const publicDir = path.join(process.cwd(), "public", "images");
  const tmpDir = path.join("/tmp", "images");

  let destDir = publicDir;
  if (isVercel) {
    try { fs.mkdirSync(tmpDir, { recursive: true }); destDir = tmpDir; } catch { destDir = publicDir; }
  } else {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  try { fs.mkdirSync(destDir, { recursive: true }); } catch {}

  const destPath = path.join(destDir, filename);
  fs.copyFileSync(file.filepath, destPath);

  if (isVercel && destDir === tmpDir) {
    try { fs.mkdirSync(publicDir, { recursive: true }); fs.copyFileSync(file.filepath, path.join(publicDir, filename)); } catch {}
  }

  try { fs.unlinkSync(file.filepath); } catch {}

  // Note: on Vercel this is ephemeral — create a Blob store for persistence (see docs)
  return res.status(201).json({ url: `/images/${filename}` });
}
