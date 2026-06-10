import { NextResponse } from "next/server";
import { fetchOverview } from "@/lib/caixa";
import { countDraws, getLatestContest } from "@/lib/db";
import { LOTTERY_LIST } from "@/lib/lotteries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const results = await Promise.allSettled(
    LOTTERY_LIST.map((l) => fetchOverview(l.id))
  );

  const lotteries = await Promise.all(
    results.map(async (r, i) => {
      const cfg = LOTTERY_LIST[i];
      const stored = {
        totalStored: await countDraws(cfg.id),
        latestStored: await getLatestContest(cfg.id),
      };
      if (r.status === "fulfilled") {
        return { ok: true as const, ...r.value, ...stored };
      }
      return {
        ok: false as const,
        lottery: cfg.id,
        name: cfg.name,
        error: "não foi possível consultar a Caixa agora",
        ...stored,
      };
    })
  );

  return NextResponse.json({ lotteries });
}
