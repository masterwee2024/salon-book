import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, getConfig, setConfig, hashPassword } from "../_lib/db.js";
import { verifyToken } from "../_lib/auth.js";
import { ok, badRequest, unauthorized, forbidden } from "../_lib/response.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema();

  if (req.method !== "POST")
    return badRequest(res, "Method not allowed.");

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token)))
    return unauthorized(res);

  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword)
    return badRequest(res, "currentPassword and newPassword are required.");
  if (newPassword.length < 4)
    return badRequest(res, "New password must be at least 4 characters.");

  const storedHash = await getConfig("password_hash");
  if (!storedHash || hashPassword(currentPassword) !== storedHash)
    return forbidden(res, "Current password is incorrect.");

  await setConfig("password_hash", hashPassword(newPassword));
  return ok(res, { ok: true });
}
