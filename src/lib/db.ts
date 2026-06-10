import { createClient, type Client, type InArgs, type InStatement } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";
import type { Draw, LotteryId } from "./lotteries";
import type { DrawPrize } from "./caixa";

const DEFAULT_FILE = `file:${path.join(process.cwd(), "data", "loterias.db")}`;

/**
 * URL e token do banco. Em desenvolvimento, usa um arquivo SQLite local via
 * libSQL (`file:`); em produção, a Turso (`libsql://...` + token). Exportados
 * para que a config do Better Auth use exatamente a mesma conexão.
 */
export const dbUrl = process.env.TURSO_DATABASE_URL ?? DEFAULT_FILE;
export const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS draws (
     lottery TEXT NOT NULL,
     contest INTEGER NOT NULL,
     date    TEXT NOT NULL,
     numbers TEXT NOT NULL,
     PRIMARY KEY (lottery, contest)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_draws_lottery ON draws(lottery, contest DESC)`,
  `CREATE TABLE IF NOT EXISTS meta (
     key   TEXT PRIMARY KEY,
     value TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS draw_prizes (
     lottery  TEXT NOT NULL,
     contest  INTEGER NOT NULL,
     hits     INTEGER NOT NULL,
     label    TEXT NOT NULL,
     winners  INTEGER NOT NULL,
     amount   REAL NOT NULL,
     PRIMARY KEY (lottery, contest, hits)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_draw_prizes_lookup
     ON draw_prizes(lottery, contest, hits)`,
  `CREATE TABLE IF NOT EXISTS saved_games (
     id              TEXT PRIMARY KEY,
     user_id         TEXT NOT NULL,
     lottery         TEXT NOT NULL,
     numbers         TEXT NOT NULL,
     kind            TEXT NOT NULL,
     start_contest   INTEGER NOT NULL,
     end_contest     INTEGER NOT NULL,
     cost_per_draw   REAL NOT NULL,
     notes           TEXT,
     created_at      TEXT NOT NULL,
     FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
   )`,
  `CREATE INDEX IF NOT EXISTS idx_saved_games_user
     ON saved_games(user_id, lottery, end_contest DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_saved_games_range
     ON saved_games(lottery, start_contest, end_contest)`,
  `CREATE TABLE IF NOT EXISTS saved_game_results (
     game_id      TEXT NOT NULL,
     contest      INTEGER NOT NULL,
     hits         INTEGER NOT NULL,
     prize_amount REAL,
     evaluated_at TEXT NOT NULL,
     PRIMARY KEY (game_id, contest),
     FOREIGN KEY (game_id) REFERENCES saved_games(id) ON DELETE CASCADE
   )`,
  `CREATE TABLE IF NOT EXISTS subscriptions (
     user_id                  TEXT PRIMARY KEY,
     plan                     TEXT NOT NULL,
     status                   TEXT NOT NULL,
     provider_subscription_id TEXT,
     billing                  TEXT,
     current_period_end       TEXT,
     created_at               TEXT NOT NULL,
     updated_at               TEXT NOT NULL,
     FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
   )`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_provider
     ON subscriptions(provider_subscription_id)`,
  `CREATE TABLE IF NOT EXISTS usage_daily (
     user_id TEXT NOT NULL,
     day     TEXT NOT NULL,
     kind    TEXT NOT NULL,
     count   INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (user_id, day, kind),
     FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
   )`,
  // Armazenamento do rate limit do Better Auth (rateLimit.storage = "database").
  `CREATE TABLE IF NOT EXISTS rateLimit (
     id          TEXT PRIMARY KEY,
     key         TEXT NOT NULL UNIQUE,
     count       INTEGER NOT NULL,
     lastRequest INTEGER NOT NULL
   )`,
  // Rate limit das rotas próprias da aplicação (janela fixa por chave).
  `CREATE TABLE IF NOT EXISTS app_rate_limits (
     key          TEXT PRIMARY KEY,
     count        INTEGER NOT NULL,
     window_start INTEGER NOT NULL
   )`,
];

let _client: Client | null = null;
let _ready: Promise<void> | null = null;

function client(): Client {
  if (_client) return _client;
  // Em produção o fallback de arquivo local seria efêmero/read-only na
  // Vercel — melhor falhar alto do que "funcionar" perdendo dados.
  if (process.env.NODE_ENV === "production" && dbUrl.startsWith("file:")) {
    throw new Error(
      "TURSO_DATABASE_URL não configurado em produção — defina a URL e o token do banco"
    );
  }
  if (dbUrl.startsWith("file:")) {
    const dir = path.dirname(dbUrl.slice("file:".length));
    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  _client = createClient(
    dbAuthToken ? { url: dbUrl, authToken: dbAuthToken } : { url: dbUrl }
  );
  return _client;
}

/** Garante (uma única vez) que o schema da aplicação exista. */
async function ready(): Promise<void> {
  if (!_ready) {
    _ready = (async () => {
      const db = client();
      if (dbUrl.startsWith("file:")) {
        try {
          await db.execute("PRAGMA journal_mode = WAL");
        } catch {
          /* bancos remotos/in-memory ignoram pragmas */
        }
      }
      // Migração: renomeia a coluna do provedor antigo, se existir (era
      // específica do Mercado Pago, removido). Roda antes do schema para que o
      // índice novo encontre a coluna renomeada.
      try {
        await db.execute(
          "ALTER TABLE subscriptions RENAME COLUMN mp_preapproval_id TO provider_subscription_id"
        );
      } catch {
        /* coluna já renomeada ou tabela ainda não existe */
      }
      await db.batch(SCHEMA, "write");
    })();
  }
  await _ready;
}

/* ----------------------- Helpers de baixo nível ----------------------- */

/** Retorna todas as linhas de uma consulta. */
export async function all<T>(sql: string, args: InArgs = []): Promise<T[]> {
  await ready();
  const rs = await client().execute({ sql, args });
  return rs.rows as unknown as T[];
}

/** Retorna a primeira linha, ou null. */
export async function one<T>(sql: string, args: InArgs = []): Promise<T | null> {
  const rows = await all<T>(sql, args);
  return rows[0] ?? null;
}

/** Executa uma única instrução (INSERT/UPDATE/DELETE/etc.). */
export async function run(sql: string, args: InArgs = []) {
  await ready();
  return client().execute({ sql, args });
}

/**
 * Executa um lote de instruções de forma atômica, dividido em pedaços para
 * não estourar limites de payload da Turso em grandes seeds.
 */
export async function batch(stmts: InStatement[]): Promise<void> {
  if (stmts.length === 0) return;
  await ready();
  const db = client();
  const CHUNK = 256;
  for (let i = 0; i < stmts.length; i += CHUNK) {
    await db.batch(stmts.slice(i, i + CHUNK), "write");
  }
}

/* ----------------------------- Sorteios ----------------------------- */

export async function upsertDraws(draws: Draw[]): Promise<number> {
  if (draws.length === 0) return 0;
  await batch(
    draws.map((d) => ({
      sql: `INSERT INTO draws (lottery, contest, date, numbers)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(lottery, contest) DO UPDATE SET
              date = excluded.date, numbers = excluded.numbers`,
      args: [d.lottery, d.contest, d.date, JSON.stringify(d.numbers)],
    }))
  );
  return draws.length;
}

interface DrawRow {
  lottery: string;
  contest: number;
  date: string;
  numbers: string;
}

function rowToDraw(r: DrawRow): Draw {
  return {
    lottery: r.lottery as LotteryId,
    contest: r.contest,
    date: r.date,
    numbers: JSON.parse(r.numbers) as number[],
  };
}

/** Retorna concursos do mais recente para o mais antigo. */
export async function getDraws(
  lottery: LotteryId,
  limit?: number
): Promise<Draw[]> {
  const sql = `SELECT * FROM draws WHERE lottery = ? ORDER BY contest DESC${
    limit ? " LIMIT ?" : ""
  }`;
  const rows = await all<DrawRow>(sql, limit ? [lottery, limit] : [lottery]);
  return rows.map(rowToDraw);
}

export async function getLatestContest(lottery: LotteryId): Promise<number> {
  const row = await one<{ max: number | null }>(
    `SELECT MAX(contest) AS max FROM draws WHERE lottery = ?`,
    [lottery]
  );
  return row?.max ?? 0;
}

/** Concursos ausentes no intervalo [1, maxContest]. */
export async function getMissingContests(
  lottery: LotteryId,
  maxContest: number
): Promise<number[]> {
  const rows = await all<{ contest: number }>(
    `SELECT contest FROM draws WHERE lottery = ?`,
    [lottery]
  );
  const present = new Set(rows.map((r) => r.contest));
  const missing: number[] = [];
  for (let c = 1; c <= maxContest; c++) {
    if (!present.has(c)) missing.push(c);
  }
  return missing;
}

export async function countDraws(lottery: LotteryId): Promise<number> {
  const row = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM draws WHERE lottery = ?`,
    [lottery]
  );
  return row?.n ?? 0;
}

export async function getMeta(key: string): Promise<string | null> {
  const row = await one<{ value: string }>(
    `SELECT value FROM meta WHERE key = ?`,
    [key]
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await run(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

/* ---------------------------- Prêmios ---------------------------- */

export async function upsertDrawPrizes(prizes: DrawPrize[]): Promise<number> {
  if (prizes.length === 0) return 0;
  await batch(
    prizes.map((r) => ({
      sql: `INSERT INTO draw_prizes (lottery, contest, hits, label, winners, amount)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(lottery, contest, hits) DO UPDATE SET
              label   = excluded.label,
              winners = excluded.winners,
              amount  = excluded.amount`,
      args: [r.lottery, r.contest, r.hits, r.label, r.winners, r.amount],
    }))
  );
  return prizes.length;
}

export interface PrizeRow {
  lottery: LotteryId;
  contest: number;
  hits: number;
  label: string;
  winners: number;
  amount: number;
}

export async function getPrize(
  lottery: LotteryId,
  contest: number,
  hits: number
): Promise<PrizeRow | null> {
  const row = await one<PrizeRow>(
    `SELECT lottery, contest, hits, label, winners, amount
       FROM draw_prizes
      WHERE lottery = ? AND contest = ? AND hits = ?`,
    [lottery, contest, hits]
  );
  return row ? { ...row, lottery: row.lottery as LotteryId } : null;
}
