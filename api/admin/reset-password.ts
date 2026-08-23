import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, getConfig, setConfig, hashPassword } from "../_lib/db.js";
import { ok, badRequest, forbidden } from "../_lib/response.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema();

  if (req.method !== "POST")
    return badRequest(res, "Method not allowed.");

  const { recoveryKey, newPassword } = req.body ?? {};
  if (!recoveryKey || !newPassword)
    return badRequest(res, "recoveryKey and newPassword are required.");
  if (newPassword.length < 4)
    return badRequest(res, "New password must be at least 4 characters.");

  const storedKey = await getConfig("recovery_key");
  if (!storedKey || recoveryKey !== storedKey)
    return forbidden(res, "Invalid recovery key.");

  await setConfig("password_hash", hashPassword(newPassword));
  return ok(res, { ok: true });
}
