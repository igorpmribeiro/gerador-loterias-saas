import { NextResponse } from "next/server";
import { countDraws, getLatestContest, getMeta } from "@/lib/db";
import { LOTTERY_LIST } from "@/lib/lotteries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const lotteries = await Promise.all(
    LOTTERY_LIST.map(async (cfg) => ({
      id: cfg.id,
      name: cfg.name,
      totalStored: await countDraws(cfg.id),
      latestContest: await getLatestContest(cfg.id),
      lastSync: await getMeta(`lastSync:${cfg.id}`),
    }))
  );
  return NextResponse.json({ lotteries });
}
