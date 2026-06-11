import type { MetadataRoute } from "next";

const BASE = "https://www.dezena.app.br";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/analise`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/tabela`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/register`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
