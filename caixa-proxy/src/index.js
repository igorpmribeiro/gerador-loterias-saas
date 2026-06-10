/**
 * Proxy mínimo para a API de loterias da Caixa.
 *
 * A Caixa (servicebus2.caixa.gov.br) bloqueia IPs de datacenter/cloud (AWS),
 * então funções na Vercel recebem 403. Este Worker roda na rede da Cloudflare,
 * cujo IP costuma passar, e repassa o JSON para a aplicação.
 *
 * Travas de segurança (não é proxy aberto):
 *  - só método GET;
 *  - só repassa caminhos da própria API de loterias (regex restritiva);
 *  - exige a chave compartilhada `x-proxy-key` (segredo PROXY_KEY) quando definida.
 */
const CAIXA_BASE = "https://servicebus2.caixa.gov.br/portaldeloterias/api";

export default {
  async fetch(request, env) {
    if (request.method !== "GET") {
      return json({ error: "método não permitido" }, 405);
    }

    if (env.PROXY_KEY && request.headers.get("x-proxy-key") !== env.PROXY_KEY) {
      return json({ error: "não autorizado" }, 401);
    }

    const { pathname } = new URL(request.url);
    const sub = pathname.replace(/^\/+/, "");

    // Aceita apenas algo como "megasena", "lotofacil/3016" etc.
    if (!/^[a-z]+(\/\d+)?$/i.test(sub)) {
      return json({ error: "caminho inválido" }, 400);
    }

    let upstream;
    try {
      upstream = await fetch(`${CAIXA_BASE}/${sub}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "pt-BR,pt;q=0.9",
          Referer: "https://loterias.caixa.gov.br/",
        },
        // Cache na borda da Cloudflare: alivia a Caixa e acelera buscas
        // repetidas. Só cacheia sucesso — erros (403/500) não ficam grudados.
        cf: {
          cacheEverything: true,
          cacheTtlByStatus: { "200-299": 300, "300-599": 0 },
        },
      });
    } catch (err) {
      return json({ error: "falha ao contatar a Caixa", detail: String(err) }, 502);
    }

    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") || "application/json; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
