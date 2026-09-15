import type { Metadata } from "next";

/**
 * Página client (depende do seletor de loteria), então a metadata de SEO vive
 * aqui no layout server. "Mega da Virada" e "Lotofácil da Independência" são
 * termos de busca sazonais fortíssimos — merecem title/description próprios.
 */
export const metadata: Metadata = {
  title: {
    absolute:
      "Mega da Virada e Lotofácil da Independência: números que mais saíram · Dezena",
  },
  description:
    "Análise só dos sorteios especiais: os números que mais saíram na Mega da Virada e na Lotofácil da Independência, dezenas que nunca saíram, soma, repetições e todas as edições já sorteadas.",
  alternates: { canonical: "/especiais" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/especiais",
    siteName: "Dezena",
    title: "Mega da Virada e Lotofácil da Independência — análise das edições",
    description:
      "Números que mais saíram, dezenas que nunca saíram e o perfil de cada edição dos sorteios especiais. Dados oficiais da Caixa.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Dezena — análise dos sorteios especiais",
      },
    ],
  },
};

export default function EspeciaisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
