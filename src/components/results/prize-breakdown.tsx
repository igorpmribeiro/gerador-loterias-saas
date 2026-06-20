import type { PrizeRow } from "@/lib/db";
import { brl } from "@/lib/format";

/** Tabela de faixas de premiação de um concurso. */
export function PrizeBreakdown({ prizes }: { prizes: PrizeRow[] }) {
  if (prizes.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-secondary/50 text-xs text-muted-foreground">
            <th className="px-3 py-2 text-left font-medium">Faixa</th>
            <th className="px-3 py-2 text-right font-medium">Ganhadores</th>
            <th className="px-3 py-2 text-right font-medium">Prêmio</th>
          </tr>
        </thead>
        <tbody>
          {prizes.map((t) => (
            <tr key={t.hits} className="border-b last:border-0">
              <td className="px-3 py-2">{t.label}</td>
              <td className="px-3 py-2 text-right tnum">
                {t.winners.toLocaleString("pt-BR")}
              </td>
              <td className="px-3 py-2 text-right tnum">
                {t.amount > 0 ? brl(t.amount) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
