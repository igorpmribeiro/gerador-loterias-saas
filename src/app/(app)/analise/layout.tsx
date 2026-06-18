import type { Metadata } from "next";

/**
 * A página de análise é client (toggle de loteria + fetch via API), então a
 * metadata de SEO fica neste layout server. Title/description/canonical
 * próprios — sem eles a página herdava só o template padrão e não ranqueava.
 */
export const metadata: Metadata = {
  title: {
    absolute: "Números que mais saem na Mega-Sena e Lotofácil · Dezena",
  },
  description:
    "Veja os números que mais saem, as dezenas mais atrasadas, somas, pares e afinidades da Mega-Sena e da Lotofácil. Histórico completo da Caixa, grátis e sem cadastro.",
  alternates: { canonical: "/analise" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/analise",
    siteName: "Dezena",
    title: "Análise estatística da Mega-Sena e Lotofácil",
    description:
      "Frequência, atraso, somas e afinidade entre dezenas — todo o histórico da Caixa, grátis.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Dezena — análise estatística de loterias",
      },
    ],
  },
};

export default function AnaliseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
