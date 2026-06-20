import { countDraws, getDraws, getPrizes, type PrizeRow } from "./db";
import {
  getLottery,
  LOTTERY_LIST,
  type Draw,
  type LotteryId,
} from "./lotteries";

/**
 * Slugs amigáveis de URL para as páginas públicas de resultados. Mantidos
 * separados do `LotteryId` interno para casar com os termos de busca
 * ("mega-sena", "lotofacil") sem acoplar à chave do banco.
 */
const SLUG_TO_ID: Record<string, LotteryId> = {
  "mega-sena": "megasena",
  lotofacil: "lotofacil",
};

const ID_TO_SLUG: Record<LotteryId, string> = {
  megasena: "mega-sena",
  lotofacil: "lotofacil",
};

export const RESULT_SLUGS = Object.keys(SLUG_TO_ID);

export function lotteryForSlug(slug: string): LotteryId | null {
  return SLUG_TO_ID[slug] ?? null;
}

export function slugForLottery(id: LotteryId): string {
  return ID_TO_SLUG[id];
}

export interface ResultView {
  lottery: LotteryId;
  slug: string;
  name: string;
  contest: number;
  date: string;
  numbers: number[];
  prizes: PrizeRow[];
  /** Faixa principal sem ganhador. */
  accumulated: boolean;
  /** Ganhadores da faixa principal (0 quando acumulou). */
  topWinners: number;
  totalStored: number;
}

/** Último resultado de uma loteria, montado a partir do banco (sem bater na Caixa). */
export async function getLatestResult(
  lottery: LotteryId
): Promise<ResultView | null> {
  const [draw] = await getDraws(lottery, 1);
  if (!draw) return null;

  const cfg = getLottery(lottery);
  const [prizes, totalStored] = await Promise.all([
    getPrizes(lottery, draw.contest),
    countDraws(lottery),
  ]);

  const topHits = cfg.prizeTiers[0]?.hits;
  const top = prizes.find((p) => p.hits === topHits);
  const topWinners = top?.winners ?? 0;

  return {
    lottery,
    slug: slugForLottery(lottery),
    name: cfg.name,
    contest: draw.contest,
    date: draw.date,
    numbers: draw.numbers,
    prizes,
    accumulated: topWinners === 0,
    topWinners,
    totalStored,
  };
}

/** Últimos resultados de todas as loterias (para o hub /resultados). */
export async function getAllLatestResults(): Promise<ResultView[]> {
  const views = await Promise.all(
    LOTTERY_LIST.map((l) => getLatestResult(l.id))
  );
  return views.filter((v): v is ResultView => v !== null);
}

/** Concursos recentes (concurso, data, dezenas) para a tabela de histórico. */
export async function getRecentResults(
  lottery: LotteryId,
  limit: number
): Promise<Draw[]> {
  return getDraws(lottery, limit);
}
