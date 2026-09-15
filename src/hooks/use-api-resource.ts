"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ApiResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Refaz a requisição manualmente (ex.: botão "tentar novamente"). */
  reload: () => void;
}

/**
 * Busca um recurso JSON de uma rota interna e mantém estado de
 * carregamento/erro. Refaz a busca quando `url` muda ou quando `version`
 * é incrementado (usado para reagir a uma sincronização de dados).
 *
 * A requisição anterior é cancelada e, mesmo que chegue, é descartada: sem
 * isso a troca rápida de loteria podia terminar com os dados da loteria
 * antiga na tela, se a primeira resposta demorasse mais que a segunda.
 *
 * `initial` permite que o servidor entregue a primeira resposta já renderizada
 * (SSR): quando a URL pedida é a mesma que o servidor resolveu, a primeira
 * busca é pulada — a tela nasce com dado em vez de spinner, e o mesmo HTML
 * serve para o crawler.
 *
 * Espera que respostas de erro tragam `{ error: string }`.
 */
export function useApiResource<T>(
  url: string,
  version = 0,
  initial?: { url: string; data: T }
): ApiResource<T> {
  const hasInitial = initial !== undefined && initial.url === url;
  const [data, setData] = useState<T | null>(
    hasInitial ? (initial as { url: string; data: T }).data : null
  );
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);
  /** Incrementa a cada "tentar novamente" para refazer o efeito. */
  const [attempt, setAttempt] = useState(0);
  /** URL já satisfeita pelo servidor — enquanto ela valer, não busca. */
  const ssrUrl = useRef(hasInitial ? url : null);

  useEffect(() => {
    // Primeira renderização com dado do servidor: nada a buscar.
    if (ssrUrl.current === url && version === 0 && attempt === 0) return;

    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        const json = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(json.error ?? "falha ao carregar");
        setData(json as T);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "erro inesperado");
        setData(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
    // `version` e `attempt` não aparecem no corpo, mas são deps propositais:
    // mudá-los é o gatilho de uma nova busca.
  }, [url, version, attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);

  return { data, loading, error, reload };
}
