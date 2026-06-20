import { SiteHeader } from "@/components/site-header";
import { LandingFooter } from "@/components/landing-footer";

/**
 * Layout das páginas públicas de resultados (SEO): cabeçalho enxuto + rodapé
 * do site, fora do AppShell para manter o HTML leve e indexável.
 */
export default function ResultadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
