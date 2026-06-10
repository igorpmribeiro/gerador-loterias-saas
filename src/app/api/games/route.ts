import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isLotteryId, type LotteryId } from "@/lib/lotteries";
import {
  countSavedGames,
  listSavedGames,
  saveGame,
  type SavedGameKind,
} from "@/lib/saved-games";
import { getCurrentSession, UnauthorizedError } from "@/lib/auth-server";
import { isPremium } from "@/lib/subscriptions";
import { FREE_LIMITS } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  lottery: z.string().refine(isLotteryId, "loteria inválida"),
  numbers: z.array(z.number().int()).min(1),
  kind: z.enum(["single", "teimosinha"]),
  startContest: z.number().int().positive(),
  endContest: z.number().int().positive(),
  costPerDraw: z.number().nonnegative(),
  notes: z.string().max(280).optional().nullable(),
});

async function getUserOrError() {
  const session = await getCurrentSession();
  if (!session) throw new UnauthorizedError();
  return session.user;
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await getUserOrError();
  } catch {
    return NextResponse.json(
      { error: "entre na sua conta para salvar jogos" },
      { status: 401 }
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

  if (!(await isPremium(user.id))) {
    const current = await countSavedGames(user.id);
    if (current >= FREE_LIMITS.savedGames) {
      return NextResponse.json(
        {
          error: `o plano grátis guarda até ${FREE_LIMITS.savedGames} jogos — desbloqueie o Premium vitalício para salvar sem limite`,
          code: "premium",
        },
        { status: 402 }
      );
    }
  }

  try {
    const game = await saveGame(user.id, {
      lottery: parsed.lottery as LotteryId,
      numbers: parsed.numbers,
      kind: parsed.kind as SavedGameKind,
      startContest: parsed.startContest,
      endContest: parsed.endContest,
      costPerDraw: parsed.costPerDraw,
      notes: parsed.notes ?? null,
    });
    return NextResponse.json({ game }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "erro ao salvar" },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await getUserOrError();
  } catch {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lottery = searchParams.get("lottery") ?? "";
  const kind = searchParams.get("kind") ?? "";
  const createdFrom = searchParams.get("from") ?? undefined;

  const games = await listSavedGames(user.id, {
    lottery: isLotteryId(lottery) ? (lottery as LotteryId) : undefined,
    kind:
      kind === "single" || kind === "teimosinha"
        ? (kind as SavedGameKind)
        : undefined,
    createdFrom,
  });

  return NextResponse.json({ games });
}
