import { NextRequest, NextResponse } from "next/server";
import { getDraws } from "@/lib/db";
import { getLottery, isLotteryId } from "@/lib/lotteries";
import { analyze } from "@/lib/analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lottery = searchParams.get("lottery") ?? "";
  if (!isLotteryId(lottery)) {
    return NextResponse.json({ error: "loteria inválida" }, { status: 400 });
  }

  const windowParam = searchParams.get("window");
  // window = "all" ou um número de concursos
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

  const result = analyze(draws, getLottery(lottery));
  return NextResponse.json(result);
}
