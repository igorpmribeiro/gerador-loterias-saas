import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDraws } from "@/lib/db";
import { getLottery, isLotteryId } from "@/lib/lotteries";
import { generateGames, trainModel } from "@/lib/generator";
import { getCurrentSession } from "@/lib/auth-server";
import { isPremium } from "@/lib/subscriptions";
import { getDailyUsage, incrementDailyUsage } from "@/lib/usage";
import { FREE_LIMITS, PREMIUM_GAMES_PER_GENERATION } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  lottery: z.string().refine(isLotteryId, "loteria inválida"),
  strategy: z
    .enum(["ml", "hot", "overdue", "balanced", "random"])
    .default("ml"),
  picks: z.number().int().positive().optional(),
  count: z.number().int().min(1).max(20).default(5),
  /** Janela de concursos usada para treinar o modelo. */
  window: z.union([z.number().int().positive(), z.literal("all")]).optional(),
  seed: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "requisição inválida" },
      { status: 400 }
    );
  }

  // Gerar exige conta: sem isso, um visitante anônimo escaparia dos limites
  // do plano grátis (e a rota treina o modelo a cada chamada — CPU cara).
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "entre na sua conta para gerar jogos", code: "auth" },
      { status: 401 }
    );
  }
  const premium = await isPremium(session.user.id);

  // Plano grátis: limita o tamanho do lote e o nº de gerações por dia.
  const maxCount = premium
    ? PREMIUM_GAMES_PER_GENERATION
    : FREE_LIMITS.gamesPerGeneration;
  const count = Math.min(parsed.count, maxCount);

  if (!premium) {
    const used = await getDailyUsage(session.user.id, "generation");
    if (used >= FREE_LIMITS.generationsPerDay) {
      return NextResponse.json(
        {
          error: `limite de ${FREE_LIMITS.generationsPerDay} gerações por dia no plano grátis — desbloqueie o Premium vitalício para gerar sem limite`,
          code: "premium",
        },
        { status: 402 }
      );
    }
  }

  const cfg = getLottery(parsed.lottery);
  const limit =
    parsed.window && parsed.window !== "all" ? parsed.window : undefined;
  const draws = await getDraws(cfg.id, limit);

  if (draws.length < 20) {
    return NextResponse.json(
      { error: "histórico insuficiente — sincronize a loteria primeiro" },
      { status: 409 }
    );
  }

  const model = trainModel(draws, cfg);
  const games = generateGames(model, {
    strategy: parsed.strategy,
    picks: parsed.picks,
    count,
    seed: parsed.seed,
  });

  if (!premium) {
    await incrementDailyUsage(session.user.id, "generation");
  }

  return NextResponse.json({
    lottery: cfg.id,
    strategy: parsed.strategy,
    trainedOn: draws.length,
    games,
  });
}
