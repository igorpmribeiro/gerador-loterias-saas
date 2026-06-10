import type { Draw, LotteryConfig } from "./lotteries";
import { countConsecutive, countEven, countPrimes } from "./analysis";

/* ----------------------------- Tipos ----------------------------- */

export type Strategy = "ml" | "hot" | "overdue" | "balanced" | "random";

export interface GeneratedGame {
  numbers: number[];
  strategy: Strategy;
  /** Afinidade do jogo com o modelo (0–100). Não é probabilidade real. */
  confidence: number;
  metrics: {
    sum: number;
    even: number;
    odd: number;
    primes: number;
    consecutive: number;
    repeatsFromLast: number;
  };
}

export interface GeneratorModel {
  cfg: LotteryConfig;
  /** Peso aprendido por número (índice = número - min). */
  weights: number[];
  /** Matriz de co-ocorrência normalizada (Markov de pares). */
  markov: number[][];
  targets: {
    sum: { mean: number; stdev: number };
    even: number;
    primes: number;
    consecutive: number;
  };
  /** Assinaturas dos jogos históricos (para evitar duplicar sorteios). */
  historical: Set<string>;
  lastDraw: number[];
}

/* --------------------------- RNG simples --------------------------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --------------------------- Treino --------------------------- */

/**
 * "Treina" o modelo a partir do histórico. Combina:
 *  - frequência com decaimento exponencial (concursos recentes pesam mais);
 *  - pressão de atraso (números atrasados ganham peso);
 *  - tendência de curto prazo;
 *  - matriz de co-ocorrência (cadeia de Markov de pares).
 */
export function trainModel(
  draws: Draw[],
  cfg: LotteryConfig
): GeneratorModel {
  const ordered = [...draws].sort((a, b) => a.contest - b.contest);
  const total = ordered.length;
  const size = cfg.max - cfg.min + 1;
  const idx = (n: number) => n - cfg.min;

  const DECAY = 0.997; // peso de recência
  const SHORT_WINDOW = 60;

  const freq = new Array(size).fill(0);
  const weightedFreq = new Array(size).fill(0);
  const shortFreq = new Array(size).fill(0);
  const lastSeenIdx = new Array(size).fill(-1);
  const markovRaw: number[][] = Array.from({ length: size }, () =>
    new Array(size).fill(0)
  );

  const sums: number[] = [];
  const evens: number[] = [];
  const primesArr: number[] = [];
  const consecArr: number[] = [];

  ordered.forEach((draw, i) => {
    const age = total - 1 - i;
    const recencyWeight = Math.pow(DECAY, age);
    const nums = draw.numbers;

    for (const n of nums) {
      const k = idx(n);
      freq[k] += 1;
      weightedFreq[k] += recencyWeight;
      lastSeenIdx[k] = i;
      if (age < SHORT_WINDOW) shortFreq[k] += 1;
    }
    for (let a = 0; a < nums.length; a++) {
      for (let b = 0; b < nums.length; b++) {
        if (a === b) continue;
        markovRaw[idx(nums[a])][idx(nums[b])] += recencyWeight;
      }
    }

    sums.push(nums.reduce((x, y) => x + y, 0));
    evens.push(countEven(nums));
    primesArr.push(countPrimes(nums));
    consecArr.push(countConsecutive(nums));
  });

  /* --- Peso por número --- */
  const maxWeightedFreq = Math.max(...weightedFreq, 1);

  const weights = new Array(size).fill(0);
  for (let k = 0; k < size; k++) {
    // componente de frequência ponderada por recência
    const freqScore = weightedFreq[k] / maxWeightedFreq;

    // componente de atraso: positivo quando o número está "no ponto"
    const currentGap = lastSeenIdx[k] >= 0 ? total - 1 - lastSeenIdx[k] : total;
    const avgGap = freq[k] > 0 ? total / freq[k] : total;
    const gapScore = Math.min(2, currentGap / Math.max(1, avgGap));

    // componente de tendência de curto prazo
    const expectedShort = (SHORT_WINDOW * cfg.drawSize) / size;
    const trendScore =
      expectedShort > 0 ? shortFreq[k] / expectedShort : 1;

    weights[k] =
      0.5 * freqScore + 0.3 * (gapScore / 2) + 0.2 * Math.min(1.5, trendScore);
    weights[k] = Math.max(0.02, weights[k]);
  }

  /* --- Normaliza Markov: P(j | i) com suavização de Laplace --- */
  const markov: number[][] = Array.from({ length: size }, () =>
    new Array(size).fill(0)
  );
  for (let i = 0; i < size; i++) {
    let rowSum = 0;
    for (let j = 0; j < size; j++) rowSum += markovRaw[i][j];
    for (let j = 0; j < size; j++) {
      markov[i][j] = (markovRaw[i][j] + 0.1) / (rowSum + 0.1 * size);
    }
  }

  const mean = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  const sumMean = mean(sums);
  const sumStdev = Math.sqrt(mean(sums.map((s) => (s - sumMean) ** 2))) || 1;

  const historical = new Set(
    ordered.map((d) => [...d.numbers].sort((a, b) => a - b).join(","))
  );

  return {
    cfg,
    weights,
    markov,
    targets: {
      sum: { mean: sumMean, stdev: sumStdev },
      even: Math.round(mean(evens)),
      primes: mean(primesArr),
      consecutive: mean(consecArr),
    },
    historical,
    lastDraw: ordered[total - 1]?.numbers ?? [],
  };
}

/* --------------------------- Score de jogo --------------------------- */

function gaussPenalty(value: number, target: number, spread: number): number {
  const z = (value - target) / Math.max(1e-6, spread);
  return Math.exp(-0.5 * z * z); // 1 = perfeito, →0 = distante
}

/**
 * Pontua um jogo candidato (0–1) combinando afinidade com o modelo,
 * coerência via Markov e aderência aos padrões estatísticos.
 */
function scoreGame(
  game: number[],
  model: GeneratorModel,
  pickCount: number,
  usage?: number[]
): number {
  const { cfg, weights, markov, targets } = model;
  const idx = (n: number) => n - cfg.min;
  const scale = pickCount / cfg.drawSize;

  // afinidade média do modelo (com penalização de números já reutilizados,
  // o que dá variedade entre jogos gerados na mesma rodada)
  let wSum = 0;
  for (const n of game) {
    const k = idx(n);
    const div = usage ? 1 / (1 + 0.6 * usage[k]) : 1;
    wSum += weights[k] * div;
  }
  const affinity = wSum / pickCount;

  // coerência: probabilidade Markov média entre pares
  let mSum = 0;
  let pairs = 0;
  for (let i = 0; i < game.length; i++) {
    for (let j = i + 1; j < game.length; j++) {
      mSum += markov[idx(game[i])][idx(game[j])];
      pairs++;
    }
  }
  const coherence = pairs > 0 ? (mSum / pairs) * (cfg.max - cfg.min + 1) : 0;

  // aderência estatística
  const sum = game.reduce((a, b) => a + b, 0);
  const sumFit = gaussPenalty(
    sum,
    targets.sum.mean * scale,
    targets.sum.stdev * Math.sqrt(scale)
  );
  const parityFit = gaussPenalty(
    countEven(game),
    targets.even * scale,
    1.4 * Math.sqrt(scale)
  );
  const primeFit = gaussPenalty(
    countPrimes(game),
    targets.primes * scale,
    1.5 * Math.sqrt(scale)
  );
  const consecFit = gaussPenalty(
    countConsecutive(game),
    targets.consecutive * scale,
    1.5
  );
  const statFit = (sumFit + parityFit + primeFit + consecFit) / 4;

  return 0.45 * Math.min(1, affinity) + 0.2 * Math.min(1, coherence) + 0.35 * statFit;
}

/**
 * Avalia um jogo já montado: devolve a afinidade (5–99) com o modelo
 * treinado, na mesma escala da confiança exibida pelo gerador. Não é
 * probabilidade de ganhar — apenas aderência aos padrões aprendidos.
 */
export function evaluateAffinity(
  model: GeneratorModel,
  game: number[]
): number {
  const raw = scoreGame(game, model, game.length);
  return Math.round(Math.min(99, Math.max(5, ((raw - 0.5) / 0.42) * 100)));
}

/* --------------------------- Amostragem --------------------------- */

function weightedPick(
  pool: number[],
  weightOf: (n: number) => number,
  rng: () => number
): number {
  let total = 0;
  for (const n of pool) total += Math.max(1e-6, weightOf(n));
  let r = rng() * total;
  for (const n of pool) {
    r -= Math.max(1e-6, weightOf(n));
    if (r <= 0) return n;
  }
  return pool[pool.length - 1];
}

function strategyWeight(
  n: number,
  model: GeneratorModel,
  strategy: Strategy,
  usage?: number[]
): number {
  const k = n - model.cfg.min;
  const w = model.weights[k];
  const div = usage ? 1 / (1 + 0.6 * usage[k]) : 1;
  let base: number;
  switch (strategy) {
    case "random":
      base = 1;
      break;
    case "hot":
      base = Math.pow(w, 2.2);
      break;
    case "overdue":
      // favorece números atrasados — o peso já embute pressão de atraso,
      // aqui acentuamos o componente de raridade recente
      base = Math.pow(Math.max(0.05, 1.1 - w), 1.6) + 0.15;
      break;
    case "balanced":
      base = 0.5 + w;
      break;
    case "ml":
    default:
      base = w;
  }
  return base * div;
}

/* --------------------------- Geração --------------------------- */

/** Constrói um jogo inicial por amostragem ponderada. */
function seedGame(
  model: GeneratorModel,
  strategy: Strategy,
  pickCount: number,
  rng: () => number,
  usage?: number[]
): number[] {
  const { cfg } = model;
  const pool: number[] = [];
  for (let n = cfg.min; n <= cfg.max; n++) pool.push(n);

  const game = new Set<number>();
  while (game.size < pickCount) {
    const remaining = pool.filter((n) => !game.has(n));
    const pick = weightedPick(
      remaining,
      (n) => strategyWeight(n, model, strategy, usage),
      rng
    );
    game.add(pick);
  }
  return [...game].sort((a, b) => a - b);
}

/**
 * Refina o jogo por simulated annealing: troca números para maximizar
 * o score combinado, sem repetir um sorteio histórico.
 */
function refine(
  seed: number[],
  model: GeneratorModel,
  strategy: Strategy,
  pickCount: number,
  rng: () => number,
  usage?: number[]
): number[] {
  if (strategy === "random") return seed;

  const { cfg } = model;
  let current = [...seed];
  let currentScore = scoreGame(current, model, pickCount, usage);
  let best = current;
  let bestScore = currentScore;

  const ITERATIONS = 220;
  for (let iter = 0; iter < ITERATIONS; iter++) {
    const temp = 0.12 * (1 - iter / ITERATIONS);

    const removeAt = Math.floor(rng() * current.length);
    const candidate = cfg.min + Math.floor(rng() * (cfg.max - cfg.min + 1));
    if (current.includes(candidate)) continue;

    const next = current.filter((_, i) => i !== removeAt);
    next.push(candidate);
    next.sort((a, b) => a - b);

    const key = next.join(",");
    if (model.historical.has(key)) continue;

    const nextScore = scoreGame(next, model, pickCount, usage);
    const delta = nextScore - currentScore;
    if (delta > 0 || rng() < Math.exp(delta / Math.max(1e-6, temp))) {
      current = next;
      currentScore = nextScore;
      if (nextScore > bestScore) {
        best = next;
        bestScore = nextScore;
      }
    }
  }
  return best;
}

function metricsOf(game: number[], lastDraw: number[]) {
  const lastSet = new Set(lastDraw);
  const even = countEven(game);
  return {
    sum: game.reduce((a, b) => a + b, 0),
    even,
    odd: game.length - even,
    primes: countPrimes(game),
    consecutive: countConsecutive(game),
    repeatsFromLast: game.filter((n) => lastSet.has(n)).length,
  };
}

export interface GenerateOptions {
  strategy?: Strategy;
  /** Quantidade de dezenas a marcar (default = drawSize da loteria). */
  picks?: number;
  /** Quantos jogos gerar. */
  count?: number;
  seed?: number;
}

/** Gera um conjunto de jogos a partir do modelo treinado. */
export function generateGames(
  model: GeneratorModel,
  options: GenerateOptions = {}
): GeneratedGame[] {
  const { cfg } = model;
  const strategy = options.strategy ?? "ml";
  const pickCount = Math.min(
    cfg.pickMax,
    Math.max(cfg.pickMin, options.picks ?? cfg.drawSize)
  );
  const count = Math.min(20, Math.max(1, options.count ?? 5));
  const rng = mulberry32(options.seed ?? (Math.random() * 1e9) | 0);

  const games: GeneratedGame[] = [];
  const seen = new Set<string>();
  // contador de reuso por número — penaliza repetição entre os jogos
  const usage = new Array(cfg.max - cfg.min + 1).fill(0);
  const useDiversity = strategy !== "random";

  let attempts = 0;
  while (games.length < count && attempts < count * 12) {
    attempts++;
    const u = useDiversity ? usage : undefined;
    const seed = seedGame(model, strategy, pickCount, rng, u);
    const refined = refine(seed, model, strategy, pickCount, rng, u);
    const key = refined.join(",");
    if (seen.has(key)) continue;
    seen.add(key);

    // confiança = score real (sem penalidade de diversidade) remapeado
    const rawScore = scoreGame(refined, model, pickCount);
    const confidence = Math.round(
      Math.min(99, Math.max(5, ((rawScore - 0.5) / 0.42) * 100))
    );
    for (const n of refined) usage[n - cfg.min]++;

    games.push({
      numbers: refined,
      strategy,
      confidence,
      metrics: metricsOf(refined, model.lastDraw),
    });
  }

  return games.sort((a, b) => b.confidence - a.confidence);
}
