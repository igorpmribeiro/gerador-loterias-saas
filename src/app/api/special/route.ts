import { NextRequest, NextResponse } from "next/server";
import { getDraws, getPrize, getSpecialDraws } from "@/lib/db";
import { getLottery, isLotteryId } from "@/lib/lotteries";
import { analyzeSpecials } from "@/lib/special-analysis";
import { getSpecialSeries, mergeEditions } from "@/lib/special-draws";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Análise dos sorteios especiais de uma loteria (Mega da Virada / Lotofácil
 * da Independência). Carrega o histórico inteiro de propósito: os concursos
 * comuns são a base de comparação da série.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lottery = searchParams.get("lottery") ?? "";
  if (!isLotteryId(lottery)) {
    return NextResponse.json({ error: "loteria inválida" }, { status: 400 });
  }

  const [draws, detected] = await Promise.all([
    getDraws(lottery),
    getSpecialDraws(lottery),
  ]);
  if (draws.length === 0) {
    return NextResponse.json(
      { error: "sem dados — sincronize o histórico primeiro" },
      { status: 409 }
    );
  }

  const cfg = getLottery(lottery);
  const series = getSpecialSeries(lottery);

  // Edições descobertas na sincronização não vêm com premiação no catálogo —
  // o rateio salvo pelo seeder completa a lacuna.
  const topHits = cfg.prizeTiers[0].hits;
  const editions = await Promise.all(
    mergeEditions(series, detected).map(async (e) => {
      if (e.winners !== null) return e;
      const prize = await getPrize(lottery, e.contest, topHits);
      return prize
        ? { ...e, winners: prize.winners, prizePerWinner: prize.amount }
        : e;
    })
  );

  const result = analyzeSpecials(draws, cfg, series, editions);

  if (result.totalEditions === 0) {
    return NextResponse.json(
      { error: `nenhuma edição da ${series.name} no histórico sincronizado` },
      { status: 409 }
    );
  }

  return NextResponse.json(result);
}
