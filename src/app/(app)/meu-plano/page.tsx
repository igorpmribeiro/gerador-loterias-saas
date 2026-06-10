import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-server";
import { PlanView } from "@/components/plan-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login?next=/meu-plano");
  }
  return <PlanView />;
}
