import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDraws } from "@/lib/db";
import { getLottery, isLotteryId } from "@/lib/lotteries";
import { trainModel } from "@/lib/generator";
import { buildWheel, WHEEL_LIMITS } from "@/lib/wheeling";
import { getCurrentSession } from "@/lib/auth-server";
import { isPremium } from "@/lib/subscriptions";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/wheel?lottery=&size= → sugere um grupo de dezenas via modelo. */
export async function GET(req: NextRequest) {
  // Pública e treina o modelo a cada chamada — limita por IP.
  if (!(await checkRateLimit(`wheel:${clientIp(req)}`, { window: 60, max: 20 }))) {
    return NextResponse.json(
      { error: "muitas requisições em sequência — aguarde um minuto" },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const lottery = searchParams.get("lottery") ?? "";
  if (!isLotteryId(lottery)) {
    return NextResponse.json({ error: "loteria inválida" }, { status: 400 });
  }
  const cfg = getLottery(lottery);
  const size = Math.max(
    cfg.drawSize + 1,
    Math.min(cfg.max, +(searchParams.get("size") ?? cfg.drawSize + 2))
  );

  const draws = await getDraws(lottery, 500);
  if (draws.length < 20) {
    return NextResponse.json(
      { error: "histórico insuficiente — sincronize a loteria" },
      { status: 409 }
    );
  }

  const model = trainModel(draws, cfg);
  const ranked = model.weights
    .map((w, i) => ({ n: i + cfg.min, w }))
    .sort((a, b) => b.w - a.w)
    .slice(0, size)
    .map((x) => x.n)
    .sort((a, b) => a - b);

  return NextResponse.json({ lottery, pool: ranked });
}

const Body = z.object({
  lottery: z.string().refine(isLotteryId, "loteria inválida"),
  pool: z.array(z.number().int()).min(2),
  mode: z.enum(["full", "reduced"]),
  guarantee: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "entre na sua conta para usar fechamentos", code: "auth" },
      { status: 401 }
    );
  }
  if (!(await isPremium(session.user.id))) {
    return NextResponse.json(
      {
        error: "os fechamentos (wheeling) são exclusivos do plano Premium",
        code: "premium",
      },
      { status: 402 }
    );
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

  const cfg = getLottery(parsed.lottery);
  const limits = WHEEL_LIMITS[cfg.id];
  const range = parsed.mode === "full" ? limits.full : limits.reduced;
  const pool = [...new Set(parsed.pool)];

  if (pool.some((n) => n < cfg.min || n > cfg.max)) {
    return NextResponse.json(
      { error: "há dezenas fora do volante" },
      { status: 400 }
    );
  }
  if (pool.length < range.min || pool.length > range.max) {
    return NextResponse.json(
      {
        error: `o grupo deve ter de ${range.min} a ${range.max} dezenas para este modo`,
      },
      { status: 400 }
    );
  }
  if (
    parsed.mode === "reduced" &&
    (!parsed.guarantee ||
      !limits.reduced.guarantees.includes(parsed.guarantee))
  ) {
    return NextResponse.json(
      {
        error: `garantia inválida — use uma de: ${limits.reduced.guarantees.join(
          ", "
        )}`,
      },
      { status: 400 }
    );
  }

  try {
    const result = buildWheel({
      lottery: cfg.id,
      pool,
      gameSize: cfg.drawSize,
      betPrice: cfg.betPrice,
      mode: parsed.mode,
      guarantee: parsed.guarantee,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "falha no fechamento" },
      { status: 422 }
    );
  }
}
