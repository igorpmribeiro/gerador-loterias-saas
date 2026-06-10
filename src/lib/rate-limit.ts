import type { NextRequest } from "next/server";
import { one } from "./db";

/**
 * Rate limit de janela fixa, persistido no banco (efetivo entre instâncias
 * serverless). Uma única query (UPSERT + RETURNING) por verificação.
 */
export interface RateLimitRule {
  /** Janela em segundos. */
  window: number;
  /** Máximo de requisições por janela. */
  max: number;
}

export async function checkRateLimit(
  key: string,
  rule: RateLimitRule
): Promise<boolean> {
  const now = Date.now();
  const windowMs = rule.window * 1000;
  const row = await one<{ count: number }>(
    `INSERT INTO app_rate_limits (key, count, window_start)
     VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET
       count        = CASE WHEN window_start <= ? THEN 1 ELSE count + 1 END,
       window_start = CASE WHEN window_start <= ? THEN ? ELSE window_start END
     RETURNING count`,
    [key, now, now - windowMs, now - windowMs, now]
  );
  return (row?.count ?? 1) <= rule.max;
}

/** IP do cliente atrás do proxy da Vercel (fallback para anônimo). */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
