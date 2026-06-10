import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDraws } from "@/lib/db";
import { getLottery, isLotteryId } from "@/lib/lotteries";
import { checkGame, evaluateGame } from "@/lib/evaluator";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  lottery: z.string().refine(isLotteryId, "loteria inválida"),
  numbers: z.array(z.number().int()).min(1).max(30),
});

export async function POST(req: NextRequest) {
  // Rota pública que varre o histórico inteiro por chamada — limita por IP.
  if (!(await checkRateLimit(`evaluate:${clientIp(req)}`, { window: 60, max: 20 }))) {
    return NextResponse.json(
      { error: "muitas avaliações em sequência — aguarde um minuto" },
      { status: 429 }
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
  const numbers = parsed.numbers;
  const unique = [...new Set(numbers)];

  if (unique.length !== numbers.length) {
    return NextResponse.json(
      { error: "há dezenas repetidas no jogo" },
      { status: 400 }
    );
  }
  if (unique.some((n) => n < cfg.min || n > cfg.max)) {
    return NextResponse.json(
      { error: `as dezenas devem estar entre ${cfg.min} e ${cfg.max}` },
      { status: 400 }
    );
  }
  if (unique.length !== cfg.drawSize) {
    return NextResponse.json(
      { error: `marque exatamente ${cfg.drawSize} dezenas para avaliar` },
      { status: 400 }
    );
  }

  const draws = await getDraws(cfg.id);
  if (draws.length < 20) {
    return NextResponse.json(
      { error: "histórico insuficiente — sincronize a loteria primeiro" },
      { status: 409 }
    );
  }

  return NextResponse.json({
    lottery: cfg.id,
    evaluation: evaluateGame(unique, draws, cfg),
    check: checkGame(unique, draws, cfg),
  });
}
