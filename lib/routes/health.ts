import type { VercelRequest, VercelResponse } from "@vercel/node";

export function handleHealth(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true });
}
