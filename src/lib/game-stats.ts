import { all } from "./db";
import { LOTTERIES, type LotteryId } from "./lotteries";

export interface TierBreakdown {
  lottery: LotteryId;
  hits: number;
  label: string;
  count: number;
  totalPrize: number;
}

export interface DailyPoint {
  date: string;
  spent: number;
  won: number;
}

export interface GameStats {
  windowDays: number;
  totalSpent: number;
  totalWon: number;
  balance: number;
  /** Retorno sobre investimento (em %). 0 se totalSpent for 0. */
  roi: number;
  /** Total de jogos considerados na janela. */
  gamesCount: number;
  /** Concursos com pelo menos 1 acerto registrado. */
  drawsEvaluated: number;
  byTier: TierBreakdown[];
  byDay: DailyPoint[];
}

/**
 * Calcula estatísticas para Meus Jogos.
 * Considera jogos cujos resultados foram avaliados (saved_game_results)
 * em qualquer concurso desde `windowDays` atrás (baseado em `evaluated_at`).
 * Custo é proporcional aos concursos avaliados, não à janela inteira.
 */
export async function computeUserStats(
  userId: string,
  windowDays: number
): Promise<GameStats> {
  const since = new Date();
  since.setDate(since.getDate() - windowDays);
  const sinceIso = since.toISOString();

  // Resultados avaliados na janela + custo proporcional.
  const rows = await all<{
    game_id: string;
    lottery: LotteryId;
    cost_per_draw: number;
    contest: number;
    hits: number;
    prize_amount: number | null;
    evaluated_at: string;
    draw_date: string | null;
  }>(
    `SELECT
         g.id AS game_id,
         g.lottery AS lottery,
         g.cost_per_draw AS cost_per_draw,
         r.contest AS contest,
         r.hits AS hits,
         r.prize_amount AS prize_amount,
         r.evaluated_at AS evaluated_at,
         d.date AS draw_date
       FROM saved_game_results r
       JOIN saved_games g ON g.id = r.game_id
       LEFT JOIN draws d ON d.lottery = g.lottery AND d.contest = r.contest
       WHERE g.user_id = ? AND r.evaluated_at >= ?`,
    [userId, sinceIso]
  );

  let totalSpent = 0;
  let totalWon = 0;
  const tierMap = new Map<string, TierBreakdown>();
  const dayMap = new Map<string, DailyPoint>();
  const games = new Set<string>();
  let drawsEvaluated = 0;

  for (const row of rows) {
    drawsEvaluated++;
    games.add(row.game_id);
    totalSpent += row.cost_per_draw;

    const prize = row.prize_amount ?? 0;
    totalWon += prize;

    const cfg = LOTTERIES[row.lottery];
    const tierCfg = cfg.prizeTiers.find((t) => t.hits === row.hits);
    if (tierCfg) {
      const key = `${row.lottery}-${row.hits}`;
      const cur = tierMap.get(key) ?? {
        lottery: row.lottery,
        hits: row.hits,
        label: tierCfg.label,
        count: 0,
        totalPrize: 0,
      };
      cur.count += 1;
      cur.totalPrize += prize;
      tierMap.set(key, cur);
    }

    const day = row.draw_date ?? row.evaluated_at.slice(0, 10);
    const point = dayMap.get(day) ?? { date: day, spent: 0, won: 0 };
    point.spent += row.cost_per_draw;
    point.won += prize;
    dayMap.set(day, point);
  }

  const byTier = [...tierMap.values()].sort(
    (a, b) => b.hits - a.hits || a.lottery.localeCompare(b.lottery)
  );
  const byDay = [...dayMap.values()].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return {
    windowDays,
    totalSpent,
    totalWon,
    balance: totalWon - totalSpent,
    roi: totalSpent > 0 ? ((totalWon - totalSpent) / totalSpent) * 100 : 0,
    gamesCount: games.size,
    drawsEvaluated,
    byTier,
    byDay,
  };
}
