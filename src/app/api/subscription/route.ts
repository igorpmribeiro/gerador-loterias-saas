import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-server";
import { getActiveSubscription, getSubscription } from "@/lib/subscriptions";
import { getDailyUsage } from "@/lib/usage";
import { countSavedGames } from "@/lib/saved-games";
import { FREE_LIMITS } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Estado do plano + uso do usuário atual — consumido pela página "Meu plano". */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }
  const userId = session.user.id;

  const [active, sub, generationsToday, savedGames] = await Promise.all([
    getActiveSubscription(userId),
    getSubscription(userId),
    getDailyUsage(userId, "generation"),
    countSavedGames(userId),
  ]);

  return NextResponse.json({
    plan: active ? "premium" : "free",
    status: sub?.status ?? null,
    billing: sub?.billing ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    usage: { generationsToday, savedGames },
    limits: FREE_LIMITS,
  });
}
