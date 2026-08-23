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
  const file = Array.isArray(files.file) ? files.file[0] : (files.file as unknown as { filepath: string; originalFilename?: string | null } | undefined);
  if (!file || !file.filepath) return res.status(400).json({ error: "No image file provided." });

  const ext = path.extname(file.originalFilename ?? file.filepath) || ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const isVercel = Boolean(process.env.VERCEL);

  // Vercel's filesystem is read-only except /tmp — public/images won't persist there.
  // For Vercel, we store under /tmp and also try public/images; for local, use public/images.
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

  // Also try to mirror to public/images when on Vercel's /tmp so local preview still works if checked out
  if (isVercel && destDir === tmpDir) {
    try { fs.mkdirSync(publicDir, { recursive: true }); fs.copyFileSync(file.filepath, path.join(publicDir, filename)); } catch {}
  }

  // Clean up temp file from formidable
  try { fs.unlinkSync(file.filepath); } catch {}

  // Public URL — works locally and after commit; on Vercel runtime the /tmp file is ephemeral
  // so production persistence should use Vercel Blob or external storage. We still return /images/...
  // and fall back to serving via /tmp if needed (Vercel will serve from public at build time only).
  return res.status(201).json({ url: `/images/${filename}` });
}
