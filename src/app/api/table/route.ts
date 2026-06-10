import { NextRequest, NextResponse } from "next/server";
import { getDraws } from "@/lib/db";
import { getLottery, isLotteryId } from "@/lib/lotteries";
import { buildDrawTable } from "@/lib/draw-table";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lottery = searchParams.get("lottery") ?? "";
  if (!isLotteryId(lottery)) {
    return NextResponse.json({ error: "loteria inválida" }, { status: 400 });
  }
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(100, Math.max(1, +limitParam)) : 20;

  const draws = await getDraws(lottery);
  if (draws.length === 0) {
    return NextResponse.json(
      { error: "sem dados — sincronize o histórico primeiro" },
      { status: 409 }
    );
  }

  const table = buildDrawTable(draws, getLottery(lottery));
  return NextResponse.json({
    lottery: table.lottery,
    rows: table.rows.slice(0, limit),
    cycle: table.cycle,
  });
}
