import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, getConfig } from "../_lib/db.js";
import { verifyToken } from "../_lib/auth.js";
import { ok, unauthorized } from "../_lib/response.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema();

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token)))
    return unauthorized(res);

  const key = await getConfig("recovery_key");
  return ok(res, { recoveryKey: key });
}
