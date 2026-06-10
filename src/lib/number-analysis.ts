import type { Draw, LotteryConfig } from "./lotteries";

export interface CompanionStat {
  number: number;
  /** Vezes em que companheiro e alvo saíram no mesmo concurso. */
  count: number;
  /** % de concursos analisados em que ambos saíram juntos. */
  percentage: number;
  /** % das aparições do alvo em que o companheiro também saiu. */
  coRate: number;
}

export interface TimelineEntry {
  contest: number;
  date: string;
  /** Gap em concursos desde a aparição anterior do alvo (ou desde o início). */
  gapFromPrevious: number;
}

export interface NumberDetailStat {
  lottery: string;
  number: number;
  totalDraws: number;
  range: { firstContest: number; lastContest: number };

  count: number;
  percentage: number;
  currentGap: number;
  maxGap: number;
  avgGap: number;
  /** Desvio padrão dos atrasos — leitura de regularidade. */
  stdevGap: number;
  lastContest: number | null;

  companions: {
    strong: CompanionStat[];
    weak: CompanionStat[];
  };

  sequence: {
    withPrev: number;
    withNext: number;
    inRunOf3Plus: number;
    isolated: number;
    totalAppearances: number;
  };

  /** Linha do tempo dos últimos 30 concursos em que o alvo saiu. */
  timeline: TimelineEntry[];
  /** Série completa de gaps + gap atual no fim — para sparkline. */
  gapHistory: number[];
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

export function analyzeNumber(
  draws: Draw[],
  cfg: LotteryConfig,
  target: number
): NumberDetailStat {
  if (target < cfg.min || target > cfg.max) {
    throw new Error(
      `número ${target} fora do volante (${cfg.min}–${cfg.max})`
    );
  }

  const ordered = [...draws].sort((a, b) => a.contest - b.contest);
  const total = ordered.length;
  const sets = ordered.map((d) => new Set(d.numbers));

  const appearances: number[] = [];
  ordered.forEach((_, idx) => {
    if (sets[idx].has(target)) appearances.push(idx);
  });

  /* --- Gaps --- */
  const gaps: number[] = [];
  let prev = -1;
  for (const i of appearances) {
    gaps.push(i - prev);
    prev = i;
  }
  const currentGap = total > 0 ? total - 1 - prev : 0;
  const gapHistory = [...gaps, currentGap];
  const maxGap = gapHistory.length ? Math.max(...gapHistory) : 0;
  const avgGap = gaps.length ? mean(gaps) : total;
  const stdevGap = gaps.length ? stdev(gaps) : 0;
  const count = appearances.length;

  /* --- Companheiros --- */
  const coCounts = new Map<number, number>();
  for (let n = cfg.min; n <= cfg.max; n++) {
    if (n !== target) coCounts.set(n, 0);
  }
  for (const idx of appearances) {
    for (const n of ordered[idx].numbers) {
      if (n !== target) coCounts.set(n, (coCounts.get(n) ?? 0) + 1);
    }
  }
  const companionStats: CompanionStat[] = [...coCounts.entries()].map(
    ([number, c]) => ({
      number,
      count: c,
      percentage: total > 0 ? (c / total) * 100 : 0,
      coRate: count > 0 ? (c / count) * 100 : 0,
    })
  );
  const strong = [...companionStats]
    .sort((a, b) => b.count - a.count || a.number - b.number)
    .slice(0, 5);
  const weak = [...companionStats]
    .sort((a, b) => a.count - b.count || a.number - b.number)
    .slice(0, 5);

  /* --- Padrão de sequência --- */
  let withPrev = 0;
  let withNext = 0;
  let inRunOf3Plus = 0;
  let isolated = 0;
  for (const idx of appearances) {
    const s = sets[idx];
    const hasPrev = target > cfg.min && s.has(target - 1);
    const hasNext = target < cfg.max && s.has(target + 1);
    const hasPrev2 = target - 1 > cfg.min && s.has(target - 2);
    const hasNext2 = target + 1 < cfg.max && s.has(target + 2);

    if (hasPrev) withPrev++;
    if (hasNext) withNext++;
    if (!hasPrev && !hasNext) isolated++;
    if ((hasPrev && hasPrev2) || (hasNext && hasNext2) || (hasPrev && hasNext)) {
      inRunOf3Plus++;
    }
  }

  /* --- Timeline (últimos 30) --- */
  const TIMELINE_SIZE = 30;
  const startIdx = Math.max(0, appearances.length - TIMELINE_SIZE);
  const timeline: TimelineEntry[] = [];
  for (let i = startIdx; i < appearances.length; i++) {
    const idx = appearances[i];
    const prevIdx = i > 0 ? appearances[i - 1] : -1;
    timeline.push({
      contest: ordered[idx].contest,
      date: ordered[idx].date,
      gapFromPrevious: idx - prevIdx,
    });
  }

  return {
    lottery: cfg.id,
    number: target,
    totalDraws: total,
    range: {
      firstContest: ordered[0]?.contest ?? 0,
      lastContest: ordered[ordered.length - 1]?.contest ?? 0,
    },
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
    currentGap,
    maxGap,
    avgGap,
    stdevGap,
    lastContest:
      appearances.length > 0
        ? ordered[appearances[appearances.length - 1]].contest
        : null,
    companions: { strong, weak },
    sequence: {
      withPrev,
      withNext,
      inRunOf3Plus,
      isolated,
      totalAppearances: count,
    },
    timeline,
    gapHistory,
  };
}
