import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ok } from "./_lib/response.js";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return ok(res, { ok: true });
}
