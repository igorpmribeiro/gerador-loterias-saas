import type { Metadata } from "next";

/**
 * A página da tabela é client (toggle de loteria + fetch via API), então a
 * metadata de SEO fica neste layout server. Title/description/canonical
 * próprios — sem eles a página herdava só o template padrão e não ranqueava.
 */
export const metadata: Metadata = {
  title: {
    absolute: "Tabela de concursos da Mega-Sena e Lotofácil · Dezena",
  },
  description:
    "Todos os concursos da Mega-Sena e da Lotofácil em tabela: dezenas sorteadas, soma, paridade, primos e sequências — direto da Caixa, atualizado a cada sorteio.",
  alternates: { canonical: "/tabela" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/tabela",
    siteName: "Dezena",
    title: "Tabela de concursos da Mega-Sena e Lotofácil",
    description:
      "Resultados de todos os concursos com soma, paridade e padrões — dados oficiais da Caixa.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Dezena — tabela de concursos de loterias",
      },
    ],
  },
};

export default function TabelaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
