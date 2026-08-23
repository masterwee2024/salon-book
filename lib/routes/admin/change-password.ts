import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getConfig, setConfig, hashPassword } from "../../db.js";
import { verifyToken } from "../../auth.js";

export async function handleAdminChangePassword(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token)))
    return res.status(401).json({ error: "Admin authentication required." });

  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: "currentPassword and newPassword are required." });
  if (newPassword.length < 4)
    return res.status(400).json({ error: "New password must be at least 4 characters." });

  const storedHash = await getConfig("password_hash");
  if (!storedHash || hashPassword(currentPassword) !== storedHash)
    return res.status(403).json({ error: "Current password is incorrect." });

  await setConfig("password_hash", hashPassword(newPassword));
  return res.status(200).json({ ok: true });
}
