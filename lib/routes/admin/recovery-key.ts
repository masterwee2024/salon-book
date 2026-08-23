import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getConfig } from "../../db.js";
import { verifyToken } from "../../auth.js";

export async function handleAdminRecoveryKey(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token)))
    return res.status(401).json({ error: "Admin authentication required." });

  const key = await getConfig("recovery_key");
  return res.status(200).json({ recoveryKey: key });
}
