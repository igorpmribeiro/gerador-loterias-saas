import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Corpo/UI: grotesca quente e legível para dados densos.
const sans = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

// Display: serifa editorial com caráter para títulos.
const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

// Números: tabular, alinhado em colunas.
const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dezena.app.br"),
  title: {
    default: "Dezena — Análise & Geração para Mega-Sena e Lotofácil",
    template: "%s · Dezena",
  },
  description:
    "Faça sua própria sorte com dados. Análise estatística e geração de jogos para Mega-Sena e Lotofácil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      // `dark` fixo: tema único navy — ativa as variantes `dark:` dos
      // componentes (cores afinadas para fundo escuro), sem toggle.
      className={`${sans.variable} ${display.variable} ${mono.variable} dark h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
