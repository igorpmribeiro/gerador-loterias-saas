import {
  fetchContestsWithPrizes,
  fetchLatestWithPrizes,
  fetchRangeWithPrizes,
  type DrawWithPrizes,
} from "./caixa";
import {
  countDraws,
  getLatestContest,
  getMissingContests,
  markSpecialDraws,
  setMeta,
  upsertDrawPrizes,
  upsertDraws,
} from "./db";
import type { LotteryId } from "./lotteries";
import { evaluateAllPending } from "./saved-games";
import { isPlausibleSpecialDate } from "./special-draws";

/**
 * Guarda as edições especiais que a Caixa marcou (Mega da Virada / Lotofácil
 * da Independência), para que a próxima edição apareça na análise sem
 * depender de um deploy. A janela de meses é só uma trava contra marcação
 * fora de época — quem decide é o indicador da Caixa.
 */
async function recordSpecials(
  lottery: LotteryId,
  items: DrawWithPrizes[]
): Promise<void> {
  const rows = items
    .filter((i) => i.special && isPlausibleSpecialDate(lottery, i.draw.date))
    .map((i) => ({ contest: i.draw.contest, date: i.draw.date }));
  await markSpecialDraws(lottery, rows);
}

export interface SeedResult {
  lottery: LotteryId;
  latestContest: number;
  inserted: number;
  totalStored: number;
}

/**
 * Popula o banco com o histórico de uma loteria.
 * @param maxContests limita a quantidade de concursos mais recentes
 *                    a buscar (undefined = histórico completo).
 */
export async function seedLottery(
  lottery: LotteryId,
  maxContests?: number,
  onProgress?: (done: number, total: number) => void
): Promise<SeedResult> {
  const latestItem = await fetchLatestWithPrizes(lottery);
  const latest = latestItem.draw;
  const stored = await getLatestContest(lottery);

  const fullStart = maxContests
    ? Math.max(1, latest.contest - maxContests + 1)
    : 1;
  // Já temos tudo abaixo de `stored`; busca apenas o que falta.
  const from = Math.max(fullStart, stored + 1);
  const to = latest.contest;

  let inserted = 0;
  if (from <= to) {
    const items = await fetchRangeWithPrizes(lottery, from, to, onProgress);
    inserted += await upsertDraws(items.map((i) => i.draw));
    await upsertDrawPrizes(items.flatMap((i) => i.prizes));
    await recordSpecials(lottery, items);
  }
  // Garante que o último concurso esteja salvo — com premiação e marca de
  // especial, caso a busca por intervalo acima tenha falhado justamente nele.
  await upsertDraws([latest]);
  await upsertDrawPrizes(latestItem.prizes);
  await recordSpecials(lottery, [latestItem]);

  // Tenta preencher lacunas (concursos que falharam em buscas anteriores).
  const missing = (await getMissingContests(lottery, latest.contest)).filter(
    (c) => c >= fullStart
  );
  if (missing.length > 0) {
    const recovered = await fetchContestsWithPrizes(
      lottery,
      missing,
      onProgress
    );
    inserted += await upsertDraws(recovered.map((i) => i.draw));
    await upsertDrawPrizes(recovered.flatMap((i) => i.prizes));
    await recordSpecials(lottery, recovered);
  }

  await setMeta(`lastSync:${lottery}`, new Date().toISOString());

  // Reavalia jogos salvos cujo intervalo abrange concursos já sincronizados.
  await evaluateAllPending(lottery);

  return {
    lottery,
    latestContest: latest.contest,
    inserted,
    totalStored: await countDraws(lottery),
  };
}

/** Sincroniza apenas concursos novos desde o último armazenado. */
export async function syncLottery(lottery: LotteryId): Promise<SeedResult> {
  return seedLottery(lottery);
}
