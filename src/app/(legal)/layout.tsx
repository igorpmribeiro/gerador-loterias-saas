import { SiteHeader } from "@/components/site-header";
import { LandingFooter } from "@/components/landing-footer";

/**
 * Layout dos documentos legais (Termos e Privacidade). Modo leitura: coluna
 * estreita, medida confortável e nenhuma distração — o objetivo aqui é ser
 * entendido, não converter.
 */
export default function LegalLayout({
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
