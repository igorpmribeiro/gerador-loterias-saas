import { NextRequest, NextResponse } from "next/server";
import { computeUserStats } from "@/lib/game-stats";
import { getCurrentSession } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const windowParam = Number(searchParams.get("window") ?? "30");
  const window = [7, 15, 30, 90].includes(windowParam) ? windowParam : 30;

  const stats = await computeUserStats(session.user.id, window);
  return NextResponse.json(stats);
}
