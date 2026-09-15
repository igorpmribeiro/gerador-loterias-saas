import { isLotteryId, type LotteryId } from "./lotteries";

/** Janelas oferecidas no seletor da análise. "all" = histórico completo. */
export const ANALYSIS_WINDOWS = ["100", "300", "500", "1000", "all"] as const;
export type AnalysisWindow = (typeof ANALYSIS_WINDOWS)[number];

export const DEFAULT_WINDOW: AnalysisWindow = "all";
export const DEFAULT_LOTTERY: LotteryId = "megasena";

export function isAnalysisWindow(v: string): v is AnalysisWindow {
  return (ANALYSIS_WINDOWS as readonly string[]).includes(v);
}

/** Lê `?loteria=` aceitando apenas valores conhecidos. */
export function parseLotteryParam(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v && isLotteryId(v) ? v : DEFAULT_LOTTERY;
}

/** Lê `?janela=` aceitando apenas as opções do seletor. */
export function parseWindowParam(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v && isAnalysisWindow(v) ? v : DEFAULT_WINDOW;
}

/** Limite de concursos correspondente à janela (undefined = tudo). */
export function windowLimit(w: AnalysisWindow): number | undefined {
  return w === "all" ? undefined : Number(w);
}

/** URL da API para uma combinação loteria + janela. */
export function analysisApiUrl(lottery: LotteryId, w: AnalysisWindow): string {
  return `/api/analysis?lottery=${lottery}&window=${w}`;
}

/**
 * Caminho canônico da página. A loteria padrão fica sem parâmetro para não
 * criar duas URLs com o mesmo conteúdo; a janela padrão também é omitida.
 */
export function analysisPath(lottery: LotteryId, w: AnalysisWindow): string {
  const params = new URLSearchParams();
  if (lottery !== DEFAULT_LOTTERY) params.set("loteria", lottery);
  if (w !== DEFAULT_WINDOW) params.set("janela", w);
  const qs = params.toString();
  return qs ? `/analise?${qs}` : "/analise";
}
