import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { COMPANY } from "@/lib/legal";

const COLUMNS = [
  {
    title: "Produto",
    links: [
      { label: "Resultados das loterias", href: "/resultados" },
      { label: "Resultado da Mega-Sena", href: "/resultados/mega-sena" },
      { label: "Resultado da Lotofácil", href: "/resultados/lotofacil" },
      { label: "Análises", href: "/analise" },
      { label: "Sorteios especiais", href: "/especiais" },
      { label: "Tabela de concursos", href: "/tabela" },
    ],
  },
  {
    title: "Conta",
    links: [
      { label: "Entrar", href: "/login" },
      { label: "Criar conta grátis", href: "/register" },
      { label: "Planos", href: "/#planos" },
      { label: "Perguntas frequentes", href: "/#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos de Uso", href: "/termos" },
      { label: "Política de Privacidade", href: "/privacidade" },
      { label: "Jogo responsável", href: "/termos#nao-e" },
    ],
  },
];

/**
 * Rodapé do site, compartilhado entre a landing e as páginas públicas de SEO
 * (ex.: /resultados). As âncoras de seção apontam para `/#...` para funcionar
 * a partir de qualquer rota, não só da home.
 *
 * Os links têm 44px de altura no mobile (alvo de toque) e voltam ao ritmo
 * compacto a partir de `sm`, onde o ponteiro é preciso.
 */
export function LandingFooter() {
  return (
    <footer style={{ background: "var(--dz-navy)" }}>
      <div aria-hidden className="hairline-brand opacity-50" />
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Image
              src="/logo-desktop.png"
              alt="Dezena — análise e geração de jogos para loterias"
              width={720}
              height={181}
              sizes="144px"
              className="h-9 w-auto"
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Análise estatística e geração de jogos com machine learning para
              Mega-Sena e Lotofácil, com dados oficiais da Caixa.
            </p>
            <a
              href={`mailto:${COMPANY.supportEmail}`}
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-0"
            >
              <Mail aria-hidden className="size-4" strokeWidth={2} />
              {COMPANY.supportEmail}
            </a>
          </div>

          <nav
            aria-label="Rodapé"
            className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 md:gap-x-16"
          >
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-medium text-foreground">
                  {col.title}
                </p>
                <ul className="mt-1 space-y-0 sm:mt-3 sm:space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-0"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            O Dezena é um serviço independente de análise estatística, sem
            vínculo com a Caixa Econômica Federal. Loterias são jogos de azar:
            jogue com responsabilidade e apenas se for maior de 18 anos.
            Nenhuma análise ou jogo gerado aqui aumenta a sua chance real de
            prêmio.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            © 2026 {COMPANY.brand}
            {COMPANY.legalName && <> · {COMPANY.legalName}</>}
            {COMPANY.cnpj && <> · CNPJ {COMPANY.cnpj}</>}
          </p>
        </div>
      </div>
    </footer>
  );
}
