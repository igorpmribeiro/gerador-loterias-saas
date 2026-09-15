import type { LotteryId } from "./lotteries";

/**
 * Catálogo dos sorteios especiais — os concursos que fogem da rotina e têm
 * regra própria de premiação: a Mega da Virada e a Lotofácil da Independência.
 *
 * Por que um catálogo em código e não uma consulta ao banco?
 * A API da Caixa só marca `indicadorConcursoEspecial = 2` nos concursos mais
 * recentes (a Virada de 2009, por exemplo, ainda vem como 1), e a data também
 * não serve de regra: a Mega-Sena sorteou em 31/12 várias vezes antes de a
 * Virada existir e a edição de 2025 foi apurada em 01/01/2026. A lista abaixo
 * foi conferida concurso a concurso na API da Caixa.
 *
 * Edições futuras entram sozinhas: o sincronizador grava em `special_draws`
 * todo concurso que a Caixa marcar como especial dentro da janela da série
 * (ver `isPlausibleSpecialDate`), e a análise soma as duas fontes.
 */

export type SpecialSeriesId = "mega-da-virada" | "lotofacil-da-independencia";

export interface SpecialEdition {
  /**
   * Ano da edição — não necessariamente o ano da apuração. A Virada de 2025
   * foi sorteada na noite de 31/12/2025 e apurada em 01/01/2026.
   */
  year: number;
  contest: number;
  /**
   * Ganhadores da faixa principal. 0 = acumulou (só aconteceu em 2008);
   * null = edição descoberta na sincronização, premiação ainda não conhecida.
   */
  winners: number | null;
  /** Prêmio por ganhador da faixa principal, em reais. */
  prizePerWinner: number | null;
}

export interface SpecialSeries {
  id: SpecialSeriesId;
  lottery: LotteryId;
  name: string;
  shortName: string;
  /** Quando o sorteio acontece, em uma linha. */
  schedule: string;
  /** O que muda nesse concurso em relação aos comuns. */
  rule: string;
  /** Meses (1–12) em que a apuração pode cair — guarda da detecção automática. */
  windowMonths: number[];
  editions: SpecialEdition[];
}

export const SPECIAL_SERIES: Record<LotteryId, SpecialSeries> = {
  megasena: {
    id: "mega-da-virada",
    lottery: "megasena",
    name: "Mega da Virada",
    shortName: "Virada",
    schedule: "Sempre em 31 de dezembro, no fim do ano.",
    rule:
      "O prêmio principal não acumula: se ninguém acerta as seis dezenas, o valor desce para a quina. Foi a única edição de 2008 que acumulou, antes dessa regra existir.",
    windowMonths: [12, 1],
    editions: [
      { year: 2008, contest: 1035, winners: 0, prizePerWinner: 0 },
      { year: 2009, contest: 1140, winners: 2, prizePerWinner: 72450747.46 },
      { year: 2010, contest: 1245, winners: 4, prizePerWinner: 48598800.01 },
      { year: 2011, contest: 1350, winners: 5, prizePerWinner: 35523497.52 },
      { year: 2012, contest: 1455, winners: 3, prizePerWinner: 81594699.72 },
      { year: 2013, contest: 1560, winners: 4, prizePerWinner: 56169465.02 },
      { year: 2014, contest: 1665, winners: 4, prizePerWinner: 65823888.16 },
      { year: 2015, contest: 1775, winners: 6, prizePerWinner: 41088919.05 },
      { year: 2016, contest: 1890, winners: 6, prizePerWinner: 36824758.22 },
      { year: 2017, contest: 2000, winners: 17, prizePerWinner: 18042279.04 },
      { year: 2018, contest: 2110, winners: 52, prizePerWinner: 5818007.36 },
      { year: 2019, contest: 2220, winners: 4, prizePerWinner: 76053459.66 },
      { year: 2020, contest: 2330, winners: 2, prizePerWinner: 162625108.22 },
      { year: 2021, contest: 2440, winners: 2, prizePerWinner: 189062363.74 },
      { year: 2022, contest: 2550, winners: 5, prizePerWinner: 108393993.26 },
      { year: 2023, contest: 2670, winners: 5, prizePerWinner: 117778204.25 },
      { year: 2024, contest: 2810, winners: 8, prizePerWinner: 79435770.67 },
      { year: 2025, contest: 2955, winners: 6, prizePerWinner: 181892881.09 },
    ],
  },
  lotofacil: {
    id: "lotofacil-da-independencia",
    lottery: "lotofacil",
    name: "Lotofácil da Independência",
    shortName: "Independência",
    schedule:
      "Todo ano em setembro, perto do 7 de Setembro — a data exata muda de ano para ano.",
    rule:
      "O prêmio principal não acumula: é dividido entre quem acerta 15 dezenas e, por ser um bolo bem maior, costuma sair para dezenas de apostadores.",
    windowMonths: [9],
    editions: [
      { year: 2012, contest: 800, winners: 14, prizePerWinner: 3072441.79 },
      { year: 2013, contest: 952, winners: 66, prizePerWinner: 1107491.15 },
      { year: 2014, contest: 1102, winners: 43, prizePerWinner: 1821021.77 },
      { year: 2015, contest: 1255, winners: 51, prizePerWinner: 1757073.66 },
      { year: 2016, contest: 1408, winners: 10, prizePerWinner: 8227506.94 },
      { year: 2017, contest: 1557, winners: 15, prizePerWinner: 5905591.0 },
      { year: 2018, contest: 1708, winners: 33, prizePerWinner: 2778857.6 },
      { year: 2019, contest: 1861, winners: 33, prizePerWinner: 3014770.55 },
      { year: 2020, contest: 2030, winners: 50, prizePerWinner: 2499998.2 },
      { year: 2021, contest: 2320, winners: 57, prizePerWinner: 2791889.55 },
      { year: 2022, contest: 2610, winners: 79, prizePerWinner: 2248149.1 },
      { year: 2023, contest: 2900, winners: 65, prizePerWinner: 2955552.77 },
      { year: 2024, contest: 3190, winners: 86, prizePerWinner: 2354726.3 },
      { year: 2025, contest: 3480, winners: 54, prizePerWinner: 4293824.84 },
    ],
  },
};

export function getSpecialSeries(lottery: LotteryId): SpecialSeries {
  return SPECIAL_SERIES[lottery];
}

/** Mês (1–12) de uma data "yyyy-mm-dd". */
function monthOf(date: string): number {
  return Number(date.slice(5, 7));
}

/**
 * A data cai na janela da série? Usado como trava da detecção automática:
 * a Caixa é quem diz que o concurso é especial, isto só evita que uma
 * marcação fora de época entre na série errada.
 */
export function isPlausibleSpecialDate(
  lottery: LotteryId,
  date: string
): boolean {
  return SPECIAL_SERIES[lottery].windowMonths.includes(monthOf(date));
}

/**
 * Ano da edição a partir da data de apuração. A Virada apurada em janeiro
 * pertence ao ano anterior — é a virada *daquele* ano que acabou.
 */
export function editionYearFor(lottery: LotteryId, date: string): number {
  const year = Number(date.slice(0, 4));
  if (lottery === "megasena" && monthOf(date) === 1) return year - 1;
  return year;
}

/**
 * Junta o catálogo com os concursos especiais descobertos na sincronização.
 * `detected` traz apenas concurso + data; o que já está no catálogo vence
 * (carrega premiação conferida) e o resto entra sem premiação, para ser
 * completado pela tabela de rateios.
 */
export function mergeEditions(
  series: SpecialSeries,
  detected: { contest: number; date: string }[]
): SpecialEdition[] {
  const byContest = new Map<number, SpecialEdition>(
    series.editions.map((e) => [e.contest, e])
  );
  for (const d of detected) {
    if (byContest.has(d.contest)) continue;
    if (!isPlausibleSpecialDate(series.lottery, d.date)) continue;
    byContest.set(d.contest, {
      year: editionYearFor(series.lottery, d.date),
      contest: d.contest,
      winners: null,
      prizePerWinner: null,
    });
  }
  return [...byContest.values()].sort((a, b) => a.contest - b.contest);
}
