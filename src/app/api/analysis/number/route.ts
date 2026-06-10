import { NextRequest, NextResponse } from "next/server";
import { getDraws } from "@/lib/db";
import { getLottery, isLotteryId } from "@/lib/lotteries";
import { analyzeNumber } from "@/lib/number-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lottery = searchParams.get("lottery") ?? "";
  if (!isLotteryId(lottery)) {
    return NextResponse.json({ error: "loteria inválida" }, { status: 400 });
  }
  if (lottery !== "lotofacil") {
    return NextResponse.json(
      { error: "análise individual disponível apenas para a Lotofácil" },
      { status: 400 }
    );
  }

  const numberParam = searchParams.get("number");
  const target = numberParam ? Number(numberParam) : NaN;
  const cfg = getLottery(lottery);
  if (!Number.isInteger(target) || target < cfg.min || target > cfg.max) {
    return NextResponse.json(
      { error: `número deve estar entre ${cfg.min} e ${cfg.max}` },
      { status: 400 }
    );
  }

  const windowParam = searchParams.get("window");
  const limit =
    windowParam && windowParam !== "all"
      ? Math.max(20, +windowParam)
      : undefined;

  const draws = await getDraws(lottery, limit);
  if (draws.length === 0) {
    return NextResponse.json(
      { error: "sem dados — sincronize o histórico primeiro" },
      { status: 409 }
    );
  }

  return NextResponse.json(analyzeNumber(draws, cfg, target));
}
