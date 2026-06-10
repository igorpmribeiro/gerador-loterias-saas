import Link from "next/link";
import { Brand } from "@/components/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r bg-card p-10 lg:flex">
        <Link href="/" className="inline-flex">
          <Brand />
        </Link>
        <div className="space-y-4">
          <p className="font-display text-4xl font-medium leading-[1.1] tracking-tight">
            Análise estatística <span className="text-brand-strong">+ ML</span>{" "}
            para Mega-Sena e Lotofácil
          </p>
          <p className="text-sm text-muted-foreground">
            Faça sua própria sorte com dados. Salve jogos, marque teimosinhas e
            acompanhe sua performance ao longo do tempo.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Loteria é jogo de azar. Aposte apenas o que pode perder.
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex lg:hidden">
            <Link href="/" className="inline-flex">
              <Brand />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
