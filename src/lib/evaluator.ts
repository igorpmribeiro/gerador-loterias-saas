import type { Draw, LotteryConfig } from "./lotteries";
import type { DistributionBucket } from "./analysis";
import { countConsecutive, countEven, countPrimes } from "./analysis";
import { isFrameNumber, maxConsecutiveRun } from "./draw-table";
import { evaluateAffinity, trainModel } from "./generator";

/* ----------------------------- Tipos ----------------------------- */

/** Quão comum é o valor do jogo frente ao histórico. */
export type Verdict = "tipico" | "aceitavel" | "atipico";

export interface MetricEvaluation {
  key: string;
  label: string;
  description: string;
  /** Valor calculado para o jogo do cliente. */
  value: number;
  valueLabel: string;
  /** % de concursos históricos com exatamente este valor. */
  historicalShare: number;
  /** Valor mais frequente no histórico. */
  topValue: number;
  topValueLabel: string;
  topShare: number;
  verdict: Verdict;
  /** Distribuição completa — o bucket de `value` é o do jogo. */
  distribution: DistributionBucket[];
}

export interface SumEvaluation {
  /** Soma das dezenas do jogo. */
  value: number;
  mean: number;
  stdev: number;
  /** Faixa típica (média ± 1 desvio). */
  idealRange: [number, number];
  min: number;
  max: number;
  /** % de concursos com soma menor ou igual à do jogo. */
  percentile: number;
  verdict: Verdict;
  distribution: DistributionBucket[];
  /** Bucket (faixa) em que a soma do jogo cai. */
  gameBucket: number;
}

export interface GameEvaluation {
  lottery: string;
  totalDraws: number;
  numbers: number[];
  /** Afinidade (5–99) com o modelo estatístico — não é chance de ganhar. */
  affinity: number;
  /** Dezenas do último sorteio (para destacar repetições). */
  lastDraw: number[];
  lastContest: number | null;
  sum: SumEvaluation;
  metrics: MetricEvaluation[];
}

export interface PrizedDraw {
  contest: number;
  date: string;
  hits: number;
  tierLabel: string;
  /** Dezenas do jogo que coincidiram com este sorteio. */
  matched: number[];
}

export interface TierResult {
  hits: number;
  label: string;
  /** Quantas vezes o jogo teria batido esta faixa. */
  occurrences: number;
}

export interface GameCheck {
  lottery: string;
  numbers: number[];
  totalDraws: number;
  tiers: TierResult[];
  /** Quantidade de concursos por nº de acertos (0..drawSize). */
  hitDistribution: DistributionBucket[];
  /** Melhor resultado já obtido pelo jogo em toda a história. */
  best: { hits: number; contest: number; date: string } | null;
  /** Concursos em que o jogo teria sido premiado, do mais recente ao mais antigo. */
  prizedDraws: PrizedDraw[];
  everPrized: boolean;
}

/* --------------------------- Utilidades --------------------------- */

function verdictOf(share: number): Verdict {
  if (share >= 15) return "tipico";
  if (share >= 5) return "aceitavel";
  return "atipico";
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/**
 * Monta a avaliação de uma métrica discreta: tabula os valores históricos,
 * localiza o valor do jogo e classifica o quão comum ele é.
 */
function discreteMetric(
  key: string,
  label: string,
  description: string,
  gameValue: number,
  drawValues: number[],
  labelOf: (v: number) => string
): MetricEvaluation {
  const total = drawValues.length;
  const counts = new Map<number, number>();
  for (const v of drawValues) counts.set(v, (counts.get(v) ?? 0) + 1);
  // garante que o valor do jogo apareça na distribuição mesmo se inédito
  if (!counts.has(gameValue)) counts.set(gameValue, 0);

  const distribution: DistributionBucket[] = [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([value, count]) => ({
      label: labelOf(value),
      value,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));

  const own = distribution.find((d) => d.value === gameValue)!;
  const top = [...distribution].sort((a, b) => b.count - a.count)[0];

  return {
    key,
    label,
    description,
    value: gameValue,
    valueLabel: labelOf(gameValue),
    historicalShare: own.percentage,
    topValue: top.value,
    topValueLabel: top.label,
    topShare: top.percentage,
    verdict: verdictOf(own.percentage),
    distribution,
  };
}

function sumEvaluation(
  value: number,
  sums: number[],
  cfg: LotteryConfig
): SumEvaluation {
  const total = sums.length;
  const m = mean(sums);
  const sd = Math.sqrt(mean(sums.map((s) => (s - m) ** 2))) || 1;
  const bucketSize = cfg.drawSize >= 10 ? 10 : 20;

  const counts = new Map<number, number>();
  for (const s of sums) {
    const b = Math.floor(s / bucketSize) * bucketSize;
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  const gameBucket = Math.floor(value / bucketSize) * bucketSize;
  if (!counts.has(gameBucket)) counts.set(gameBucket, 0);

  const distribution: DistributionBucket[] = [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([b, count]) => ({
      label: `${b}–${b + bucketSize - 1}`,
      value: b,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));

  const z = Math.abs((value - m) / sd);

  return {
    value,
    mean: m,
    stdev: sd,
    idealRange: [Math.round(m - sd), Math.round(m + sd)],
    min: sums.length ? Math.min(...sums) : 0,
    max: sums.length ? Math.max(...sums) : 0,
    percentile:
      total > 0
        ? (sums.filter((s) => s <= value).length / total) * 100
        : 0,
    verdict: z <= 1 ? "tipico" : z <= 2 ? "aceitavel" : "atipico",
    distribution,
    gameBucket,
  };
}

/* --------------------------- Avaliação --------------------------- */

/**
 * Avalia um jogo (aposta simples, com `drawSize` dezenas) frente a todo o
 * histórico: produz métricas de par/ímpar, soma, primos, sequências,
 * moldura e repetições do último sorteio, além da afinidade com o modelo.
 */
export function evaluateGame(
  numbers: number[],
  draws: Draw[],
  cfg: LotteryConfig
): GameEvaluation {
  const ordered = [...draws].sort((a, b) => a.contest - b.contest);
  const total = ordered.length;
  const game = [...numbers].sort((a, b) => a - b);
  const lastDrawRaw = ordered[total - 1];
  const lastSet = new Set(lastDrawRaw?.numbers ?? []);

  /* --- Valores históricos por concurso --- */
  const sums: number[] = [];
  const evens: number[] = [];
  const primes: number[] = [];
  const consec: number[] = [];
  const runs: number[] = [];
  const frames: number[] = [];
  const repeats: number[] = [];

  ordered.forEach((d, i) => {
    const nums = d.numbers;
    sums.push(nums.reduce((a, b) => a + b, 0));
    evens.push(countEven(nums));
    primes.push(countPrimes(nums));
    consec.push(countConsecutive(nums));
    runs.push(maxConsecutiveRun(nums));
    frames.push(nums.filter((n) => isFrameNumber(n, cfg)).length);
    if (i > 0) {
      const prev = new Set(ordered[i - 1].numbers);
      repeats.push(nums.filter((n) => prev.has(n)).length);
    }
  });

  /* --- Métricas do jogo --- */
  const drawSize = cfg.drawSize;
  const metrics: MetricEvaluation[] = [
    discreteMetric(
      "parity",
      "Pares e ímpares",
      "Equilíbrio entre dezenas pares e ímpares.",
      countEven(game),
      evens,
      (v) => `${v}P / ${drawSize - v}Í`
    ),
    discreteMetric(
      "primes",
      "Números primos",
      "Quantidade de dezenas primas no jogo.",
      countPrimes(game),
      primes,
      (v) => `${v} primo${v === 1 ? "" : "s"}`
    ),
    discreteMetric(
      "consecutive",
      "Pares consecutivos",
      "Pares de dezenas seguidas (ex.: 14 e 15).",
      countConsecutive(game),
      consec,
      (v) => (v === 0 ? "nenhum" : `${v} par${v === 1 ? "" : "es"}`)
    ),
    discreteMetric(
      "maxRun",
      "Maior sequência",
      "Maior corrida de dezenas seguidas.",
      maxConsecutiveRun(game),
      runs,
      (v) => (v <= 1 ? "sem sequência" : `${v} seguidas`)
    ),
    discreteMetric(
      "frame",
      "Moldura do volante",
      "Dezenas na borda do volante (o miolo são as demais).",
      game.filter((n) => isFrameNumber(n, cfg)).length,
      frames,
      (v) => `${v} na moldura`
    ),
    discreteMetric(
      "repeats",
      "Repetidas do último sorteio",
      "Dezenas do jogo que saíram no concurso mais recente.",
      game.filter((n) => lastSet.has(n)).length,
      repeats,
      (v) => `${v} repetida${v === 1 ? "" : "s"}`
    ),
  ];

  /* --- Afinidade com o modelo --- */
  const model = trainModel(ordered, cfg);
  const affinity = evaluateAffinity(model, game);

  return {
    lottery: cfg.id,
    totalDraws: total,
    numbers: game,
    affinity,
    lastDraw: [...(lastDrawRaw?.numbers ?? [])].sort((a, b) => a - b),
    lastContest: lastDrawRaw?.contest ?? null,
    sum: sumEvaluation(game.reduce((a, b) => a + b, 0), sums, cfg),
    metrics,
  };
}

/* --------------------------- Checagem --------------------------- */

/**
 * Compara o jogo com todos os concursos passados e apura em quantos ele
 * teria sido premiado, qual o melhor resultado e a distribuição de acertos.
 */
export function checkGame(
  numbers: number[],
  draws: Draw[],
  cfg: LotteryConfig
): GameCheck {
  const game = new Set(numbers);
  // do mais recente ao mais antigo
  const ordered = [...draws].sort((a, b) => b.contest - a.contest);
  const total = ordered.length;

  const minTier = Math.min(...cfg.prizeTiers.map((t) => t.hits));
  const tierLabelByHits = new Map(
    cfg.prizeTiers.map((t) => [t.hits, t.label])
  );

  const hitCounts = new Map<number, number>();
  const tierCounts = new Map<number, number>();
  const prizedDraws: PrizedDraw[] = [];
  let best: GameCheck["best"] = null;

  for (const d of ordered) {
    const matched = d.numbers.filter((n) => game.has(n));
    const hits = matched.length;
    hitCounts.set(hits, (hitCounts.get(hits) ?? 0) + 1);

    if (!best || hits > best.hits) {
      best = { hits, contest: d.contest, date: d.date };
    }

    if (hits >= minTier) {
      tierCounts.set(hits, (tierCounts.get(hits) ?? 0) + 1);
      prizedDraws.push({
        contest: d.contest,
        date: d.date,
        hits,
        tierLabel: tierLabelByHits.get(hits) ?? `${hits} acertos`,
        matched: matched.sort((a, b) => a - b),
      });
    }
  }

  const tiers: TierResult[] = cfg.prizeTiers.map((t) => ({
    hits: t.hits,
    label: t.label,
    occurrences: tierCounts.get(t.hits) ?? 0,
  }));

  const hitDistribution: DistributionBucket[] = [];
  for (let h = 0; h <= cfg.drawSize; h++) {
    const count = hitCounts.get(h) ?? 0;
    hitDistribution.push({
      label: `${h} acerto${h === 1 ? "" : "s"}`,
      value: h,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    });
  }

  return {
    lottery: cfg.id,
    numbers: [...numbers].sort((a, b) => a - b),
    totalDraws: total,
    tiers,
    hitDistribution,
    best,
    prizedDraws,
    everPrized: prizedDraws.length > 0,
  };
}
