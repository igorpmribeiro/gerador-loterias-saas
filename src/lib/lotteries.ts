export type LotteryId = "megasena" | "lotofacil";

export interface PrizeTier {
  /** Quantidade de acertos necessária para premiar nesta faixa. */
  hits: number;
  /** Nome da faixa de premiação. */
  label: string;
}

export interface LotteryConfig {
  id: LotteryId;
  name: string;
  shortName: string;
  /** Menor número do volante. */
  min: number;
  /** Maior número do volante. */
  max: number;
  /** Quantidade de dezenas sorteadas. */
  drawSize: number;
  /** Faixa de dezenas que o apostador pode marcar. */
  pickMin: number;
  pickMax: number;
  /** Layout do volante (linhas x colunas) para análise de zonas. */
  grid: { rows: number; cols: number };
  /** Endpoint da API da Caixa. */
  apiPath: string;
  /** Token de cor da loteria — usado como tom de bolas e destaques. */
  colorVar: "mega" | "lotofacil";
  /** Valor da aposta simples (R$) — usado para estimar custo de fechamentos. */
  betPrice: number;
  /** Faixas de premiação, da maior para a menor. */
  prizeTiers: PrizeTier[];
}

export const LOTTERIES: Record<LotteryId, LotteryConfig> = {
  megasena: {
    id: "megasena",
    name: "Mega-Sena",
    shortName: "Mega",
    min: 1,
    max: 60,
    drawSize: 6,
    pickMin: 6,
    pickMax: 20,
    grid: { rows: 6, cols: 10 },
    apiPath: "megasena",
    colorVar: "mega",
    betPrice: 5,
    prizeTiers: [
      { hits: 6, label: "Sena" },
      { hits: 5, label: "Quina" },
      { hits: 4, label: "Quadra" },
    ],
  },
  lotofacil: {
    id: "lotofacil",
    name: "Lotofácil",
    shortName: "Lotofácil",
    min: 1,
    max: 25,
    drawSize: 15,
    pickMin: 15,
    pickMax: 20,
    grid: { rows: 5, cols: 5 },
    apiPath: "lotofacil",
    colorVar: "lotofacil",
    betPrice: 3,
    prizeTiers: [
      { hits: 15, label: "15 acertos" },
      { hits: 14, label: "14 acertos" },
      { hits: 13, label: "13 acertos" },
      { hits: 12, label: "12 acertos" },
      { hits: 11, label: "11 acertos" },
    ],
  },
};

export const LOTTERY_LIST = Object.values(LOTTERIES);

export function getLottery(id: string): LotteryConfig {
  const cfg = LOTTERIES[id as LotteryId];
  if (!cfg) throw new Error(`Loteria desconhecida: ${id}`);
  return cfg;
}

export function isLotteryId(id: string): id is LotteryId {
  return id === "megasena" || id === "lotofacil";
}

export interface Draw {
  lottery: LotteryId;
  contest: number;
  date: string;
  numbers: number[];
}
