import { NextRequest, NextResponse } from "next/server";
import {
  deleteSavedGame,
  getSavedGameDetail,
} from "@/lib/saved-games";
import { getCurrentSession } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }
  const { id } = await params;
  const game = await getSavedGameDetail(id, session.user.id);
  if (!game) {
    return NextResponse.json(
      { error: "jogo não encontrado" },
      { status: 404 }
    );
  }
  return NextResponse.json({ game });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteSavedGame(id, session.user.id);
  if (!ok) {
    return NextResponse.json(
      { error: "jogo não encontrado" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
