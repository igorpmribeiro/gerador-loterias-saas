import type { Draw, LotteryConfig } from "./lotteries";
import {
  countConsecutive,
  countEven,
  countPrimes,
  mean,
  stdev,
  toBuckets,
  type DistributionBucket,
  type PairStat,
} from "./analysis";
import { isFrameNumber, maxConsecutiveRun } from "./draw-table";
import type { SpecialEdition, SpecialSeries } from "./special-draws";

/* ----------------------------- Tipos ----------------------------- */

export interface SpecialEditionStat {
  year: number;
  contest: number;
  date: string;
  numbers: number[];
  sum: number;
  even: number;
  odd: number;
  primes: number;
  consecutivePairs: number;
  maxRun: number;
  /** Dezenas na moldura do volante (só Lotofácil). */
  frame: number | null;
  /** Dezenas repetidas da edição anterior da série (null na primeira). */
  repeatsFromPrevious: number | null;
  /** Dezenas que estreavam na série nesta edição. */
  debuts: number[];
  /** Ganhadores da faixa principal (0 = acumulou, null = desconhecido). */
  winners: number | null;
  /** Prêmio por ganhador da faixa principal. */
  prizePerWinner: number | null;
}

export interface SpecialNumberStat {
  number: number;
  /** Edições especiais em que a dezena saiu. */
  count: number;
  /** % das edições especiais. */
  percentage: number;
  lastYear: number | null;
  lastContest: number | null;
  /** Edições da série sem sair (0 = saiu na última). */
  editionsSince: number;
  /** Maior sequência de edições seguidas em que saiu. */
  maxStreak: number;
  /** % dos concursos comuns (fora da série) em que saiu. */
  regularPercentage: number;
  /** Quantas vezes a taxa nas especiais é maior que a dos comuns. */
  lift: number;
  /**
   * Faixa central de 95% de aparições que o puro acaso produziria com este
   * número de edições. É o que separa "padrão" de "coincidência".
   */
  chanceBand: [number, number];
  verdict: "acima" | "dentro" | "abaixo";
}

export interface SpecialAnalysis {
  lottery: string;
  series: {
    id: string;
    name: string;
    shortName: string;
    schedule: string;
    rule: string;
  };
  totalEditions: number;
  /** Concursos comuns usados como base de comparação. */
  regularDraws: number;
  first: { year: number; contest: number; date: string } | null;
  last: { year: number; contest: number; date: string } | null;
  nextEdition: { year: number; label: string };
  /** Aparições esperadas por dezena, por puro acaso, nesta quantidade de edições. */
  expectedPerNumber: number;

  numbers: SpecialNumberStat[];
  hot: SpecialNumberStat[];
  cold: SpecialNumberStat[];
  overdue: SpecialNumberStat[];
  never: SpecialNumberStat[];
  /** Acima da faixa que o acaso explicaria. */
  standout: SpecialNumberStat[];
  /** Abaixo da faixa que o acaso explicaria. */
  underdog: SpecialNumberStat[];
  /** Maior diferença de taxa entre a série e os concursos comuns. */
  topLift: SpecialNumberStat[];

  sum: {
    min: number;
    max: number;
    avg: number;
    stdev: number;
    idealRange: [number, number];
    distribution: DistributionBucket[];
  };
  parity: { distribution: DistributionBucket[]; mostCommon: string };
  primes: { distribution: DistributionBucket[]; avg: number };
  consecutive: { distribution: DistributionBucket[]; avg: number };
  /** Repetições em relação à edição ANTERIOR DA SÉRIE (não do concurso anterior). */
  repeats: { distribution: DistributionBucket[]; avg: number };
  endings: DistributionBucket[];
  ranges: DistributionBucket[];
  zones: { rows: DistributionBucket[]; cols: DistributionBucket[] };
  /** Moldura × miolo — só faz sentido no volante 5×5 da Lotofácil. */
  frame: { distribution: DistributionBucket[]; avg: number } | null;
  pairs: PairStat[];

  editions: SpecialEditionStat[];
}

/* --------------------------- Utilidades --------------------------- */

/**
 * Intervalo central de 95% de uma binomial(n, p), calculado pela distribuição
 * exata — com 14 a 18 edições, aproximação normal erraria feio. É o que
 * permite dizer se uma dezena "quente" é padrão ou só sorte da amostra.
 */
export function binomialBand(
  n: number,
  p: number,
  mass = 0.95
): [number, number] {
  if (n <= 0) return [0, 0];
  if (p <= 0) return [0, 0];
  if (p >= 1) return [n, n];

  const pmf: number[] = [(1 - p) ** n];
  for (let k = 1; k <= n; k++) {
    pmf.push((pmf[k - 1] * ((n - k + 1) / k) * p) / (1 - p));
  }

  const tail = (1 - mass) / 2;
  let acc = 0;
  let lo = 0;
  for (let k = 0; k <= n; k++) {
    acc += pmf[k];
    if (acc > tail) {
      lo = k;
      break;
    }
  }
  acc = 0;
  let hi = n;
  for (let k = n; k >= 0; k--) {
    acc += pmf[k];
    if (acc > tail) {
      hi = k;
      break;
    }
  }
  return [lo, Math.max(lo, hi)];
}

/**
 * Conta valores preenchendo com zero as posições vazias do intervalo — numa
 * amostra pequena, o buraco no meio da distribuição também é informação.
 */
function countsInRange(values: number[], step = 1): Map<number, number> {
  const counts = new Map<number, number>();
  if (values.length === 0) return counts;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  for (let v = lo; v <= hi; v += step) counts.set(v, 0);
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return counts;
}

/** Passo "redondo" que divide a amplitude das somas em ~6 faixas. */
function sumStepFor(values: number[]): number {
  if (values.length === 0) return 10;
  const span = Math.max(...values) - Math.min(...values);
  return Math.max(10, Math.ceil(span / 6 / 10) * 10);
}

/* --------------------------- Análise --------------------------- */

/**
 * Análise restrita aos sorteios especiais de uma loteria. Recebe o histórico
 * completo porque os concursos comuns entram como base de comparação: sem
 * eles, "a dezena 10 saiu em 33% das Viradas" não diz nada.
 */
export function analyzeSpecials(
  allDraws: Draw[],
  cfg: LotteryConfig,
  series: SpecialSeries,
  editions: SpecialEdition[]
): SpecialAnalysis {
  const { min, max } = cfg;
  const universe = max - min + 1;

  const byContest = new Map(allDraws.map((d) => [d.contest, d]));
  const specialContests = new Set(editions.map((e) => e.contest));

  /** Edições que já existem no banco, da mais antiga para a mais recente. */
  const drawn = editions
    .map((e) => ({ edition: e, draw: byContest.get(e.contest) }))
    .filter(
      (x): x is { edition: SpecialEdition; draw: Draw } => x.draw !== undefined
    )
    .sort((a, b) => a.edition.contest - b.edition.contest);

  const total = drawn.length;
  const regular = allDraws.filter((d) => !specialContests.has(d.contest));

  /* --- Frequência por dezena, na série e fora dela --- */
  const specialCount = new Map<number, number>();
  const regularCount = new Map<number, number>();
  for (let n = min; n <= max; n++) {
    specialCount.set(n, 0);
    regularCount.set(n, 0);
  }
  for (const { draw } of drawn) {
    for (const n of draw.numbers) {
      specialCount.set(n, (specialCount.get(n) ?? 0) + 1);
    }
  }
  for (const d of regular) {
    for (const n of d.numbers) {
      regularCount.set(n, (regularCount.get(n) ?? 0) + 1);
    }
  }

  const p = cfg.drawSize / universe;
  const band = binomialBand(total, p);
  const expectedPerNumber = total * p;

  const numbers: SpecialNumberStat[] = [];
  for (let n = min; n <= max; n++) {
    const count = specialCount.get(n) ?? 0;

    // Índices (na série) em que a dezena saiu — base de atraso e sequência.
    const hits: number[] = [];
    drawn.forEach((x, idx) => {
      if (x.draw.numbers.includes(n)) hits.push(idx);
    });

    let maxStreak = 0;
    let streak = 0;
    let prevIdx = -2;
    for (const idx of hits) {
      streak = idx === prevIdx + 1 ? streak + 1 : 1;
      maxStreak = Math.max(maxStreak, streak);
      prevIdx = idx;
    }

    const lastIdx = hits.length ? hits[hits.length - 1] : -1;
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const regularPercentage =
      regular.length > 0
        ? ((regularCount.get(n) ?? 0) / regular.length) * 100
        : 0;

    numbers.push({
      number: n,
      count,
      percentage,
      lastYear: lastIdx >= 0 ? drawn[lastIdx].edition.year : null,
      lastContest: lastIdx >= 0 ? drawn[lastIdx].edition.contest : null,
      editionsSince: total > 0 ? total - 1 - lastIdx : 0,
      maxStreak,
      regularPercentage,
      lift: regularPercentage > 0 ? percentage / regularPercentage : 0,
      chanceBand: band,
      verdict:
        count > band[1] ? "acima" : count < band[0] ? "abaixo" : "dentro",
    });
  }

  const byCount = [...numbers].sort(
    (a, b) => b.count - a.count || a.number - b.number
  );

  /* --- Distribuições da série --- */
  const sums: number[] = [];
  const evens: number[] = [];
  const primes: number[] = [];
  const consecs: number[] = [];
  const frames: number[] = [];
  const repeats: number[] = [];
  const endingCounts = new Map<number, number>();
  const rangeCounts = new Map<number, number>();
  const rowCounts = new Map<number, number>();
  const colCounts = new Map<number, number>();
  const pairCounts = new Map<string, number>();

  for (let e = 0; e <= 9; e++) endingCounts.set(e, 0);
  for (let d = 0; d < Math.ceil(universe / 10); d++) rangeCounts.set(d, 0);
  for (let r = 0; r < cfg.grid.rows; r++) rowCounts.set(r, 0);
  for (let c = 0; c < cfg.grid.cols; c++) colCounts.set(c, 0);

  const isLotofacil = cfg.id === "lotofacil";
  const seen = new Set<number>();
  const editionStats: SpecialEditionStat[] = [];

  drawn.forEach((x, idx) => {
    const nums = [...x.draw.numbers].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const even = countEven(nums);
    const prime = countPrimes(nums);
    const consec = countConsecutive(nums);
    const frame = isLotofacil
      ? nums.filter((n) => isFrameNumber(n, cfg)).length
      : null;

    sums.push(sum);
    evens.push(even);
    primes.push(prime);
    consecs.push(consec);
    if (frame !== null) frames.push(frame);

    const prevNums = idx > 0 ? new Set(drawn[idx - 1].draw.numbers) : null;
    const repeated = prevNums
      ? nums.filter((n) => prevNums.has(n)).length
      : null;
    if (repeated !== null) repeats.push(repeated);

    const debuts = nums.filter((n) => !seen.has(n));
    for (const n of nums) seen.add(n);

    for (const n of nums) {
      endingCounts.set(n % 10, (endingCounts.get(n % 10) ?? 0) + 1);
      const decade = Math.floor((n - 1) / 10);
      rangeCounts.set(decade, (rangeCounts.get(decade) ?? 0) + 1);
      const row = Math.floor((n - 1) / cfg.grid.cols);
      const col = (n - 1) % cfg.grid.cols;
      rowCounts.set(row, (rowCounts.get(row) ?? 0) + 1);
      colCounts.set(col, (colCounts.get(col) ?? 0) + 1);
    }

    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }

    editionStats.push({
      year: x.edition.year,
      contest: x.edition.contest,
      date: x.draw.date,
      numbers: nums,
      sum,
      even,
      odd: nums.length - even,
      primes: prime,
      consecutivePairs: consec,
      maxRun: maxConsecutiveRun(nums),
      frame,
      repeatsFromPrevious: repeated,
      debuts,
      winners: x.edition.winners,
      prizePerWinner: x.edition.prizePerWinner,
    });
  });

  const sumAvg = mean(sums);
  const sumStdev = stdev(sums);
  const sumStep = sumStepFor(sums);
  const sumBuckets = countsInRange(
    sums.map((s) => Math.floor(s / sumStep) * sumStep),
    sumStep
  );

  const parityCounts = countsInRange(evens);
  const parityTop = [...parityCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  // Dupla que saiu uma vez só não é dupla — some do ranking quando existe
  // qualquer par com repetição.
  const allPairs: PairStat[] = [...pairCounts.entries()]
    .map(([key, count]) => {
      const [a, b] = key.split("-").map(Number);
      return { a, b, count, percentage: total > 0 ? (count / total) * 100 : 0 };
    })
    .sort((x, y) => y.count - x.count || x.a - y.a || x.b - y.b);
  const repeated = allPairs.filter((p) => p.count > 1);
  const pairs = (repeated.length > 0 ? repeated : allPairs).slice(0, 15);

  const lastEdition = drawn[drawn.length - 1];
  const firstEdition = drawn[0];
  const nextYear = (lastEdition?.edition.year ?? new Date().getFullYear()) + 1;
  const totalNumbers = Math.max(1, total * cfg.drawSize);

  return {
    lottery: cfg.id,
    series: {
      id: series.id,
      name: series.name,
      shortName: series.shortName,
      schedule: series.schedule,
      rule: series.rule,
    },
    totalEditions: total,
    regularDraws: regular.length,
    first: firstEdition
      ? {
          year: firstEdition.edition.year,
          contest: firstEdition.edition.contest,
          date: firstEdition.draw.date,
        }
      : null,
    last: lastEdition
      ? {
          year: lastEdition.edition.year,
          contest: lastEdition.edition.contest,
          date: lastEdition.draw.date,
        }
      : null,
    nextEdition: {
      year: nextYear,
      label:
        series.id === "mega-da-virada"
          ? `31 de dezembro de ${nextYear}`
          : `setembro de ${nextYear}`,
    },
    expectedPerNumber,

    numbers,
    hot: byCount.slice(0, 10),
    cold: [...byCount].reverse().slice(0, 10),
    overdue: [...numbers]
      .sort(
        (a, b) => b.editionsSince - a.editionsSince || a.number - b.number
      )
      .slice(0, 10),
    never: numbers.filter((n) => n.count === 0),
    standout: numbers
      .filter((n) => n.verdict === "acima")
      .sort((a, b) => b.count - a.count || a.number - b.number),
    underdog: numbers
      .filter((n) => n.verdict === "abaixo")
      .sort((a, b) => a.count - b.count || a.number - b.number),
    topLift: [...numbers]
      .sort((a, b) => b.lift - a.lift || a.number - b.number)
      .slice(0, 8),

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
        sumBuckets,
        total,
        (v) => `${v}–${v + sumStep - 1}`
      ),
    },
    parity: {
      distribution: toBuckets(
        parityCounts,
        total,
        (v) => `${v}P / ${cfg.drawSize - v}Í`
      ),
      mostCommon: parityTop
        ? `${parityTop[0]} pares / ${cfg.drawSize - parityTop[0]} ímpares`
        : "—",
    },
    primes: {
      distribution: toBuckets(
        countsInRange(primes),
        total,
        (v) => `${v} primos`
      ),
      avg: mean(primes),
    },
    consecutive: {
      distribution: toBuckets(countsInRange(consecs), total, (v) =>
        v === 0 ? "nenhum" : `${v} par(es)`
      ),
      avg: mean(consecs),
    },
    repeats: {
      distribution: toBuckets(
        countsInRange(repeats),
        Math.max(1, repeats.length),
        (v) => `${v} repetida(s)`
      ),
      avg: mean(repeats),
    },
    endings: toBuckets(endingCounts, totalNumbers, (v) => `final ${v}`),
    ranges: toBuckets(rangeCounts, totalNumbers, (v) => {
      const lo = v * 10 + 1;
      const hi = Math.min((v + 1) * 10, max);
      return `${lo}–${hi}`;
    }),
    zones: {
      rows: toBuckets(rowCounts, totalNumbers, (v) => `linha ${v + 1}`),
      cols: toBuckets(colCounts, totalNumbers, (v) => `coluna ${v + 1}`),
    },
    frame: isLotofacil
      ? {
          distribution: toBuckets(
            countsInRange(frames),
            total,
            (v) => `${v} na moldura`
          ),
          avg: mean(frames),
        }
      : null,
    pairs,

    editions: [...editionStats].reverse(),
  };
}
