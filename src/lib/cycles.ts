import type { Draw, LotteryConfig } from "./lotteries";

/**
 * Um ciclo é o período (em concursos) decorrido até que TODAS as dezenas
 * do volante tenham sido sorteadas pelo menos uma vez. Quando o ciclo
 * fecha, inicia-se um novo. É uma análise especialmente útil na Lotofácil,
 * que tem poucas dezenas (25): no ciclo aberto, as dezenas que ainda não
 * saíram são fortes candidatas a fechá-lo.
 */

export interface Cycle {
  index: number;
  startContest: number;
  endContest: number;
  /** Quantidade de concursos que o ciclo levou para fechar. */
  contests: number;
}

export interface CurrentCycle {
  index: number;
  startContest: number;
  /** Concursos decorridos no ciclo aberto. */
  contests: number;
  /** Dezenas que já saíram no ciclo atual. */
  drawn: number[];
  /** Dezenas que ainda NÃO saíram no ciclo atual. */
  missing: number[];
}

export interface CycleSummary {
  universe: number;
  closedCount: number;
  current: CurrentCycle;
  /** Últimos ciclos fechados (mais recente primeiro). */
  recent: Cycle[];
  stats: { avg: number; min: number; max: number };
}

export interface CycleComputation {
  summary: CycleSummary;
  /** Anotação por concurso: índice do ciclo e dezenas faltantes após o sorteio. */
  perContest: Map<number, { cycle: number; missingAfter: number }>;
}

export function computeCycles(
  draws: Draw[],
  cfg: LotteryConfig
): CycleComputation {
  const universe = cfg.max - cfg.min + 1;
  const ordered = [...draws].sort((a, b) => a.contest - b.contest);

  const closed: Cycle[] = [];
  const perContest = new Map<number, { cycle: number; missingAfter: number }>();

  let seen = new Set<number>();
  let cycleIndex = 1;
  let startContest: number | null = null;
  let drawsInCycle = 0;

  for (const d of ordered) {
    if (startContest === null) startContest = d.contest;
    drawsInCycle++;
    for (const n of d.numbers) seen.add(n);

    perContest.set(d.contest, {
      cycle: cycleIndex,
      missingAfter: universe - seen.size,
    });

    if (seen.size >= universe) {
      closed.push({
        index: cycleIndex,
        startContest,
        endContest: d.contest,
        contests: drawsInCycle,
      });
      cycleIndex++;
      seen = new Set();
      startContest = null;
      drawsInCycle = 0;
    }
  }

  const lastContest = ordered[ordered.length - 1]?.contest ?? 0;
  const drawn = [...seen].sort((a, b) => a - b);
  const missing: number[] = [];
  for (let n = cfg.min; n <= cfg.max; n++) {
    if (!seen.has(n)) missing.push(n);
  }

  const lengths = closed.map((c) => c.contests);
  const stats = {
    avg: lengths.length
      ? lengths.reduce((a, b) => a + b, 0) / lengths.length
      : 0,
    min: lengths.length ? Math.min(...lengths) : 0,
    max: lengths.length ? Math.max(...lengths) : 0,
  };

  return {
    summary: {
      universe,
      closedCount: closed.length,
      current: {
        index: cycleIndex,
        startContest: startContest ?? lastContest + 1,
        contests: drawsInCycle,
        drawn,
        missing,
      },
      recent: [...closed].reverse().slice(0, 12),
      stats,
    },
    perContest,
  };
}
