import type { LotteryId } from "./lotteries";

/**
 * Fechamento (wheeling system)
 * ----------------------------
 * Um fechamento é uma técnica em que o apostador escolhe um GRUPO de
 * dezenas maior do que o tamanho de uma aposta e as combina em vários
 * jogos. Existem dois tipos:
 *
 *  • Fechamento COMPLETO: gera TODAS as combinações possíveis do grupo.
 *    Se as dezenas sorteadas estiverem no grupo, o prêmio máximo é certo.
 *
 *  • Fechamento REDUZIDO (com garantia): gera um subconjunto menor de
 *    jogos que ainda assim GARANTE um prêmio mínimo. Matematicamente é um
 *    "covering design": todo subconjunto de `g` dezenas do grupo precisa
 *    estar contido em pelo menos um jogo. Assim, se `g` ou mais dezenas
 *    sorteadas caírem no grupo, ao menos um jogo terá `g` acertos.
 */

export type WheelMode = "full" | "reduced";

export interface WheelLimits {
  full: { min: number; max: number };
  reduced: { min: number; max: number; guarantees: number[] };
}

export const WHEEL_LIMITS: Record<LotteryId, WheelLimits> = {
  megasena: {
    full: { min: 7, max: 12 },
    reduced: { min: 8, max: 13, guarantees: [4, 5] },
  },
  lotofacil: {
    full: { min: 16, max: 18 },
    reduced: { min: 16, max: 18, guarantees: [11, 12, 13, 14] },
  },
};

export interface WheelResult {
  pool: number[];
  gameSize: number;
  mode: WheelMode;
  /** Acertos garantidos (full = gameSize). */
  guarantee: number;
  games: number[][];
  gameCount: number;
  /** Total de jogos de um fechamento completo do mesmo grupo. */
  fullCount: number;
  estimatedCost: number;
  description: string;
}

/* --------------------------- Combinatória --------------------------- */

/** Coeficiente binomial C(n, k). */
export function nCk(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

/** Todas as combinações de `arr` tomadas `k` a `k`. */
export function combinations<T>(arr: T[], k: number): T[][] {
  const res: T[][] = [];
  const combo: T[] = [];
  function rec(start: number) {
    if (combo.length === k) {
      res.push([...combo]);
      return;
    }
    for (let i = start; i <= arr.length - (k - combo.length); i++) {
      combo.push(arr[i]);
      rec(i + 1);
      combo.pop();
    }
  }
  if (k >= 0 && k <= arr.length) rec(0);
  return res;
}

/* --------------------------- Fechamentos --------------------------- */

/** Fechamento completo: todas as combinações do grupo. */
function fullWheel(pool: number[], gameSize: number): number[][] {
  return combinations(pool, gameSize);
}

/**
 * Fechamento reduzido por covering design (algoritmo guloso).
 * Garante que todo subconjunto de `guarantee` dezenas do grupo esteja
 * contido em algum jogo.
 */
function reducedWheel(
  pool: number[],
  gameSize: number,
  guarantee: number
): number[][] {
  const idx = pool.map((_, i) => i);
  const gameIdxCombos = combinations(idx, gameSize);
  const targetIdxCombos = combinations(idx, guarantee);

  const G = gameIdxCombos.length;
  const T = targetIdxCombos.length;

  if (G * T > 80_000_000) {
    throw new Error(
      "grupo grande demais para fechamento reduzido — reduza o tamanho do grupo"
    );
  }

  const toMask = (c: number[]) => c.reduce((m, i) => m | (1 << i), 0);
  const gameMasks = gameIdxCombos.map(toMask);
  const targetMasks = targetIdxCombos.map(toMask);

  // gameCovers[g] = alvos contidos no jogo g; invCovers[t] = jogos que cobrem t
  const gameCovers: number[][] = Array.from({ length: G }, () => []);
  const invCovers: number[][] = Array.from({ length: T }, () => []);
  for (let g = 0; g < G; g++) {
    const gm = gameMasks[g];
    for (let t = 0; t < T; t++) {
      if ((gm & targetMasks[t]) === targetMasks[t]) {
        gameCovers[g].push(t);
        invCovers[t].push(g);
      }
    }
  }

  // guloso de cobertura: escolhe sempre o jogo que cobre mais alvos restantes
  const covered = new Uint8Array(T);
  const gain = new Int32Array(G);
  for (let g = 0; g < G; g++) gain[g] = gameCovers[g].length;

  const chosen: number[] = [];
  let remaining = T;
  while (remaining > 0) {
    let best = -1;
    let bestGain = 0;
    for (let g = 0; g < G; g++) {
      if (gain[g] > bestGain) {
        bestGain = gain[g];
        best = g;
      }
    }
    if (best < 0) break;
    chosen.push(best);
    for (const t of gameCovers[best]) {
      if (!covered[t]) {
        covered[t] = 1;
        remaining--;
        for (const g2 of invCovers[t]) gain[g2]--;
      }
    }
  }

  return chosen.map((g) => gameIdxCombos[g].map((i) => pool[i]));
}

/* --------------------------- Orquestração --------------------------- */

export interface BuildWheelOptions {
  lottery: LotteryId;
  pool: number[];
  gameSize: number;
  betPrice: number;
  mode: WheelMode;
  /** Obrigatório quando mode = "reduced". */
  guarantee?: number;
}

export function buildWheel(opts: BuildWheelOptions): WheelResult {
  const pool = [...new Set(opts.pool)].sort((a, b) => a - b);
  const { gameSize, mode, betPrice } = opts;

  if (pool.length <= gameSize) {
    throw new Error(
      `o grupo precisa ter mais de ${gameSize} dezenas para um fechamento`
    );
  }

  const fullCount = nCk(pool.length, gameSize);
  let games: number[][];
  let guarantee: number;
  let description: string;

  if (mode === "full") {
    games = fullWheel(pool, gameSize);
    guarantee = gameSize;
    description =
      `Fechamento completo de ${pool.length} dezenas. Se as ${gameSize} ` +
      `dezenas sorteadas estiverem no grupo, o prêmio máximo é garantido. ` +
      `Para qualquer quantidade h de dezenas do grupo que saírem, há um ` +
      `jogo com h acertos.`;
  } else {
    guarantee = opts.guarantee ?? gameSize - 1;
    if (guarantee >= gameSize) {
      games = fullWheel(pool, gameSize);
      description = `Fechamento completo de ${pool.length} dezenas.`;
    } else {
      games = reducedWheel(pool, gameSize, guarantee);
      description =
        `Fechamento reduzido de ${pool.length} dezenas com garantia de ` +
        `${guarantee} acertos: se pelo menos ${guarantee} das ${gameSize} ` +
        `dezenas sorteadas estiverem no seu grupo, ao menos um jogo terá ` +
        `${guarantee} acertos.`;
    }
  }

  return {
    pool,
    gameSize,
    mode,
    guarantee,
    games,
    gameCount: games.length,
    fullCount,
    estimatedCost: games.length * betPrice,
    description,
  };
}
