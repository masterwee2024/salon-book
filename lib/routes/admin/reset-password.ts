import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getConfig, setConfig, hashPassword } from "../../db.js";

export async function handleAdminResetPassword(req: VercelRequest, res: VercelResponse) {
  const { recoveryKey, newPassword } = req.body ?? {};
  if (!recoveryKey || !newPassword)
    return res.status(400).json({ error: "recoveryKey and newPassword are required." });
  if (newPassword.length < 4)
    return res.status(400).json({ error: "New password must be at least 4 characters." });

  const storedKey = await getConfig("recovery_key");
  if (!storedKey || recoveryKey !== storedKey)
    return res.status(403).json({ error: "Invalid recovery key." });

  await setConfig("password_hash", hashPassword(newPassword));
  return res.status(200).json({ ok: true });
}
