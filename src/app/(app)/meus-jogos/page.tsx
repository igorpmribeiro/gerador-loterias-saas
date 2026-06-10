import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-server";
import { MyGamesView } from "@/components/my-games-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MyGamesPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login?next=/meus-jogos");
  }
  return <MyGamesView userName={session.user.name || session.user.email} />;
}
