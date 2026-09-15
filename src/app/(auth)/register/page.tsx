import type { Metadata } from "next";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = {
  title: { absolute: "Criar conta grátis · Dezena" },
  description:
    "Crie sua conta grátis e gere jogos da Mega-Sena e da Lotofácil com análise estatística. Sem cartão de crédito.",
  alternates: { canonical: "/register" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.plano) ? sp.plano[0] : sp.plano;
  return <RegisterForm plan={raw === "premium" ? "premium" : "free"} />;
}
