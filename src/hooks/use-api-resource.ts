"use client";

import { useCallback, useEffect, useState } from "react";

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
 * Espera que respostas de erro tragam `{ error: string }`.
 */
export function useApiResource<T>(
  url: string,
  version = 0
): ApiResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "falha ao carregar");
      setData(json as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro inesperado");
      setData(null);
    } finally {
      setLoading(false);
    }
    // `version` não é usado no corpo, mas é dep proposital: ao mudar,
    // recria `load` e força um novo fetch (gatilho de sincronização).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, version]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { data, loading, error, reload: load };
}
