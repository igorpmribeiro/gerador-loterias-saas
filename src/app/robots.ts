import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Áreas autenticadas/transacionais não têm valor de indexação.
        disallow: ["/api/", "/painel", "/meus-jogos", "/meu-plano", "/historico", "/configuracoes"],
      },
    ],
    sitemap: "https://www.dezena.app.br/sitemap.xml",
  };
}
