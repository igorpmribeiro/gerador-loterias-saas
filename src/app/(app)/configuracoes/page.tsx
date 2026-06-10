import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-server";
import { SettingsView } from "@/components/settings-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login?next=/configuracoes");
  }
  return (
    <SettingsView
      initialName={session.user.name ?? ""}
      email={session.user.email}
    />
  );
}
