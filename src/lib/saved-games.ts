import { randomBytes } from "node:crypto";
import type { InStatement } from "@libsql/client";
import { all, one, run, batch, getPrize } from "./db";
import { getLottery, type LotteryId } from "./lotteries";

export type SavedGameKind = "single" | "teimosinha";

export interface SavedGame {
  id: string;
  userId: string;
  lottery: LotteryId;
  numbers: number[];
  kind: SavedGameKind;
  startContest: number;
  endContest: number;
  costPerDraw: number;
  notes: string | null;
  createdAt: string;
}

export interface SavedGameResult {
  contest: number;
  hits: number;
  prizeAmount: number | null;
}

export interface SavedGameDetail extends SavedGame {
  results: SavedGameResult[];
  /** Custo total = costPerDraw × (end-start+1). */
  totalCost: number;
  /** Soma de prêmios dos resultados já avaliados. */
  totalWon: number;
  /** Quantos concursos da janela ainda não ocorreram. */
  pending: number;
  /** Melhor resultado registrado (mais acertos). null se sem resultados. */
  best: { contest: number; hits: number } | null;
}

interface SavedGameRow {
  id: string;
  user_id: string;
  lottery: string;
  numbers: string;
  kind: string;
  start_contest: number;
  end_contest: number;
  cost_per_draw: number;
  notes: string | null;
  created_at: string;
}

interface SavedGameResultRow {
  game_id: string;
  contest: number;
  hits: number;
  prize_amount: number | null;
}

function rowToGame(r: SavedGameRow): SavedGame {
  return {
    id: r.id,
    userId: r.user_id,
    lottery: r.lottery as LotteryId,
    numbers: JSON.parse(r.numbers) as number[],
    kind: r.kind as SavedGameKind,
    startContest: r.start_contest,
    endContest: r.end_contest,
    costPerDraw: r.cost_per_draw,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export interface SaveGameInput {
  lottery: LotteryId;
  numbers: number[];
  kind: SavedGameKind;
  startContest: number;
  endContest: number;
  costPerDraw: number;
  notes?: string | null;
}

export async function saveGame(
  userId: string,
  input: SaveGameInput
): Promise<SavedGame> {
  const cfg = getLottery(input.lottery);
  const uniq = [...new Set(input.numbers)].sort((a, b) => a - b);

  if (uniq.length !== input.numbers.length) {
    throw new Error("há dezenas repetidas no jogo");
  }
  if (uniq.some((n) => n < cfg.min || n > cfg.max)) {
    throw new Error(`as dezenas devem estar entre ${cfg.min} e ${cfg.max}`);
  }
  if (uniq.length < cfg.pickMin || uniq.length > cfg.pickMax) {
    throw new Error(
      `quantidade de dezenas deve estar entre ${cfg.pickMin} e ${cfg.pickMax}`
    );
  }
  if (input.startContest < 1 || input.endContest < input.startContest) {
    throw new Error("faixa de concursos inválida");
  }
  if (input.kind === "single" && input.startContest !== input.endContest) {
    throw new Error("jogo único deve apontar para um único concurso");
  }
  if (input.endContest - input.startContest + 1 > 50) {
    throw new Error("teimosinha limitada a 50 concursos");
  }
  if (!Number.isFinite(input.costPerDraw) || input.costPerDraw < 0) {
    throw new Error("custo por aposta inválido");
  }

  const id = randomBytes(12).toString("base64url");
  const createdAt = new Date().toISOString();

  await run(
    `INSERT INTO saved_games
       (id, user_id, lottery, numbers, kind, start_contest, end_contest,
        cost_per_draw, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      input.lottery,
      JSON.stringify(uniq),
      input.kind,
      input.startContest,
      input.endContest,
      input.costPerDraw,
      input.notes ?? null,
      createdAt,
    ]
  );

  // Avalia imediatamente os concursos da janela que já existem.
  await evaluateSavedGame(id);

  return {
    id,
    userId,
    lottery: input.lottery,
    numbers: uniq,
    kind: input.kind,
    startContest: input.startContest,
    endContest: input.endContest,
    costPerDraw: input.costPerDraw,
    notes: input.notes ?? null,
    createdAt,
  };
}

export async function countSavedGames(userId: string): Promise<number> {
  const row = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM saved_games WHERE user_id = ?`,
    [userId]
  );
  return row?.n ?? 0;
}

export async function getSavedGame(id: string): Promise<SavedGame | null> {
  const row = await one<SavedGameRow>(
    `SELECT * FROM saved_games WHERE id = ?`,
    [id]
  );
  return row ? rowToGame(row) : null;
}

export async function deleteSavedGame(
  id: string,
  userId: string
): Promise<boolean> {
  const res = await run(
    `DELETE FROM saved_games WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return res.rowsAffected > 0;
}

export interface ListSavedGamesFilter {
  lottery?: LotteryId;
  kind?: SavedGameKind;
  /** Considera apenas jogos criados a partir desta data (ISO). */
  createdFrom?: string;
}

export async function listSavedGames(
  userId: string,
  filter: ListSavedGamesFilter = {}
): Promise<SavedGameDetail[]> {
  const conds = ["user_id = ?"];
  const args: (string | number)[] = [userId];
  if (filter.lottery) {
    conds.push("lottery = ?");
    args.push(filter.lottery);
  }
  if (filter.kind) {
    conds.push("kind = ?");
    args.push(filter.kind);
  }
  if (filter.createdFrom) {
    conds.push("created_at >= ?");
    args.push(filter.createdFrom);
  }
  const rows = await all<SavedGameRow>(
    `SELECT * FROM saved_games WHERE ${conds.join(" AND ")}
      ORDER BY end_contest DESC, created_at DESC`,
    args
  );

  return Promise.all(rows.map((row) => enrichWithResults(rowToGame(row))));
}

export async function getSavedGameDetail(
  id: string,
  userId: string
): Promise<SavedGameDetail | null> {
  const row = await one<SavedGameRow>(
    `SELECT * FROM saved_games WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  if (!row) return null;
  return enrichWithResults(rowToGame(row));
}

async function enrichWithResults(game: SavedGame): Promise<SavedGameDetail> {
  const results = await all<SavedGameResultRow>(
    `SELECT contest, hits, prize_amount FROM saved_game_results
      WHERE game_id = ? ORDER BY contest`,
    [game.id]
  );

  const detail: SavedGameResult[] = results.map((r) => ({
    contest: r.contest,
    hits: r.hits,
    prizeAmount: r.prize_amount,
  }));

  const windowSize = game.endContest - game.startContest + 1;
  const totalCost = game.costPerDraw * windowSize;
  const totalWon = detail.reduce((acc, r) => acc + (r.prizeAmount ?? 0), 0);
  const pending = windowSize - detail.length;
  const best = detail.length
    ? detail.reduce(
        (acc, r) =>
          acc && r.hits <= acc.hits ? acc : { contest: r.contest, hits: r.hits },
        null as { contest: number; hits: number } | null
      )
    : null;

  return { ...game, results: detail, totalCost, totalWon, pending, best };
}

/**
 * Avalia (ou re-avalia) o jogo contra todos os concursos da sua janela
 * que já estejam armazenados em `draws`. Resultado vai para
 * `saved_game_results` via UPSERT. Indempotente.
 */
export async function evaluateSavedGame(gameId: string): Promise<number> {
  const game = await getSavedGame(gameId);
  if (!game) return 0;

  const cfg = getLottery(game.lottery);
  const set = new Set(game.numbers);
  const minTier = Math.min(...cfg.prizeTiers.map((t) => t.hits));

  const rows = await all<{ contest: number; numbers: string }>(
    `SELECT contest, numbers FROM draws
      WHERE lottery = ? AND contest BETWEEN ? AND ?`,
    [game.lottery, game.startContest, game.endContest]
  );

  const now = new Date().toISOString();
  const stmts: InStatement[] = [];
  for (const r of rows) {
    const nums = JSON.parse(r.numbers) as number[];
    const hits = nums.filter((n) => set.has(n)).length;
    const prize =
      hits >= minTier
        ? (await getPrize(game.lottery, r.contest, hits))?.amount ?? null
        : null;
    stmts.push({
      sql: `INSERT INTO saved_game_results
              (game_id, contest, hits, prize_amount, evaluated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(game_id, contest) DO UPDATE SET
              hits         = excluded.hits,
              prize_amount = excluded.prize_amount,
              evaluated_at = excluded.evaluated_at`,
      args: [gameId, r.contest, hits, prize, now],
    });
  }

  await batch(stmts);
  return stmts.length;
}

/**
 * Reavalia jogos salvos (de qualquer usuário) na loteria dada cujo intervalo
 * ainda toca a janela atual de concursos. Chamado pelo seeder após sync.
 */
export async function evaluateAllPending(lottery: LotteryId): Promise<number> {
  const games = await all<{ id: string }>(
    `SELECT id FROM saved_games
      WHERE lottery = ?
        AND end_contest >= (SELECT COALESCE(MIN(contest), 0) FROM draws WHERE lottery = ?)`,
    [lottery, lottery]
  );

  let touched = 0;
  for (const g of games) touched += await evaluateSavedGame(g.id);
  return touched;
}
