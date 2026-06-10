import { NextRequest, NextResponse } from "next/server";
import { getDraws } from "@/lib/db";
import { isLotteryId } from "@/lib/lotteries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lottery = searchParams.get("lottery") ?? "";
  if (!isLotteryId(lottery)) {
    return NextResponse.json({ error: "loteria inválida" }, { status: 400 });
  }
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(500, Math.max(1, +limitParam)) : 50;

  const draws = await getDraws(lottery, limit);
  return NextResponse.json({ lottery, count: draws.length, draws });
}
