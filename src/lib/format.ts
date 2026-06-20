/** Formatação de valores e datas reutilizada entre as telas. */

/** Formata um número como BRL. `compact` usa notação abreviada (ex.: R$ 1,2 mi). */
export function brl(value: number, compact = false): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  });
}

/** Converte "yyyy-mm-dd" -> "dd/mm/yyyy". Devolve o original se não casar. */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
