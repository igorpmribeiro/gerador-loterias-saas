import Image from "next/image";
import Link from "next/link";

const COLUMNS = [
  {
    title: "Produto",
    links: [
      { label: "Resultados das loterias", href: "/resultados" },
      { label: "Análises", href: "/analise" },
      { label: "Tabela de concursos", href: "/tabela" },
      { label: "Recursos", href: "/#recursos" },
      { label: "Planos", href: "/#planos" },
    ],
  },
  {
    title: "Conta",
    links: [
      { label: "Entrar", href: "/login" },
      { label: "Criar conta grátis", href: "/register" },
      { label: "Perguntas frequentes", href: "/#faq" },
    ],
  },
];

/**
 * Rodapé do site, compartilhado entre a landing e as páginas públicas de SEO
 * (ex.: /resultados). As âncoras de seção apontam para `/#...` para funcionar
 * a partir de qualquer rota, não só da home.
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
          </div>
          <nav aria-label="Rodapé" className="flex gap-16">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-medium text-foreground">
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
          </p>
          <p className="mt-3 text-xs text-muted-foreground">© 2026 Dezena</p>
        </div>
      </div>
    </footer>
  );
}
