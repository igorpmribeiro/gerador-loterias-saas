import type { Draw, LotteryConfig } from "./lotteries";
import { countConsecutive, countEven, countPrimes } from "./analysis";
import { computeCycles, type CycleSummary } from "./cycles";

export interface DrawRow {
  contest: number;
  date: string;
  numbers: number[];
  sum: number;
  even: number;
  odd: number;
  primes: number;
  /** Maior sequência de dezenas consecutivas. */
  maxRun: number;
  /** Pares de dezenas consecutivas. */
  consecutivePairs: number;
  /** Dezenas repetidas do concurso anterior. */
  repeatsFromPrev: number | null;
  /** Amplitude = maior dezena − menor dezena. */
  amplitude: number;
  /** Dezenas na moldura do volante (apenas Lotofácil). */
  frame: number | null;
  /** Dezenas no miolo do volante (apenas Lotofácil). */
  center: number | null;
  /** Índice do ciclo a que o concurso pertence (apenas Lotofácil). */
  cycle: number | null;
  /** Dezenas que ainda faltavam fechar o ciclo após este concurso. */
  cycleMissingAfter: number | null;
}

export interface DrawTable {
  lottery: string;
  rows: DrawRow[];
  cycle: CycleSummary | null;
}

/** Maior sequência de inteiros consecutivos no conjunto. */
export function maxConsecutiveRun(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  if (s.length === 0) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < s.length; i++) {
    if (s[i] === s[i - 1] + 1) {
      cur++;
      best = Math.max(best, cur);
    } else {
      cur = 1;
    }
  }
  return best;
}

/** Verifica se a dezena fica na moldura (borda) do volante. */
export function isFrameNumber(n: number, cfg: LotteryConfig): boolean {
  const i = n - cfg.min;
  const row = Math.floor(i / cfg.grid.cols);
  const col = i % cfg.grid.cols;
  return (
    row === 0 ||
    row === cfg.grid.rows - 1 ||
    col === 0 ||
    col === cfg.grid.cols - 1
  );
}

/**
 * Constrói a tabela analítica de concursos. A moldura/miolo e o ciclo
 * só fazem sentido na Lotofácil (volante 5×5), então só são calculados lá.
 */
export function buildDrawTable(
  allDraws: Draw[],
  cfg: LotteryConfig
): DrawTable {
  const ordered = [...allDraws].sort((a, b) => a.contest - b.contest);
  const isLotofacil = cfg.id === "lotofacil";

  const cycleData = isLotofacil ? computeCycles(ordered, cfg) : null;

  const rows: DrawRow[] = ordered.map((draw, idx) => {
    const nums = [...draw.numbers].sort((a, b) => a - b);
    const even = countEven(nums);
    const prev = idx > 0 ? new Set(ordered[idx - 1].numbers) : null;
    const cycleInfo = cycleData?.perContest.get(draw.contest) ?? null;

    return {
      contest: draw.contest,
      date: draw.date,
      numbers: nums,
      sum: nums.reduce((a, b) => a + b, 0),
      even,
      odd: nums.length - even,
      primes: countPrimes(nums),
      maxRun: maxConsecutiveRun(nums),
      consecutivePairs: countConsecutive(nums),
      repeatsFromPrev: prev
        ? nums.filter((n) => prev.has(n)).length
        : null,
      amplitude: nums[nums.length - 1] - nums[0],
      frame: isLotofacil
        ? nums.filter((n) => isFrameNumber(n, cfg)).length
        : null,
      center: isLotofacil
        ? nums.filter((n) => !isFrameNumber(n, cfg)).length
        : null,
      cycle: cycleInfo?.cycle ?? null,
      cycleMissingAfter: cycleInfo?.missingAfter ?? null,
    };
  });

  rows.reverse(); // mais recente primeiro

  return {
    lottery: cfg.id,
    rows,
    cycle: cycleData?.summary ?? null,
  };
}
