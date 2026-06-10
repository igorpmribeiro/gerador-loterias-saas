import type { Draw, LotteryConfig, LotteryId } from "./lotteries";
import { getLottery } from "./lotteries";

const API_BASE = "https://servicebus2.caixa.gov.br/portaldeloterias/api";

interface CaixaRateio {
  descricaoFaixa?: string;
  faixa?: number;
  numeroDeGanhadores?: number;
  valorPremio?: number;
}

interface CaixaResponse {
  numero: number;
  dataApuracao: string;
  listaDezenas: string[];
  acumulado?: boolean;
  dataProximoConcurso?: string;
  numeroConcursoProximo?: number;
  valorEstimadoProximoConcurso?: number;
  valorAcumuladoProximoConcurso?: number;
  valorArrecadado?: number;
  localSorteio?: string;
  nomeMunicipioUFSorteio?: string;
  listaRateioPremio?: CaixaRateio[];
}

/** Converte "dd/mm/yyyy" -> "yyyy-mm-dd". */
function normalizeDate(br: string): string {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return br;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

async function fetchJson(url: string, retries = 3): Promise<CaixaResponse> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
      return (await res.json()) as CaixaResponse;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function toDraw(cfg: LotteryConfig, raw: CaixaResponse): Draw {
  return {
    lottery: cfg.id,
    contest: raw.numero,
    date: normalizeDate(raw.dataApuracao),
    numbers: raw.listaDezenas
      .map((n) => parseInt(n, 10))
      .sort((a, b) => a - b),
  };
}

export interface DrawPrize {
  lottery: LotteryId;
  contest: number;
  hits: number;
  label: string;
  winners: number;
  amount: number;
}

/**
 * Extrai as faixas de premiação no formato persistível.
 * A API da Caixa retorna `listaRateioPremio` ordenada da maior para a menor
 * premiação. cfg.prizeTiers segue a mesma ordem, então usamos índice para
 * associar `hits`.
 */
function toPrizes(cfg: LotteryConfig, raw: CaixaResponse): DrawPrize[] {
  const list = raw.listaRateioPremio ?? [];
  return list
    .slice(0, cfg.prizeTiers.length)
    .map((r, idx) => {
      const tier = cfg.prizeTiers[idx];
      return {
        lottery: cfg.id,
        contest: raw.numero,
        hits: tier.hits,
        label: r.descricaoFaixa?.trim() || tier.label,
        winners: r.numeroDeGanhadores ?? 0,
        amount: r.valorPremio ?? 0,
      };
    });
}

export interface DrawWithPrizes {
  draw: Draw;
  prizes: DrawPrize[];
}

/** Busca o concurso mais recente de uma loteria. */
export async function fetchLatest(lottery: LotteryId): Promise<Draw> {
  const cfg = getLottery(lottery);
  const raw = await fetchJson(`${API_BASE}/${cfg.apiPath}`);
  return toDraw(cfg, raw);
}

export interface PrizeTier {
  label: string;
  winners: number;
  prize: number;
}

export interface LotteryOverview {
  lottery: LotteryId;
  name: string;
  contest: number;
  date: string;
  numbers: number[];
  accumulated: boolean;
  nextDate: string | null;
  nextContest: number | null;
  estimatedNextPrize: number | null;
  accumulatedNextPrize: number | null;
  prizeTiers: PrizeTier[];
  drawLocation: string | null;
}

/** Busca o panorama do concurso mais recente (último resultado + próximo). */
export async function fetchOverview(
  lottery: LotteryId
): Promise<LotteryOverview> {
  const cfg = getLottery(lottery);
  const raw = await fetchJson(`${API_BASE}/${cfg.apiPath}`);

  const prizeTiers: PrizeTier[] = (raw.listaRateioPremio ?? []).map((r) => ({
    label: r.descricaoFaixa?.trim() || `Faixa ${r.faixa ?? "?"}`,
    winners: r.numeroDeGanhadores ?? 0,
    prize: r.valorPremio ?? 0,
  }));

  const location = [raw.localSorteio, raw.nomeMunicipioUFSorteio]
    .filter(Boolean)
    .join(" — ");

  return {
    lottery: cfg.id,
    name: cfg.name,
    contest: raw.numero,
    date: normalizeDate(raw.dataApuracao),
    numbers: raw.listaDezenas
      .map((n) => parseInt(n, 10))
      .sort((a, b) => a - b),
    accumulated: Boolean(raw.acumulado),
    nextDate: raw.dataProximoConcurso
      ? normalizeDate(raw.dataProximoConcurso)
      : null,
    nextContest: raw.numeroConcursoProximo ?? raw.numero + 1,
    estimatedNextPrize: raw.valorEstimadoProximoConcurso ?? null,
    accumulatedNextPrize: raw.valorAcumuladoProximoConcurso ?? null,
    prizeTiers,
    drawLocation: location || null,
  };
}

/** Busca um concurso específico. */
export async function fetchContest(
  lottery: LotteryId,
  contest: number
): Promise<Draw> {
  const cfg = getLottery(lottery);
  const raw = await fetchJson(`${API_BASE}/${cfg.apiPath}/${contest}`);
  return toDraw(cfg, raw);
}

/** Busca um concurso específico + faixas de premiação. */
export async function fetchContestWithPrizes(
  lottery: LotteryId,
  contest: number
): Promise<DrawWithPrizes> {
  const cfg = getLottery(lottery);
  const raw = await fetchJson(`${API_BASE}/${cfg.apiPath}/${contest}`);
  return { draw: toDraw(cfg, raw), prizes: toPrizes(cfg, raw) };
}

/** Executa tarefas com limite de concorrência. */
async function pool<T>(
  items: number[],
  concurrency: number,
  worker: (item: number) => Promise<T>,
  onProgress?: (done: number, total: number) => void
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;
  let done = 0;
  const total = items.length;

  async function run(): Promise<void> {
    while (index < items.length) {
      const i = index++;
      const r = await worker(items[i]);
      results[i] = r;
      done++;
      onProgress?.(done, total);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, run)
  );
  return results;
}

/**
 * Busca uma lista arbitrária de concursos em paralelo.
 * Concursos que falharem são silenciosamente ignorados.
 */
export async function fetchContests(
  lottery: LotteryId,
  contests: number[],
  onProgress?: (done: number, total: number) => void
): Promise<Draw[]> {
  const settled = await pool(
    contests,
    8,
    async (c) => {
      try {
        return await fetchContest(lottery, c);
      } catch {
        return null;
      }
    },
    onProgress
  );

  return settled
    .filter((d): d is Draw => d !== null)
    .sort((a, b) => a.contest - b.contest);
}

/** Igual a fetchContests, mas inclui as faixas de premiação. */
export async function fetchContestsWithPrizes(
  lottery: LotteryId,
  contests: number[],
  onProgress?: (done: number, total: number) => void
): Promise<DrawWithPrizes[]> {
  const settled = await pool(
    contests,
    8,
    async (c) => {
      try {
        return await fetchContestWithPrizes(lottery, c);
      } catch {
        return null;
      }
    },
    onProgress
  );

  return settled
    .filter((d): d is DrawWithPrizes => d !== null)
    .sort((a, b) => a.draw.contest - b.draw.contest);
}

/**
 * Busca um intervalo de concursos [from, to] em paralelo.
 * Concursos que falharem são silenciosamente ignorados.
 */
export async function fetchRange(
  lottery: LotteryId,
  from: number,
  to: number,
  onProgress?: (done: number, total: number) => void
): Promise<Draw[]> {
  const contests: number[] = [];
  for (let c = from; c <= to; c++) contests.push(c);
  return fetchContests(lottery, contests, onProgress);
}

/** Igual a fetchRange, mas inclui premiações. */
export async function fetchRangeWithPrizes(
  lottery: LotteryId,
  from: number,
  to: number,
  onProgress?: (done: number, total: number) => void
): Promise<DrawWithPrizes[]> {
  const contests: number[] = [];
  for (let c = from; c <= to; c++) contests.push(c);
  return fetchContestsWithPrizes(lottery, contests, onProgress);
}
