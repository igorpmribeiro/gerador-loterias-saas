import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { seedLottery, type SeedResult } from "@/lib/seeder";
import { isLotteryId, LOTTERY_LIST } from "@/lib/lotteries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Sincronização com a Caixa. Rota cara (fan-out de fetches + escrita em lote
 * + reavaliação de jogos salvos), por isso NÃO é exposta a visitantes:
 * exige o segredo de cron — o Vercel Cron envia `Authorization: Bearer
 * ${CRON_SECRET}` automaticamente quando a env está configurada.
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** GET — chamado pelo Vercel Cron: sincroniza todas as loterias. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const results: Array<SeedResult | { lottery: string; error: string }> = [];
  for (const cfg of LOTTERY_LIST) {
    try {
      results.push(await seedLottery(cfg.id));
    } catch (err) {
      console.error(`sync ${cfg.id} falhou:`, err);
      results.push({
        lottery: cfg.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return NextResponse.json({ results });
}

const Body = z.object({
  lottery: z.string().refine(isLotteryId, "loteria inválida"),
  maxContests: z.number().int().positive().optional(),
});

/** POST — uso manual/administrativo, protegido pelo mesmo segredo. */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "requisição inválida" },
      { status: 400 }
    );
  }

  try {
    const result = await seedLottery(
      parsed.lottery as Parameters<typeof seedLottery>[0],
      parsed.maxContests
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "falha ao sincronizar com a Caixa",
      },
      { status: 502 }
    );
  }
}
