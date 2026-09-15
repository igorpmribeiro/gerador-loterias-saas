import type { MetadataRoute } from "next";

const BASE = "https://www.dezena.app.br";

export default function sitemap(): MetadataRoute.Sitemap {
  // As páginas de dados são alimentadas pela sincronização diária da Caixa; o
  // lastModified sinaliza esse frescor ao crawler (priority/changeFreq o
  // Google praticamente ignora hoje). /login fica de fora — valor de busca ~0.
  //
  // /analise e /tabela entram uma vez por loteria: cada recorte tem título,
  // descrição e canônico próprios, e responde a uma busca diferente
  // ("números que mais saem na lotofácil" ≠ "...na mega-sena").
  const fresh = new Date();
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/resultados`, lastModified: fresh, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/resultados/mega-sena`, lastModified: fresh, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/resultados/lotofacil`, lastModified: fresh, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/analise`, lastModified: fresh, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/analise?loteria=lotofacil`, lastModified: fresh, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/especiais`, lastModified: fresh, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/tabela`, lastModified: fresh, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/tabela?loteria=lotofacil`, lastModified: fresh, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/register`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/termos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
