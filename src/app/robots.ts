import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Áreas autenticadas/transacionais e ferramentas client "casca" (sem
        // metadata própria) não têm valor de indexação — bloqueadas para
        // preservar crawl budget. Se /gerador e /avaliador virarem páginas SEO
        // com metadata + conteúdo SSR, removê-las daqui e pôr no sitemap.
        disallow: [
          "/api/",
          "/painel",
          "/meus-jogos",
          "/meu-plano",
          "/historico",
          "/configuracoes",
          "/gerador",
          "/avaliador",
        ],
      },
    ],
    sitemap: "https://www.dezena.app.br/sitemap.xml",
  };
}
