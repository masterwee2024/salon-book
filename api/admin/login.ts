import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, getConfig, hashPassword } from "../_lib/db.js";
import { signToken } from "../_lib/auth.js";
import { ok, badRequest, forbidden } from "../_lib/response.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema();

  if (req.method !== "POST")
    return badRequest(res, "Method not allowed.");

  const { password } = req.body ?? {};
  const storedHash = await getConfig("password_hash");

  if (!storedHash || hashPassword(password ?? "") !== storedHash)
    return forbidden(res, "Invalid password.");

  const token = await signToken({ role: "admin" });
  return ok(res, { token });
}
