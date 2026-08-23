import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getConfig, hashPassword } from "../../_lib/db.js";
import { signToken } from "../../_lib/auth.js";

export async function handleAdminLogin(req: VercelRequest, res: VercelResponse) {
  const { password } = req.body ?? {};
  const storedHash = await getConfig("password_hash");

  if (!storedHash || hashPassword(password ?? "") !== storedHash)
    return res.status(403).json({ error: "Invalid password." });

  const token = await signToken({ role: "admin" });
  return res.status(200).json({ token });
}
