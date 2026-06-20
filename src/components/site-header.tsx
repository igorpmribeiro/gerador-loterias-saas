import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Cabeçalho enxuto para páginas públicas de conteúdo/SEO (ex.: /resultados),
 * onde não existem as seções da landing. Logo + links reais (não âncoras) +
 * CTA de conta.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center"
          aria-label="Dezena — página inicial"
        >
          <Image
            src="/logo-desktop.png"
            alt="Dezena — análise e geração de jogos para loterias"
            width={720}
            height={181}
            priority
            sizes="144px"
            className="hidden h-9 w-auto lg:block"
          />
          <Image
            src="/logo-mobile.png"
            alt="Dezena"
            width={148}
            height={102}
            priority
            sizes="56px"
            className="h-9 w-auto lg:hidden"
          />
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex lg:gap-7">
          <Link
            href="/resultados"
            className="transition-colors hover:text-foreground"
          >
            Resultados
          </Link>
          <Link
            href="/analise"
            className="transition-colors hover:text-foreground"
          >
            Análises
          </Link>
          <Link
            href="/tabela"
            className="transition-colors hover:text-foreground"
          >
            Tabela
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Criar conta grátis</Link>
          </Button>
        </div>
      </div>
      <div aria-hidden className="hairline-brand opacity-70" />
    </header>
  );
}
