import type { Draw, LotteryConfig } from "./lotteries";

/* ----------------------------- Tipos ----------------------------- */

export interface NumberStat {
  number: number;
  /** Vezes que o número foi sorteado no período analisado. */
  count: number;
  /** Percentual de concursos em que apareceu. */
  percentage: number;
  /** Concursos decorridos desde a última aparição. */
  currentGap: number;
  /** Maior atraso já registrado. */
  maxGap: number;
  /** Atraso médio entre aparições. */
  avgGap: number;
  /** Último concurso em que saiu. */
  lastContest: number | null;
}

export interface DistributionBucket {
  label: string;
  /** Valor numérico representado (ex.: qtd de pares, soma). */
  value: number;
  count: number;
  percentage: number;
}

export interface PairStat {
  a: number;
  b: number;
  count: number;
  percentage: number;
}

export interface AnalysisResult {
  lottery: string;
  totalDraws: number;
  range: { firstContest: number; lastContest: number };
  numbers: NumberStat[];
  hot: NumberStat[];
  cold: NumberStat[];
  overdue: NumberStat[];
  sum: {
    min: number;
    max: number;
    avg: number;
    stdev: number;
    idealRange: [number, number];
    distribution: DistributionBucket[];
  };
  parity: {
    distribution: DistributionBucket[];
    mostCommon: string;
  };
  primes: { distribution: DistributionBucket[]; avg: number };
  consecutive: { distribution: DistributionBucket[]; avg: number };
  repeats: { distribution: DistributionBucket[]; avg: number };
  endings: DistributionBucket[];
  ranges: DistributionBucket[];
  zones: {
    rows: DistributionBucket[];
    cols: DistributionBucket[];
  };
  pairs: PairStat[];
}

/* --------------------------- Utilidades --------------------------- */

const PRIMES = new Set([
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59,
]);

export function isPrime(n: number): boolean {
  return PRIMES.has(n);
}

export function countConsecutive(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  let runs = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) runs++;
  }
  return runs;
}

export function countEven(nums: number[]): number {
  return nums.filter((n) => n % 2 === 0).length;
}

export function countPrimes(nums: number[]): number {
  return nums.filter((n) => isPrime(n)).length;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdev(xs: number[]): number {
  if (xs.length === 0) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function toBuckets(
  counts: Map<number, number>,
  total: number,
  label: (v: number) => string
): DistributionBucket[] {
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([value, count]) => ({
      label: label(value),
      value,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
}

/* --------------------------- Análise --------------------------- */

/**
 * Recebe concursos em qualquer ordem e produz a análise estatística
 * completa. Internamente ordena do mais antigo para o mais recente.
 */
export function analyze(
  draws: Draw[],
  cfg: LotteryConfig
): AnalysisResult {
  const ordered = [...draws].sort((a, b) => a.contest - b.contest);
  const total = ordered.length;
  const { min, max } = cfg;

  /* --- Frequência e atrasos por número --- */
  const appearances = new Map<number, number[]>(); // num -> índices em que saiu
  for (let n = min; n <= max; n++) appearances.set(n, []);

  ordered.forEach((draw, idx) => {
    for (const n of draw.numbers) appearances.get(n)?.push(idx);
  });

  const numbers: NumberStat[] = [];
  for (let n = min; n <= max; n++) {
    const idxs = appearances.get(n)!;
    const count = idxs.length;

    // gaps entre aparições consecutivas + gap inicial + gap atual
    const gaps: number[] = [];
    let prev = -1;
    for (const i of idxs) {
      gaps.push(i - prev);
      prev = i;
    }
    const currentGap = total > 0 ? total - 1 - prev : 0;
    const maxGap = gaps.length ? Math.max(...gaps, currentGap) : currentGap;
    const avgGap = gaps.length ? mean(gaps) : total;

    numbers.push({
      number: n,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      currentGap,
      maxGap,
      avgGap,
      lastContest:
        idxs.length > 0 ? ordered[idxs[idxs.length - 1]].contest : null,
    });
  }

  const byCount = [...numbers].sort(
    (a, b) => b.count - a.count || a.number - b.number
  );
  const hot = byCount.slice(0, 10);
  const cold = [...byCount].reverse().slice(0, 10);
  const overdue = [...numbers]
    .sort((a, b) => b.currentGap - a.currentGap || a.number - b.number)
    .slice(0, 10);

  /* --- Distribuições por concurso --- */
  const sums: number[] = [];
  const sumCounts = new Map<number, number>();
  const parityCounts = new Map<number, number>();
  const primeCounts = new Map<number, number>();
  const consecCounts = new Map<number, number>();
  const repeatCounts = new Map<number, number>();
  const endingCounts = new Map<number, number>();
  const rangeCounts = new Map<number, number>();
  const rowCounts = new Map<number, number>();
  const colCounts = new Map<number, number>();
  const pairCounts = new Map<string, number>();

  const SUM_BUCKET = cfg.drawSize >= 10 ? 10 : 20;

  ordered.forEach((draw, idx) => {
    const nums = draw.numbers;
    const s = nums.reduce((a, b) => a + b, 0);
    sums.push(s);
    const sb = Math.floor(s / SUM_BUCKET) * SUM_BUCKET;
    sumCounts.set(sb, (sumCounts.get(sb) ?? 0) + 1);

    const even = countEven(nums);
    parityCounts.set(even, (parityCounts.get(even) ?? 0) + 1);

    const primes = countPrimes(nums);
    primeCounts.set(primes, (primeCounts.get(primes) ?? 0) + 1);

    const consec = countConsecutive(nums);
    consecCounts.set(consec, (consecCounts.get(consec) ?? 0) + 1);

    if (idx > 0) {
      const prevSet = new Set(ordered[idx - 1].numbers);
      const rep = nums.filter((n) => prevSet.has(n)).length;
      repeatCounts.set(rep, (repeatCounts.get(rep) ?? 0) + 1);
    }

    for (const n of nums) {
      const ending = n % 10;
      endingCounts.set(ending, (endingCounts.get(ending) ?? 0) + 1);

      const decade = Math.floor((n - 1) / 10);
      rangeCounts.set(decade, (rangeCounts.get(decade) ?? 0) + 1);

      const row = Math.floor((n - 1) / cfg.grid.cols);
      const col = (n - 1) % cfg.grid.cols;
      rowCounts.set(row, (rowCounts.get(row) ?? 0) + 1);
      colCounts.set(col, (colCounts.get(col) ?? 0) + 1);
    }

    const sortedNums = [...nums].sort((a, b) => a - b);
    for (let i = 0; i < sortedNums.length; i++) {
      for (let j = i + 1; j < sortedNums.length; j++) {
        const key = `${sortedNums[i]}-${sortedNums[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  });

  const repTotal = Math.max(1, total - 1);

  const sumAvg = mean(sums);
  const sumStdev = stdev(sums);

  const pairs: PairStat[] = [...pairCounts.entries()]
    .map(([key, count]) => {
      const [a, b] = key.split("-").map(Number);
      return { a, b, count, percentage: (count / total) * 100 };
    })
    .sort((x, y) => y.count - x.count)
    .slice(0, 15);

  return {
    lottery: cfg.id,
    totalDraws: total,
    range: {
      firstContest: ordered[0]?.contest ?? 0,
      lastContest: ordered[total - 1]?.contest ?? 0,
    },
    numbers,
    hot,
    cold,
    overdue,
    sum: {
      min: sums.length ? Math.min(...sums) : 0,
      max: sums.length ? Math.max(...sums) : 0,
      avg: sumAvg,
      stdev: sumStdev,
      idealRange: [
        Math.round(sumAvg - sumStdev),
        Math.round(sumAvg + sumStdev),
      ],
      distribution: toBuckets(
        sumCounts,
        total,
        (v) => `${v}–${v + SUM_BUCKET - 1}`
      ),
    },
    parity: {
      distribution: toBuckets(
        parityCounts,
        total,
        (v) => `${v}P / ${cfg.drawSize - v}Í`
      ),
      mostCommon: (() => {
        const best = [...parityCounts.entries()].sort(
          (a, b) => b[1] - a[1]
        )[0];
        return best
          ? `${best[0]} pares / ${cfg.drawSize - best[0]} ímpares`
          : "—";
      })(),
    },
    primes: {
      distribution: toBuckets(primeCounts, total, (v) => `${v} primos`),
      avg: mean([...primeCounts.entries()].flatMap(([v, c]) => Array(c).fill(v))),
    },
    consecutive: {
      distribution: toBuckets(
        consecCounts,
        total,
        (v) => (v === 0 ? "nenhum" : `${v} par(es)`)
      ),
      avg: mean(
        [...consecCounts.entries()].flatMap(([v, c]) => Array(c).fill(v))
      ),
    },
    repeats: {
      distribution: toBuckets(
        repeatCounts,
        repTotal,
        (v) => `${v} repetida(s)`
      ),
      avg: mean(
        [...repeatCounts.entries()].flatMap(([v, c]) => Array(c).fill(v))
      ),
    },
    endings: toBuckets(endingCounts, total * cfg.drawSize, (v) => `final ${v}`),
    ranges: toBuckets(rangeCounts, total * cfg.drawSize, (v) => {
      const lo = v * 10 + 1;
      const hi = Math.min((v + 1) * 10, max);
      return `${lo}–${hi}`;
    }),
    zones: {
      rows: toBuckets(
        rowCounts,
        total * cfg.drawSize,
        (v) => `linha ${v + 1}`
      ),
      cols: toBuckets(
        colCounts,
        total * cfg.drawSize,
        (v) => `coluna ${v + 1}`
      ),
    },
    pairs,
  };
}
