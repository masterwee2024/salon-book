import type { VercelResponse } from "@vercel/node";

export function json(res: VercelResponse, status: number, body: unknown) {
  return res.status(status).json(body);
}

export function ok(res: VercelResponse, body: unknown) {
  return json(res, 200, body);
}

export function created(res: VercelResponse, body: unknown) {
  return json(res, 201, body);
}

export function badRequest(res: VercelResponse, error: string) {
  return json(res, 400, { error });
}

export function unauthorized(res: VercelResponse, error = "Admin authentication required.") {
  return json(res, 401, { error });
}

export function forbidden(res: VercelResponse, error: string) {
  return json(res, 403, { error });
}

export function notFound(res: VercelResponse, error = "Not found.") {
  return json(res, 404, { error });
}

export function conflict(res: VercelResponse, error: string) {
  return json(res, 409, { error });
}
