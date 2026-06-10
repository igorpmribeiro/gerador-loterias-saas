import { one, run } from "./db";

/** Tipos de uso medidos por dia (para limites do plano grátis). */
export type UsageKind = "generation";

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export async function getDailyUsage(
  userId: string,
  kind: UsageKind
): Promise<number> {
  const row = await one<{ count: number }>(
    `SELECT count FROM usage_daily WHERE user_id = ? AND day = ? AND kind = ?`,
    [userId, today(), kind]
  );
  return row?.count ?? 0;
}

/** Incrementa o contador do dia e retorna o novo total. */
export async function incrementDailyUsage(
  userId: string,
  kind: UsageKind,
  by = 1
): Promise<number> {
  await run(
    `INSERT INTO usage_daily (user_id, day, kind, count)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, day, kind) DO UPDATE SET
       count = count + excluded.count`,
    [userId, today(), kind, by]
  );
  return getDailyUsage(userId, kind);
}
